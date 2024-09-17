use std::{fs, path::Path, sync::{Arc, Mutex}};
use chrono::Local;
use rusqlite::{Connection, params, Result as SQLiteResult};

use crate::db::todos::commands::ROOT_GROUP as TODO_ROOT_GROUP;

pub type DbConn = Arc<Mutex<Connection>>;

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
        match conn
            .query_row("SELECT MAX(date) FROM migration_log", [], |row| row.get(0))
        {
            Ok(latest_date) => latest_date,
            Err(err) => panic!("{err}"),
        };

    if last_migration_date != Some(today.to_string()) {
        // Delete completed tasks from today.
        conn
            .execute("DELETE FROM today WHERE is_active=0", [])?;

        let max_id: Option<i64> =
            match conn
                .query_row("SELECT MAX(id) from today", [], |row| row.get(0))
            {
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
