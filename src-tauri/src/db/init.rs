use rusqlite::Connection;
use std::sync::{Arc, Mutex};

pub type DbConn = Arc<Mutex<Connection>>;

pub mod db {
    use super::*;
    use std::{fs, path::Path};

    pub fn init(path: &str) -> Connection {
        if !db_exists(path) {
            create_db(path);
        }

        // TODO conditional path for diff OS
        let db_name = format!("{path}/database.sqlite");

        match Connection::open(db_name) {
            Ok(conn) => conn,
            Err(e) => panic!("[ERROR] {e}"),
        }
    }

    // Creation functions.
    fn db_exists(path: &str) -> bool {
        Path::new(path).exists()
    }

    fn create_db(path: &str) {
        let db_dir = Path::new(&path).parent().unwrap();

        // If the parent directory does not exist, create it.
        if !db_dir.exists() {
            fs::create_dir_all(db_dir).unwrap();
        }

        // Create the database file.
        fs::File::create(path).unwrap();
    }
}

pub mod todos {
    use super::Connection;
    use crate::db::todos::commands::ROOT_GROUP as TODO_ROOT_GROUP;
    use chrono::Local;
    use rusqlite::{params, Result as SQLiteResult};

    // Setup functions (to be called in main.rs).
    pub fn create_tables(conn: &Connection) -> SQLiteResult<()> {
        // TODAY
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
            &format!("INSERT INTO today (id, name, type) VALUES (0, '{TODO_ROOT_GROUP}', 'TaskGroup') ON CONFLICT DO NOTHING"),
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
            &format!("INSERT INTO tomorrow (id, name, type) VALUES (0, '{TODO_ROOT_GROUP}', 'TaskGroup') ON CONFLICT DO NOTHING"),
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS migration_log (
                date TEXT PRIMARY KEY
            )",
            [],
        )?;

        Ok(())
    }

    pub fn migrate_todos(conn: &Connection) -> SQLiteResult<()> {
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
            conn.execute(
                "UPDATE tomorrow SET parent_group_id=parent_group_id+(?1) WHERE parent_group_id!=0",
                params![max_id],
            )?;

            // Migrate tasks
            conn.execute(
                    &format!("INSERT INTO today (id, name, type, is_active, parent_group_id)
                SELECT id, name, type, is_active, parent_group_id FROM tomorrow WHERE name!='{TODO_ROOT_GROUP}'"),
                    [],
                )?;

            // Clear tomorrow's tasks
            conn.execute(
                &format!("DELETE FROM tomorrow WHERE name!='{TODO_ROOT_GROUP}'"),
                [],
            )?;
        }
        // Log the migration
        conn.execute(
            "INSERT INTO migration_log (date) VALUES (?1) ON CONFLICT DO NOTHING",
            params![today.to_string()],
        )?;

        Ok(())
    }
}

pub mod habits {
    use std::collections::HashSet;
    use chrono::Local;
    use rusqlite::{params, Connection, Result as SQLiteResult};

    pub fn create_tables(conn: &Connection) -> SQLiteResult<()> {
        // HABITS
        conn.execute(
            "CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            streak INTEGER NOT NULL,
            highest_streak INTEGER NOT NULL,
            created_at DATE DEFAULT (datetime('now','localtime')) NOT NULL
        )",
            [],
        )?;

        // DAY TYPES
        conn.execute(
            "CREATE TABLE IF NOT EXISTS day_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            habit_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            FOREIGN KEY(habit_id) REFERENCES habits(id)
        )",
            [],
        )?;

        // HISTORY
        conn.execute(
            "CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            habit_id INTEGER NOT NULL,
            day_type_id INTEGER NOT NULL,
            date DATE DEFAULT (datetime('now','localtime')) NOT NULL,
            FOREIGN KEY(habit_id) REFERENCES habits(id),
            FOREIGN KEY(day_type_id) REFERENCES day_types(id)
        )",
            [],
        )?;

        Ok(())
    }

    pub fn validate_streaks(conn: &Connection) -> SQLiteResult<()> {
        // Obtain all habit_ids.
        let mut stmt = conn.prepare("SELECT id FROM habits")?;
        let all_habits = stmt
            .query_map([], |row| {
                let id: u64 = row.get(0)?;
                Ok(id)
            })?
            .map(|id_res| if let Ok(id) = id_res { id } else { u64::MAX })
            .filter(|id| *id != u64::MAX)
            .collect::<Vec<u64>>();

        if all_habits.is_empty() {
            return Ok(());
        }

        // Obtain all records from yesterday from history.
        let yesterday = match Local::now().naive_local().date().pred_opt() {
            Some(date) => date,
            None => panic!("[ERROR] WTF there was no yesterday?"),
        };
        let mut stmt = conn.prepare(&format!(
            "SELECT habit_id FROM history WHERE date LIKE '{}%'",
            yesterday.to_string()
        ))?;
        // Put all habit_ids from history records into a set.
        let yesterdays_habits = stmt
            .query_map([], |row| {
                let id: u64 = row.get(0)?;
                Ok(id)
            })?
            .map(|id_res| if let Ok(id) = id_res { id } else { u64::MAX })
            .filter(|id| *id != u64::MAX)
            .collect::<HashSet<u64>>();

        // Check if all habit_ids are in the set.
        all_habits.into_iter().for_each(|id| {
            // If a habit_id is not: set the corresponding habit's streak to 0.
            if !yesterdays_habits.contains(&id) {
                match conn.execute("UPDATE habits SET streak=0 WHERE id=(?id)", params![id]) {
                    Ok(_) => (),
                    Err(e) => panic!("[ERROR] Could not reset streak of habit_id {id}: {e}"),
                }
            }
        });

        Ok(())
    }
}
