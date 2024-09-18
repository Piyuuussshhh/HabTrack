use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Habit {
    id: u64,
    name: String,
    streak: u64,
    highest_streak: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DayType {
    id: u64,
    habit_id: u64,
    name: String,
    color: String,
}

pub mod commands {
    use std::collections::HashMap;

    use crate::db::{habits::Habit, init::DbConn};
    use rusqlite::{params, Connection};
    use tauri::State;

    #[tauri::command(rename_all = "snake_case")]
    pub fn add_habit(
        db_conn: State<'_, DbConn>,
        name: String,
        day_types: Vec<(String, String)>,
    ) -> (i64, HashMap<String, i64>) {
        let conn = db_conn.lock().unwrap();
        let command =
            format!("INSERT INTO habits (name, streak, highest_streak) VALUES (?1, ?2, ?3)");
        let mut stmt = conn
            .prepare(&command)
            .expect("[ERROR] Could not prepare insertion of habit command!");

        let id = stmt
            .insert(params![name, 0, 0])
            .expect("[ERROR] Could not insert habit!");

        // Maps the name of the day_type to its id.
        let day_types_map = day_types
            .into_iter()
            .map(|(dt_name, color)| {
                let dt_id = insert_day_type(&conn, id, dt_name.as_str(), color);

                (dt_name, dt_id)
            })
            .collect::<HashMap<String, i64>>();

        (id, day_types_map)
    }

    #[tauri::command(rename_all = "snake_case")]
    pub fn add_day_type(
        db_conn: State<'_, DbConn>,
        habit_id: i64,
        dt_name: String,
        color: String,
    ) -> i64 {
        let conn = db_conn.lock().unwrap();

        insert_day_type(&conn, habit_id, &dt_name, color)
    }

    #[tauri::command(rename_all = "snake_case")]
    pub fn fetch_habits(db_conn: State<'_, DbConn>) -> String {
        let conn = db_conn.lock().unwrap();

        let mut stmt = conn
            .prepare("SELECT * FROM habits")
            .expect("[ERROR] Could not prepare statement to fetch all habits!");
        let habits = match stmt.query_map([], |row| {
            let id: u64 = row.get(0)?;
            let name: String = row.get(1)?;
            let streak: u64 = row.get(2)?;
            let highest_streak: u64 = row.get(3)?;

            Ok(Habit {
                id,
                name,
                streak,
                highest_streak,
            })
        }) {
            Err(e) => panic!("[ERROR] Could not fetch habits: {e}"),
            Ok(iterator) => iterator
                .filter(|habit_op| habit_op.is_ok())
                .map(|habit_op| match habit_op {
                    Ok(habit) => habit,
                    Err(e) => {
                        panic!("[ERROR] Wtf why is Err() still here? I specifically didn't ask for it: {e}")
                    }
                })
                .collect::<Vec<Habit>>(),
        };

        serde_json::to_string(&habits)
            .expect("[ERROR] Could not convert habit vector into a JSON object")
    }

    #[tauri::command(rename_all = "snake_case")]
    pub fn increment_streak(db_conn: State<'_, DbConn>, habit_id: u64, dt_id: u64) {
        // Update streak.
        // Add record in history.
    }

    #[tauri::command(rename_all = "snake_case")]
    pub fn delete_habit(db_conn: State<'_, DbConn>, habit_id: u64) {}

    #[tauri::command(rename_all = "snake_case")]
    pub fn delete_day_types(db_conn: State<'_, DbConn>, habits_id: u64) {}

    #[tauri::command(rename_all = "snake_case")]
    pub fn delete_history(db_conn: State<'_, DbConn>, habit_id: u64) {}

    /* ------------------------------------ Helper Functions ------------------------------------ */

    fn insert_day_type(conn: &Connection, habit_id: i64, dt_name: &str, color: String) -> i64 {
        let command = format!("INSERT INTO day_types (habit_id, name, color) VALUES (?1, ?2, ?3)");
        let mut stmt = conn
            .prepare(&command)
            .expect("[ERROR] Could not prepare day type insertion command!");

        stmt.insert(params![habit_id, dt_name, color])
            .expect("[ERROR] Could not insert day type!")
    }
}
