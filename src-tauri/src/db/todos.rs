use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum Type {
    Task,
    TaskGroup,
}

pub enum FetchBasis {
    // Fetch active items.
    Active,
    // Fetch completed tasks.
    Completed,
    // Fetch all items under a common parent.
    ByParentId(u64),
    // Fetch by id.
    ById(u64),
    // Fetch only tasks.
    OnlyTasks,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum Field {
    Name(String),
    Parent(u64),
    Status(bool),
}

#[derive(Serialize, Debug, Clone)]
pub struct Todo {
    pub id: u64,
    pub name: String,

    #[serde(flatten)]
    pub todo_type: Type,

    // Optional because groups can't be active.
    pub is_active: Option<bool>,
    // Optional because root group has no parent.
    pub parent_group_id: Option<u64>,
    // Optional because tasks have no children.
    pub children: Option<Vec<Todo>>,
}

impl Todo {
    fn new(
        id: u64,
        name: String,
        todo_type: Type,
        is_active: Option<bool>,
        parent_group_id: Option<u64>,
        children: Option<Vec<Todo>>,
    ) -> Self {
        Todo {
            id,
            name,
            todo_type,
            is_active,
            parent_group_id,
            children,
        }
    }
}

pub mod commands {
    use std::collections::HashMap;

    use super::{FetchBasis, Field, Todo, Type};
    use rusqlite::{params, Connection, Result as SQLiteResult};
    use tauri::State;

    use crate::db::init::DbConn;

    pub const ROOT_GROUP: &str = "/";
    pub const TODAY: &str = "today";
    const TASK: &str = "Task";
    const TASK_GROUP: &str = "TaskGroup";

    #[tauri::command(rename_all = "snake_case")]
    pub fn add_todo(
        conn: State<'_, DbConn>,
        table: &str,
        name: &str,
        parent_group_id: u64,
        todo_type: Type,
    ) -> i64 {
        let db_conn = conn.lock().unwrap();

        let command = format!(
            "INSERT INTO {table} (name, type, is_active, parent_group_id) VALUES (?1, ?2, ?3, ?4)",
        );

        let is_active = match todo_type {
            Type::Task => Some(1u64),
            Type::TaskGroup => None,
        };

        let todo_type = match todo_type {
            Type::Task => TASK,
            Type::TaskGroup => TASK_GROUP,
        };

        let mut stmt = db_conn
            .prepare(&command)
            .expect("[Error] Could not prepare statement");
        match stmt.insert(params![name, todo_type, is_active, parent_group_id]) {
            Err(err) => panic!(
                "[ERROR] Error occurred while trying to insert item: {}",
                err.to_string()
            ),
            Ok(id) => id,
        }
    }

    #[tauri::command(rename_all = "snake_case")]
    pub fn get_todos(db_conn: State<'_, DbConn>, table: &str, status: bool) -> String {
        let conn = db_conn.lock().unwrap();
        let by = match status {
            false => FetchBasis::Completed,
            true => FetchBasis::Active,
        };
        let rows_option = fetch_todos(&conn, table, by);

        match status {
            false => match rows_option {
                Err(e) => panic!("[ERROR] Couldn't fetch completed todos from the database: {e}"),
                Ok(rows) => {
                    return serde_json::to_string(&rows)
                        .expect("[ERROR] Couldn't serialize completed todos!");
                }
            },
            true => match create_active_tasks_view(&(rows_option.unwrap())) {
                Ok(root) => return serde_json::to_string(&root)
                  .expect("[ERROR] Cannot parse the root group into JSON."),
                Err(e) => return serde_json::json!({ "error": format!("Failed to fetch records: {}", e) })
                  .to_string(),
            }
        }
    }

    #[tauri::command(rename_all = "snake_case")]
    pub fn update_todo(db_conn: State<'_, DbConn>, table: &str, id: u64, field: Field) {
        let conn = db_conn.lock().unwrap();

        match field {
            Field::Name(name) => update_name(&conn, table, &name, id),
            Field::Parent(new_pid) => update_parent(&conn, table, id, new_pid),
            Field::Status(status) => update_status(&conn, table, id, status),
        }
    }

    // TODO Remember to change the type parameter in the frontend.
    #[tauri::command(rename_all = "snake_case")]
    pub fn delete_todo(db_conn: State<'_, DbConn>, table: &str, id: u64, todo_type: Type) {
        let conn = db_conn.lock().unwrap();

        match todo_type {
            Type::Task => delete_task(&conn, table, id),
            Type::TaskGroup => delete_group(&conn, table, id),
        }
    }

    /* ------------------------------------ Helper Functions ------------------------------------ */

    pub fn fetch_todos(conn: &Connection, table: &str, by: FetchBasis) -> SQLiteResult<Vec<Todo>> {
        let mut stmt = match by {
            FetchBasis::Active => conn.prepare(&format!(
                "SELECT * FROM {table} WHERE is_active=1 OR type='{TASK_GROUP}'"
            ))?,
            FetchBasis::Completed => {
                conn.prepare(&format!("SELECT * FROM {table} WHERE is_active={}", 0u64))?
            }
            FetchBasis::ByParentId(pid) => conn.prepare(&format!(
                "SELECT * FROM {table} WHERE parent_group_id={pid}"
            ))?,
            FetchBasis::ById(id) => {
                conn.prepare(&format!("SELECT * FROM today WHERE id={}", id))?
            }
            FetchBasis::OnlyTasks => {
                conn.prepare(&format!("SELECT * FROM today WHERE type='Task'"))?
            }
        };

        let task_record_iter = stmt.query_map([], |row| {
            let id: u64 = row.get(0)?;
            let name: String = row.get(1)?;
            let type_str: String = row.get(2)?;
            let is_active: Option<i32> = row.get(3)?;
            let parent_group_id: Option<u64> = row.get(4)?;

            let is_active = match is_active {
                Some(0) => Some(false),
                Some(1) => Some(true),
                // If for whatever reason, is_active has a value other than 0 or 1, None is set.
                Some(_) => None,
                None => None,
            };

            let todo_type = match type_str.as_str() {
                TASK => Type::Task,
                TASK_GROUP => Type::TaskGroup,
                _ => panic!("Unknown task_record type"),
            };

            Ok(Todo::new(
                id,
                name,
                todo_type,
                is_active,
                parent_group_id,
                None,
            ))
        })?;

        task_record_iter.collect()
    }

    /// Forms the nested root TaskGroup containing all tasks/groups expected by frontend.
    /// Uses DFS traversal.
    /// Root [task, group[task, task, group [task]], task]
    fn build_todos_r(
        id: u64,
        children_map: &mut HashMap<u64, Vec<Todo>>,
        pid: Option<u64>,
        group_info: &HashMap<u64, Todo>,
    ) -> Todo {
        // This will hold all the children (including descendents) of a parent group.
        let mut final_children: Vec<Todo> = Vec::new();

        // Access the children of the parent whose id = function parameter id.
        if let Some(children) = children_map.remove(&id) {
            // Iterate through each child.
            for child in children {
                match child.todo_type {
                    // If the child is a task, simply push it in.
                    Type::Task => final_children.push(child),
                    // If it's a group, set its children before pushing it in.
                    Type::TaskGroup => final_children.push(build_todos_r(
                        child.id,
                        children_map,
                        child.parent_group_id,
                        group_info,
                    )),
                }
            }
        }

        let record_name = group_info.get(&id).cloned().unwrap().name;

        // Finally, return the group formed.
        // In the end, the root group is returned with all the children nested correctly.
        Todo::new(
            id,
            record_name,
            Type::TaskGroup,
            None,
            pid,
            Some(final_children),
        )
    }

    fn create_active_tasks_view(rows: &[Todo]) -> SQLiteResult<Todo> {
        // Holds the rows mapped by their ids.
        let mut todo_map: HashMap<u64, Todo> = HashMap::new();
        let mut parent_map: HashMap<u64, Vec<u64>> = HashMap::new();

        for todo in rows {
            todo_map.insert(
                todo.id,
                Todo::new(
                    todo.id,
                    todo.name.clone(),
                    todo.todo_type,
                    todo.is_active,
                    todo.parent_group_id,
                    {
                        match todo.todo_type {
                            Type::Task => None,
                            Type::TaskGroup => Some(vec![]),
                        }
                    },
                ),
            );

            if let Some(pid) = todo.parent_group_id {
                parent_map.entry(pid).or_insert_with(Vec::new).push(todo.id);
            }
        }

        let temp = todo_map.clone();

        let mut children_map: HashMap<u64, Vec<Todo>> = HashMap::new();

        for (pid, children_ids) in parent_map {
            for cid in children_ids {
                if let Some(child) = todo_map.remove(&cid) {
                    children_map.entry(pid).or_insert_with(Vec::new).push(child);
                }
            }
        }

        let root = build_todos_r(0, &mut children_map, None, &temp);

        Ok(root)
    }

    fn update_name(conn: &Connection, table: &str, name: &str, id: u64) {
        let command = format!("UPDATE {table} SET name=(?1) WHERE id=(?2)");

        match conn.execute(&command, params![name, id]) {
            Ok(_) => (),
            Err(err) => println!("[ERROR] Could not update task: {}", err.to_string()),
        }
    }

    fn update_parent(conn: &Connection, table: &str, id: u64, new_pid: u64) {
        let command = format!("UPDATE {table} SET parent_group_id=(?1) WHERE id=(?2)");

        match conn.execute(&command, params![new_pid, id]) {
            Ok(_) => (),
            Err(err) => println!("[ERROR] Could not update task: {}", err.to_string()),
        }
    }

    fn update_status(conn: &Connection, table: &str, id: u64, status: bool) {
        let is_active = match status {
            // the status parameter holds the checked status of associated checkbox.
            // true = task completed, therefore is_active = false,
            true => 0u64,
            // false = task incomplete, therefore is_active = true,
            false => 1u64,
        };

        let command = format!("UPDATE {table} SET is_active=(?1) WHERE id=(?2)");

        match conn.execute(&command, params![is_active, id]) {
            Ok(_) => (),
            Err(err) => panic!(
                "[ERROR] could not update status of task: {}",
                err.to_string()
            ),
        }
    }

    fn delete_task(conn: &Connection, table: &str, id: u64) {
        let command = format!("DELETE FROM {table} WHERE id={id}");
        match conn.execute(&command, []) {
            Err(err) => println!("[ERROR] Could not delete task: {}", err.to_string()),
            Ok(_) => (),
        }
    }

    fn delete_group(conn: &Connection, table: &str, id: u64) {
        // Fetch the children of To-Be-Deleted group.
        let children = match fetch_todos(conn, table, FetchBasis::ByParentId(id)) {
            Ok(children) => children,
            Err(err) => {
                panic!("[ERROR] Something went wrong while fetching children: {err}")
            }
        };

        if children.is_empty() {
            let command = format!("DELETE FROM {table} WHERE id={id}");
            match conn.execute(&command, []) {
                Ok(_) => (),
                Err(err) => {
                    panic!("[ERROR] Error occurred while deleting group {id}: {err}")
                }
            };
        } else {
            for child in children {
                match child.todo_type {
                    Type::Task => delete_task(conn, table, child.id),
                    Type::TaskGroup => delete_group(conn, table, child.id),
                }
            }

            let command = format!("DELETE FROM {table} WHERE id={id}");
            match conn.execute(&command, []) {
                Ok(_) => (),
                Err(err) => panic!("[ERROR] Error occurred while deleting group {id}: {err}"),
            }
        };
    }
}
