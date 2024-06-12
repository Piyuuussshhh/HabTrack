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
                self.create_db_file();
            }
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

        // Get the path where the database file should be located.
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
    use std::{
        collections::HashMap,
        hash::{DefaultHasher, Hash, Hasher},
    };

    use rusqlite::{params, Connection, Result};
    use serde::Serialize;
    use uuid::Uuid;

    use crate::db::{TASK, TASK_GROUP};

    use super::{DB_SINGLETON, ROOT_GROUP, ROOT_GROUP_ID};

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

        /// Forms the nested root TaskGroup containing all tasks/groups expected by frontend.
        /// Uses DFS traversal.
        fn get_final_structure(
            &self,
            id: u64,
            children_map: &mut HashMap<u64, Vec<TaskRecord>>,
            group_info: &HashMap<u64, String>,
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

            let record_name = group_info.get(&id).cloned().unwrap();

            // Can only happen when no tasks have been set previously.
            if final_children.is_empty() {
                return TaskRecord::new(id, record_name, Type::TaskGroup, None, None, None);
            }

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
            let mut stmt = self
                .conn
                .prepare("SELECT id, name, type, is_active, parent_group_id FROM today")?;

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

            // Holds the names of all groups with non-null (Some) children.
            let parent_group_names = {
                let mut names: HashMap<u64, String> = HashMap::new();
                for id in children_map.keys() {
                    let name = temp.get(&id).unwrap().name.clone();
                    names.insert(*id, name);
                }

                names
            };

            let root = self.get_final_structure(0, &mut children_map, &parent_group_names);

            Ok(root)
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
}
