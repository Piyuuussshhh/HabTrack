use lazy_static::lazy_static;
use std::sync::Mutex;

const ROOT_GROUP: &str = "/";
const TASK: &str = "Task";
const TASK_GROUP: &str = "TaskGroup";
const TODAY: &str = "today";

// Singleton because we need a single point of access to the db across the app.
// Mutex because only one process should be able to use the singleton at a time,
// to prevent race conditions.
// Default because we need to set the db_path according to the specific user of the app.
// We do this in tauri::Builder::default().setup() in main.rs
lazy_static! {
    pub static ref DB_SINGLETON: Mutex<Db> = Mutex::new(Db::default());
}

use chrono::Local;
use core::panic;
use rusqlite::{params, Connection, Result};
use serde::Serialize;
use std::{collections::HashMap, path::PathBuf};

#[derive(Serialize, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum Type {
    Task,
    TaskGroup,
}

#[derive(Serialize, Debug, Clone)]
pub struct TaskRecord {
    id: u64,
    name: String,

    #[serde(flatten)]
    task_record_type: Type,

    // Optional because groups can't be active.
    is_active: Option<bool>,
    // Optional because root group has no parent.
    parent_group_id: Option<u64>,
    // Optional because tasks have no children.
    children: Option<Vec<TaskRecord>>,
}

impl TaskRecord {
    fn new(
        id: u64,
        name: String,
        task_record_type: Type,
        is_active: Option<bool>,
        parent_group_id: Option<u64>,
        children: Option<Vec<TaskRecord>>,
    ) -> Self {
        TaskRecord {
            id,
            name,
            task_record_type,
            is_active,
            parent_group_id,
            children,
        }
    }
}

pub enum FetchBasis {
    // Fetch all items.
    Active,
    // Fetch only active or completed tasks.
    Completed,
    // Fetch all items under a common parent.
    ByParent(u64),
}

pub struct Db {
    pub db_conn: Option<Connection>,
}

impl Default for Db {
    fn default() -> Self {
        Self { db_conn: None }
    }
}

impl Db {
    pub fn set_conn(&mut self, db_path: &str) -> Result<()> {
        let conn = Connection::open(db_path)?;
        self.db_conn = Some(conn);

        self.create_tables()?;
        self.migrate_tasks()?;

        Ok(())
    }

    fn create_tables(&self) -> Result<()> {
        /*
            is_active and parent_group_id can be null.
                -> is_active because the record could be a group
                -> parent_group_id because the root group "/" isn't in any
                   other group.

            parent_group_id stores the ID of the parent group.
        */
        if let Some(conn) = &self.db_conn {
            // TODAY.
            conn.execute(
                "CREATE TABLE IF NOT EXISTS today (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    is_active INTEGER,
                    parent_group_id INTEGER,
                    created_at DATE DEFAULT (datetime('now','localtime')) NOT NULL
                )",
                [],
            )?;
            // Only add the root group when the table is created for the first time.
            conn.execute(
                    &format!("INSERT INTO today (id, name, type) VALUES (0, '{ROOT_GROUP}', 'TaskGroup') ON CONFLICT DO NOTHING"),
                    [],
                )?;

            // TOMORROW.
            conn.execute(
                "CREATE TABLE IF NOT EXISTS tomorrow (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    is_active INTEGER,
                    parent_group_id INTEGER
                )",
                [],
            )?;
            // Only add the root group when the table is created for the first time.
            conn.execute(
                    &format!("INSERT INTO tomorrow (id, name, type) VALUES (0, '{ROOT_GROUP}', 'TaskGroup') ON CONFLICT DO NOTHING"),
                    [],
                )?;

            conn.execute(
                "CREATE TABLE IF NOT EXISTS migration_log (
                        date TEXT PRIMARY KEY
                    )",
                [],
            )?;
        }

        Ok(())
    }

    fn migrate_tasks(&self) -> Result<()> {
        if let Some(conn) = &self.db_conn {
            let today = Local::now().naive_local().date();

            let last_migration_date: Option<String> =
                match conn.query_row("SELECT MAX(date) FROM migration_log", [], |row| row.get(0)) {
                    Ok(latest_date) => latest_date,
                    Err(err) => panic!("{err}"),
                };

            if last_migration_date != Some(today.to_string()) {
                // Delete completed tasks from today.
                conn.execute("DELETE FROM today WHERE is_active=0", [])?;

                let max_id: Option<i64> =
                    match conn.query_row("SELECT MAX(id) from today", [], |row| row.get(0)) {
                        Ok(val) => val,
                        Err(err) => panic!("{err}"),
                    };

                // Update ids of all tasks in tomorrow so that uniqueness is maintained.
                conn.execute(
                    "UPDATE tomorrow SET id=id+(?1) WHERE id!=0",
                    params![max_id],
                )?;

                // Update parent_group_ids of all migrated rows.
                conn.execute("UPDATE tomorrow SET parent_group_id=parent_group_id+(?1) WHERE parent_group_id!=0", params![max_id],)?;

                // Migrate tasks
                conn.execute(
                        &format!("INSERT INTO today (id, name, type, is_active, parent_group_id)
                    SELECT id, name, type, is_active, parent_group_id FROM tomorrow WHERE name!='{ROOT_GROUP}'"),
                        [],
                    )?;

                // Clear tomorrow's tasks
                conn.execute(
                    &format!("DELETE FROM tomorrow WHERE name!='{ROOT_GROUP}'"),
                    [],
                )?;

                // Log the migration
                conn.execute(
                    "INSERT INTO migration_log (date) VALUES (?1)",
                    params![today.to_string()],
                )?;
            } else if last_migration_date == None {
                // Log the migration
                conn.execute(
                    "INSERT INTO migration_log (date) VALUES (?1)",
                    params![today.to_string()],
                )?;
            }
        }

        Ok(())
    }

    // TODO: get_final_structure() is recursive, an iterative alternative exists.

    /// Forms the nested root TaskGroup containing all tasks/groups expected by frontend.
    /// Uses DFS traversal.
    /// Root [task, group[task, task, group [task]], task]
    fn get_final_structure(
        &self,
        id: u64,
        children_map: &mut HashMap<u64, Vec<TaskRecord>>,
        group_info: &HashMap<u64, TaskRecord>,
    ) -> TaskRecord {
        // This will hold all the children (including descendents) of a parent group.
        let mut final_children: Vec<TaskRecord> = Vec::new();

        // Access the children of the parent whose id = function parameter id.
        if let Some(children) = children_map.remove(&id) {
            // Iterate through each child.
            for child in children {
                match child.task_record_type {
                    // If the child is a task, simply push it in.
                    Type::Task => final_children.push(child),
                    // If it's a group, set its children before pushing it in.
                    Type::TaskGroup => final_children.push(self.get_final_structure(
                        child.id,
                        children_map,
                        group_info,
                    )),
                }
            }
        }

        let record_name = group_info.get(&id).cloned().unwrap().name;

        // Finally, return the group formed.
        // In the end, the root group is returned with all the children nested correctly.
        TaskRecord::new(
            id,
            record_name,
            Type::TaskGroup,
            None,
            None,
            Some(final_children),
        )
    }

    pub fn fetch_records(
        &self,
        table: &str,
        fetch_basis: FetchBasis,
    ) -> Result<Vec<(u64, String, Type, Option<bool>, Option<u64>)>> {
        if let Some(conn) = &self.db_conn {
            let mut stmt = match fetch_basis {
                FetchBasis::Active => conn.prepare(&format!(
                    "SELECT * FROM {table} WHERE is_active=1 OR type='{TASK_GROUP}'"
                ))?,
                FetchBasis::Completed => {
                    conn.prepare(&format!("SELECT * FROM {table} WHERE is_active={}", 0u64))?
                }
                FetchBasis::ByParent(parent_id) => conn.prepare(&format!(
                    "SELECT * FROM {table} WHERE parent_group_id={parent_id}"
                ))?,
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

                let task_record_type = match type_str.as_str() {
                    TASK => Type::Task,
                    TASK_GROUP => Type::TaskGroup,
                    _ => panic!("Unknown task_record type"),
                };

                Ok((id, name, task_record_type, is_active, parent_group_id))
            })?;

            return task_record_iter.collect();
        } else {
            return Err(rusqlite::Error::ExecuteReturnedResults);
        }
    }

    /// Retrieve the data from the db and return it in the nested, expected format.
    pub fn fetch_tasks_view(&self, table: &str) -> Result<TaskRecord> {
        if let Some(_) = &self.db_conn {
            let fetched_records = self.fetch_records(table, FetchBasis::Active);

            // Holds the rows mapped by their ids.
            let mut task_records: HashMap<u64, TaskRecord> = HashMap::new();
            let mut parent_map: HashMap<u64, Vec<u64>> = HashMap::new();

            match fetched_records {
                Err(err) => panic!("idk what error: {err}"),
                Ok(task_record_iter) => {
                    for task_record in task_record_iter {
                        let (id, name, task_record_type, is_active, parent_group_id) = task_record;
                        task_records.insert(
                            id,
                            TaskRecord::new(
                                id,
                                name,
                                task_record_type,
                                is_active,
                                parent_group_id,
                                {
                                    match task_record_type {
                                        Type::Task => None,
                                        Type::TaskGroup => Some(vec![]),
                                    }
                                },
                            ),
                        );
                        if let Some(pid) = parent_group_id {
                            parent_map.entry(pid).or_insert_with(Vec::new).push(id);
                        }
                    }
                }
            }

            let temp = task_records.clone();

            // Holds the children of a group temporarily.
            let mut children_map: HashMap<u64, Vec<TaskRecord>> = HashMap::new();

            // Collect children from task_records into children_map.
            for (parent_group_id, children_ids) in parent_map {
                for child_id in children_ids {
                    if let Some(child) = task_records.remove(&child_id) {
                        children_map
                            .entry(parent_group_id)
                            .or_insert_with(Vec::new)
                            .push(child);
                    }
                }
            }

            let root = self.get_final_structure(0, &mut children_map, &temp);

            Ok(root)
        } else {
            Err(rusqlite::Error::InvalidPath(PathBuf::default()))
        }
    }
}

pub mod crud_commands {
    use core::panic;
    use std::sync::MutexGuard;

    use rusqlite::{params, Connection, Result};
    use serde::{Deserialize, Serialize};


    use super::{FetchBasis, Type, DB_SINGLETON, TASK, TASK_GROUP, TODAY};

    #[tauri::command]
    /// C(R)UD - Reads the database and sends appropriate structure to the frontend.
    pub fn get_tasks_view(table: &str, status: bool) -> String {
        let db = DB_SINGLETON.lock().unwrap();

        match status {
            false => match db.fetch_records(table, FetchBasis::Completed) {
                Ok(records) => {
                    return serde_json::to_string(&records)
                        .expect("[Error] Couldn't return Vec of records");
                }
                Err(err) => panic!("[Error] Could not fetch completed records: {err}"),
            },
            true => {
                match db.fetch_tasks_view(table) {
                    Ok(root) => {
                        let res = serde_json::to_string(&root)
                            .expect("[ERROR] Cannot parse the root group into JSON.");

                        return res;
                    }
                    Err(e) => {
                        // Return a JSON indicating an error occurred
                        return serde_json::json!({ "error": format!("Failed to fetch records: {}", e) })
                            .to_string();
                    }
                }
            }
        }
    }

    /*
        The next two functions return Result<u64, tauri::Error>.
        According to me, they should return rusqlite errors
        so that the frontend can handle them by displaying custom
        error messages based on the error type.

        But I cannot return a rusqlite::Error because I get the following
        error: "the method `blocking_kind` exists for reference `&Result<i64, Error>`, but its trait bounds were not satisfied
        the following trait bounds were not satisfied:
        `rusqlite::error::Error: Into<InvokeError>`
        which is required by `Result<i64, rusqlite::error::Error>: tauri::command::private::ResultKind`
        `Result<i64, rusqlite::error::Error>: serde::ser::Serialize`
        which is required by `&Result<i64, rusqlite::error::Error>: tauri::command::private::SerializeKind`"
    */

    #[tauri::command(rename_all = "snake_case")]
    // (C)RUD - Adds the specified item to the database.
    pub fn add_item(
        table: &str,
        name: &str,
        parent_group_id: u64,
        item_type: &str,
    ) -> Result<i64, tauri::Error> {
        let db = DB_SINGLETON.lock().unwrap();

        if let Some(conn) = &db.db_conn {
            let command = format!(
                    "INSERT INTO {table} (name, type, is_active, parent_group_id) VALUES (?1, ?2, ?3, ?4)",
                );

            let is_active = match item_type {
                TASK => Some(1u64),
                TASK_GROUP => None,
                _ => panic!("invalid type"),
            };

            let mut stmt = conn
                .prepare(&command)
                .expect("[Error] Could not prepare statement");
            match stmt.insert(params![name, item_type, is_active, parent_group_id]) {
                Err(err) => println!(
                    "[ERROR] Error occurred while trying to insert item: {}",
                    err.to_string()
                ),
                Ok(id) => return Ok(id),
            }
        }

        Err(tauri::Error::FailedToExecuteApi(
            tauri::api::Error::Command("add_task".to_string()),
        ))
    }

    #[tauri::command(rename_all = "snake_case")]
    // CRU(D) - Deletes the specified item from the database.
    pub fn delete_item(table: &str, id: u64, item_type: &str) {
        let db = DB_SINGLETON.lock().unwrap();

        if let Some(conn) = &db.db_conn {
            match item_type {
                TASK => delete_task(conn, table, id),
                TASK_GROUP => delete_group(&db, conn, table, id),
                _ => panic!("invalid type"),
            }
        }
    }

    #[derive(Serialize, Deserialize, Debug)]
    pub enum UpdateField {
        Name(String),
        Parent(u64),
        Status(bool),
    }

    #[tauri::command(rename_all = "snake_case")]
    // CR(U)D - Updates the specified item's record in the database.
    pub fn update_item(table: &str, id: u64, field: UpdateField) {
        let db = DB_SINGLETON.lock().unwrap();

        if let Some(conn) = &db.db_conn {
            match field {
                UpdateField::Name(name) => update_name(conn, table, &name, id),
                UpdateField::Parent(new_parent_group_id) => {
                    update_parent(conn, table, id, new_parent_group_id)
                }
                UpdateField::Status(status) => update_status(conn, table, id, status),
            }
        }
    }

    /* ----------------------------------------------------------------------------- */
    /* -------------------------------HELPER FUNCTIONS------------------------------ */
    /* ----------------------------------------------------------------------------- */

    fn delete_task(conn: &Connection, table: &str, id: u64) {
        let command = format!("DELETE FROM {table} WHERE id={id}");
        match conn.execute(&command, []) {
            Err(err) => println!("[ERROR] Could not delete task: {}", err.to_string()),
            Ok(_) => (),
        }
    }

    fn delete_group(db: &MutexGuard<super::Db>, conn: &Connection, table: &str, id: u64) {
        // Fetch the children of To-Be-Deleted group.
        let children = match db.fetch_records(table, FetchBasis::ByParent(id)) {
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
            for (child_id, _, child_type, _, _) in children {
                match child_type {
                    Type::Task => delete_task(conn, table, child_id),
                    Type::TaskGroup => delete_group(db, conn, table, child_id),
                }
            }

            let command = format!("DELETE FROM {table} WHERE id={id}");
            match conn.execute(&command, []) {
                Ok(_) => (),
                Err(err) => panic!("[ERROR] Error occurred while deleting group {id}: {err}"),
            }
        };
    }

    fn update_name(conn: &Connection, table: &str, name: &str, id: u64) {
        let command = format!("UPDATE {table} SET name=(?1) WHERE id=(?2)");

        match conn.execute(&command, params![name, id]) {
            Ok(_) => (),
            Err(err) => println!("[ERROR] Could not update task: {}", err.to_string()),
        }
    }

    fn update_parent(conn: &Connection, table: &str, id: u64, new_parent_group_id: u64) {
        let command = format!("UPDATE {table} SET parent_group_id=(?1) WHERE id=(?2)");

        match conn.execute(&command, params![new_parent_group_id, id]) {
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

    /// C(R)UD - Reads database and gets all tasks' names and their parent_group_ids.
    pub fn get_all_tasks(fetch_basis: FetchBasis) -> Vec<(u64, String)> {
        let db = DB_SINGLETON.lock().unwrap();
        let mut all_tasks: Vec<(u64, String)> = Vec::new();

        match db.fetch_records(TODAY, fetch_basis) {
            Ok(records) => {
                all_tasks.extend(
                    records
                        .into_iter()
                        .filter(|(_, _, record_type, _, _)| *record_type != Type::TaskGroup)
                        .map(|(_, name, _, _, parent_id)| {
                            if let Some(id) = parent_id {
                                (id, name)
                            } else {
                                panic!("[ERROR] While fetching task names, the task: [{name}] had no parent.");
                            }
                        }),
                );
            }
            Err(err) => panic!("{err}"),
        }

        all_tasks
    }

    pub fn get_item(id: u64) -> String {
        let db = DB_SINGLETON.lock().unwrap();
        let mut name = String::new();

        if let Some(conn) = &db.db_conn {
            let res: Option<String> = match conn.query_row("SELECT name FROM today WHERE id=(?1)", params![id], |row| row.get(0)) {
                Ok(name) => name,
                Err(err) => panic!("{err}"),
            };

            name = res.unwrap();
        }

        name
    }
}
