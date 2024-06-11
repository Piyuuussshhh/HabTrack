/*
    TODOs: Following stuff must be done:
        -> handle errors properly. rn we just .expect(), which will
           cause the app to crash.
*/

use lazy_static::lazy_static;
use std::sync::Mutex;

const DB_NAME: &str = "database.sqlite";
const DB_PATH: &str = "/home/nvmpiyush2/.local/share/com.tauri.dev/database.sqlite";
const ROOT_GROUP: &str = "/";
const ROOT_GROUP_ID: u64 = 0;
const TASK: &str = "Task";
const TASK_GROUP: &str = "TaskGroup";

// Singleton because we need a single point of access to the db across the app.
lazy_static! {
    static ref DB_SINGLETON: Mutex<ops::Db> = Mutex::new(ops::Db::new(DB_PATH).expect("pls work"));
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

        pub fn init(&self) {
            if !self.db_file_exists() {
                println!("db not found, thus creating it");
                self.create_db_file();
            } else {
                println!("db found! nothing to initialize");
            };
        }

        // Create the database file.
        fn create_db_file(&self) {
            let db_path = self.get_db_path();
            let db_dir = Path::new(&db_path).parent().unwrap();
            println!("parent dir: {db_dir:?}");

            // If the parent directory does not exist, create it.
            if !db_dir.exists() {
                println!("creating parent dir as it doesn't exist");
                fs::create_dir_all(db_dir).unwrap();
            }

            // Create the database file.
            fs::File::create(db_path).unwrap();
            println!("db created!");
        }

        // Check whether the database file exists.
        fn db_file_exists(&self) -> bool {
            let db_path = self.get_db_path();
            let res = Path::new(&db_path).exists();

            println!("db file exists: {res}");

            return res;
        }

        // Get the path where the database file should be located.
        pub fn get_db_path(&self) -> String {
            let mut res = String::from("");
            let app = &self.app_handle;
            if let Some(path) = app.path_resolver().app_data_dir() {
                res = format!("{}/{DB_NAME}", path.to_string_lossy().into_owned());
                println!("db path: {res}");
            }

            res
        }
    }
}

pub mod ops {
    use std::{
        collections::HashMap,
        hash::{DefaultHasher, Hash, Hasher},
    };

    use rusqlite::{params, Connection, Result};
    use serde::Serialize;
    use uuid::Uuid;

    use crate::db::{TASK, TASK_GROUP};

    use super::{DB_SINGLETON, ROOT_GROUP, ROOT_GROUP_ID};

    #[derive(Serialize, Debug, Clone)]
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
        pub conn: Connection,
    }

    impl Db {
        pub fn new(db_path: &str) -> Result<Self> {
            let conn = Connection::open(db_path)?;
            let db = Db { conn };

            db.create_tables()?;
            // db.migrate_tables()?;

            Ok(db)
        }

        fn create_tables(&self) -> Result<()> {
            /*
                is_active and parent_group_id can be null.
                    -> is_active because the record could be a group
                    -> parent_group_id because the root group "/" isn't in any
                       other group.

                parent_group_id stores the ID of the parent group.
            */
            self.conn.execute(
                "CREATE TABLE IF NOT EXISTS today (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                is_active INTEGER,
                parent_group_id INTEGER
            )",
                [],
            )?;

            Ok(())
        }

        pub fn fetch_task_records(&self) -> Result<HashMap<u64, TaskRecord>> {
            let mut stmt = self
                .conn
                .prepare("SELECT id, name, type, is_active, parent_group_id FROM today")?;

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

            let mut task_records: HashMap<u64, TaskRecord> = HashMap::new();
            let mut parent_map: HashMap<u64, Vec<u64>> = HashMap::new();

            for task_record in task_record_iter {
                let (id, name, task_record_type, is_active, parent_group_id) = task_record?;
                task_records.insert(
                    id,
                    TaskRecord::new(id, name, task_record_type.clone(), is_active, parent_group_id, {
                        match task_record_type {
                            Type::Task => None,
                            Type::TaskGroup => Some(vec![]),
                        }
                    }),
                );
                if let Some(pid) = parent_group_id {
                    parent_map
                        .entry(pid.clone())
                        .or_insert_with(Vec::new)
                        .push(id);
                }
            }

            dbg!(&task_records);

            // Separate map to hold children temporarily.
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

            // Move children from children_map to their respective parents in task_records.
            for (parent_group_id, children_temp) in children_map {
                // Grab the parent from the task_records.
                if let Some(parent) = task_records.get_mut(&parent_group_id) {
                    // If the parent is a group, get their children vector.
                    if let Some(children_vec) = &mut parent.children {
                        // Add the child to the parent's children vector.
                        children_vec.extend(children_temp);
                    }
                }
            }

            dbg!(&task_records);

            Ok(task_records)
        }
    }

    // Generates a 64 bit ALMOST ALWAYS unique ID for all tasks/groups.
    fn generate_id() -> u64 {
        let uuid = Uuid::new_v4();
        let mut hasher = DefaultHasher::new();
        uuid.hash(&mut hasher);
        hasher.finish()
    }

    #[tauri::command]
    pub fn add_task(table: &str, name: &str, parent_group_id: &str) {
        let db = DB_SINGLETON.lock().unwrap();

        let task_id = generate_id();

        let command = format!(
            "INSERT INTO {table} (id, name, type, is_active, parent_group_id) VALUES (?1, ?2, ?3, ?4, ?5)"
        );
        db.conn
            .execute(
                &command,
                params![&task_id, name, TASK, false, parent_group_id],
            )
            .expect("[ERROR] Insertion of task failed.");
    }

    #[tauri::command]
    pub fn add_task_group(table: &str, name: &str, parent_group_id: &str) {
        let db = DB_SINGLETON.lock().unwrap();

        let task_group_id = {
            match name {
                // Root group.
                "/" => ROOT_GROUP_ID,
                // Non root-group.
                _ => generate_id(),
            }
        };

        // When the group is ROOT.
        if name == ROOT_GROUP {
            let command = format!("INSERT INTO {table} (id, name, type) VALUES (?1, ?2, ?3)");
            db.conn
                .execute(&command, params![&task_group_id, name, TASK_GROUP])
                .expect("[ERROR] Insertion of root group failed.");
        } else {
            let command = format!(
                "INSERT INTO {table} (id, name, type, parent_group_id) VALUES (?1, ?2, ?3, ?4)"
            );
            db.conn
                .execute(
                    &command,
                    params![&task_group_id, name, TASK_GROUP, parent_group_id],
                )
                .expect("[ERROR] Insertion of group failed.");
        }
    }

    #[tauri::command]
    pub fn get_tasks_view() -> String {
        let db = DB_SINGLETON.lock().unwrap();

        match db.fetch_task_records() {
            Ok(task_records) => {
                if task_records.is_empty() {
                    println!("table is empty");
                    // Default view: Root group with no children.
                    serde_json::json!({"id": "0", "name": "/", "type": "task", "children": []})
                        .to_string()
                } else {
                    let root_group = task_records
                        .get(&ROOT_GROUP_ID)
                        .ok_or(rusqlite::Error::InvalidQuery)
                        .expect("[ERROR] Could not fetch root group from task_records.");

                    let res = serde_json::to_string(root_group)
                        .expect("[ERROR] Cannot parse the root group into JSON.");

                    return res;
                }
            }
            Err(e) => {
                // Return a JSON indicating an error occurred
                return serde_json::json!({ "error": format!("Failed to fetch records: {}", e) })
                    .to_string();
            }
        }
    }
}
