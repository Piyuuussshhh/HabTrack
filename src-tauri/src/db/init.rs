use std::fs;
use std::path::Path;

use tauri::AppHandle;

const DB_NAME: &str = "database.sqlite";

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
            if std::env::consts::OS == "windows" {
                res = format!("{}\\{DB_NAME}", path.to_string_lossy().into_owned());
            } else {
                res = format!("{}/{DB_NAME}", path.to_string_lossy().into_owned());
            }
        }

        res
    }
}
