/*
    TODOs: Following stuff must be done:
        -> handle errors properly. rn we just .expect(), which will
           cause the app to crash.
*/

use lazy_static::lazy_static;
use std::sync::Mutex;

const DB_NAME: &str = "database.sqlite";
const ROOT_GROUP: &str = "/";
const TASK: &str = "Task";
const TASK_GROUP: &str = "TaskGroup";

// Singleton because we need a single point of access to the db across the app.
// Mutex because only one process should be able to use the singleton at a time,
// to prevent race conditions.
// Default because we need to set the db_path according to the specific user of the app.
// We do this in tauri::Builder::default().setup() in main.rs
lazy_static! {
    pub static ref DB_SINGLETON: Mutex<ops::Db> = Mutex::new(ops::Db::default());
}

pub mod init {
    use std::fs;
    use std::path::Path;

    use tauri::AppHandle;

    use super::DB_NAME;

    // Initializer struct so that we don't pass AppHandle separately to all helper functions.
    pub struct DbInitializer {
        pub app_handle: AppHandle,
    }

    impl DbInitializer {
        pub fn new(app_handle: AppHandle) -> Self {
            Self { app_handle }
        }

        pub fn init(self) -> Self {
            if !self.db_file_exists() {
                self.create_db_file();
            }

            self
        }

        // Create the database file.
        fn create_db_file(&self) {
            let db_path = self.get_db_path();
            let db_dir = Path::new(&db_path).parent().unwrap();

            // If the parent directory does not exist, create it.
            if !db_dir.exists() {
                fs::create_dir_all(db_dir).unwrap();
            }

            // Create the database file.
            fs::File::create(db_path).unwrap();
        }

        // Check whether the database file exists.
        fn db_file_exists(&self) -> bool {
            let db_path = self.get_db_path();
            let res = Path::new(&db_path).exists();

            return res;
        }

        /// Get the path where the database file should be located.
        /// For Linux and macOS only.
        pub fn get_db_path(&self) -> String {
            let mut res = String::from("");
            let app = &self.app_handle;
            if let Some(path) = app.path_resolver().app_data_dir() {
                res = format!("{}/{DB_NAME}", path.to_string_lossy().into_owned());
            }

            res
        }
    }
}

pub mod ops {
    use crate::db::{TASK, TASK_GROUP};
    use rusqlite::{Connection, Result};
    use serde::Serialize;
    use std::{collections::HashMap, path::PathBuf};

    #[derive(Serialize, Debug, Clone, Copy)]
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
            // self.migrate_tables()?;

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
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS today (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    is_active INTEGER,
                    parent_group_id INTEGER
                )",
                    [],
                )?;
                // Only add the root group when the table is created for the first time.
                conn.execute(
                    "INSERT INTO today (id, name, type) VALUES (0, '/', 'TaskGroup') ON CONFLICT DO NOTHING",
                    [],
                )?;
            }

            Ok(())
        }

        // TODO: get_final_structure() is recursive, an iterative alternative exists.

        /// Forms the nested root TaskGroup containing all tasks/groups expected by frontend.
        /// Uses DFS traversal.
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

        /// Retrieve the data from the db and return it in the nested, expected format.
        pub fn fetch_tasks_view(&self) -> Result<TaskRecord> {
            if let Some(conn) = &self.db_conn {
                let mut stmt =
                    conn.prepare("SELECT id, name, type, is_active, parent_group_id FROM today")?;

                // Fetch all rows from the database.
                let task_record_iter = stmt.query_map([], |row| {
                    let id: u64 = row.get(0)?;
                    let name: String = row.get(1)?;
                    let type_str: String = row.get(2)?;
                    let is_active: Option<i32> = row.get(3)?;
                    let parent_group_id: Option<u64> = row.get(4)?;

                    let is_active = {
                        match is_active {
                            Some(0) => Some(false),
                            Some(1) => Some(true),
                            // IF FOR WHATEVER REASON, is_active HAS A VALUE OTHER THAN 1, None IS SET.
                            Some(_) => None,
                            None => None,
                        }
                    };

                    let task_record_type = match type_str.as_str() {
                        TASK => Type::Task,
                        TASK_GROUP => Type::TaskGroup,
                        _ => panic!("Unknown task_record type"),
                    };

                    Ok((id, name, task_record_type, is_active, parent_group_id))
                })?;

                // Holds the rows mapped by their ids.
                let mut task_records: HashMap<u64, TaskRecord> = HashMap::new();
                let mut parent_map: HashMap<u64, Vec<u64>> = HashMap::new();

                for task_record in task_record_iter {
                    let (id, name, task_record_type, is_active, parent_group_id) = task_record?;
                    task_records.insert(
                        id,
                        TaskRecord::new(id, name, task_record_type, is_active, parent_group_id, {
                            match task_record_type {
                                Type::Task => None,
                                Type::TaskGroup => Some(vec![]),
                            }
                        }),
                    );
                    if let Some(pid) = parent_group_id {
                        parent_map.entry(pid).or_insert_with(Vec::new).push(id);
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

    pub mod commands {
        use crate::db::{DB_SINGLETON, ROOT_GROUP, TASK, TASK_GROUP};
        use rusqlite::params;

        #[tauri::command]
        pub fn get_tasks_view() -> String {
            let db = DB_SINGLETON.lock().unwrap();

            match db.fetch_tasks_view() {
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

        #[tauri::command(rename_all = "snake_case")]
        pub fn add_task(table: &str, name: &str, parent_group_id: u64) {
            let db = DB_SINGLETON.lock().unwrap();

            let command = format!(
            "INSERT INTO {table} (name, type, is_active, parent_group_id) VALUES (?1, ?2, ?3, ?4)"
        );
            if let Some(conn) = &db.db_conn {
                match conn.execute(&command, params![name, TASK, 1u64, parent_group_id]) {
                    Err(err) => println!("{}", err.to_string()),
                    Ok(_) => (),
                }
            }
        }

        #[tauri::command(rename_all = "snake_case")]
        pub fn add_task_group(table: &str, name: &str, parent_group_id: u64) {
            let db = DB_SINGLETON.lock().unwrap();

            if let Some(conn) = &db.db_conn {
                // When the group is ROOT.
                if name == ROOT_GROUP {
                    let command = format!("INSERT INTO {table} (name, type) VALUES (?1, ?2)");
                    conn.execute(&command, params![name, TASK_GROUP])
                        .expect("[ERROR] Insertion of root group failed.");
                } else {
                    let command = format!(
                        "INSERT INTO {table} (name, type, parent_group_id) VALUES (?1, ?2, ?3)"
                    );
                    match conn.execute(&command, params![name, TASK_GROUP, parent_group_id]) {
                        Err(err) => println!("{}", err.to_string()),
                        Ok(_) => (),
                    }
                }
            }
        }

        #[tauri::command(rename_all = "snake_case")]
        pub fn delete_task(table: &str, id: u64) {
            println!("received args: {table}, {id}");
            let db = DB_SINGLETON.lock().unwrap();

            if let Some(conn) = &db.db_conn {
                let command = format!("DELETE FROM {table} WHERE id={id}");
                match conn.execute(&command, []) {
                    Err(err) => println!("[ERROR] Could not delete task: {}", err.to_string()),
                    Ok(_) => (),
                }
            }
        }
    }
}
