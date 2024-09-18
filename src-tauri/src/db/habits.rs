use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Habit {
    id: u64,
    name: String,
    streak: u64,
    highest_streak: u64,
    day_types: Vec<DayType>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct DayType {
    id: u64,
    habit_id: u64,
    name: String,
    color: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum ToDelete {
    All,
    One(u64),
}

pub mod commands {
    use std::collections::HashMap;

    use crate::db::{habits::Habit, init::DbConn};
    use rusqlite::{params, Connection};
    use tauri::State;

    use super::{DayType, ToDelete};

    /// (C)RUD -> Create a habit.
    #[tauri::command(rename_all = "snake_case")]
    pub fn add_habit(
        db_conn: State<'_, DbConn>,
        name: String,
        day_types: Vec<(String, String)>,
    ) -> (i64, HashMap<String, (i64, String)>) {
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
                let dt_id = insert_day_type(&conn, id, dt_name.as_str(), &color);

                (dt_name, (dt_id, color))
            })
            .collect::<HashMap<String, (i64, String)>>();

        (id, day_types_map)
    }

    /// (C)RUD -> Create a day type for a habit.
    #[tauri::command(rename_all = "snake_case")]
    pub fn add_day_type(
        db_conn: State<'_, DbConn>,
        habit_id: i64,
        dt_name: String,
        color: String,
    ) -> i64 {
        let conn = db_conn.lock().unwrap();

        insert_day_type(&conn, habit_id, &dt_name, &color)
    }

    /// C(R)UD -> Fetch all habits.
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

            let day_types = fetch_day_types(&conn, id);

            Ok(Habit {
                id,
                name,
                streak,
                highest_streak,
                day_types
            })
        }) {
            Err(e) => panic!("[ERROR] Could not fetch habits: {e}"),
            Ok(iterator) => iterator
                .filter(|habit_res| habit_res.is_ok())
                .map(|habit_res| match habit_res {
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

    // Note: This will update the highest_streak value if the streak exceeds it, but
    // the frontend will have no way of knowing that. Therefore, it needs to be handled
    // in the frontend separately.
    /// CR(U)D -> Increment the streak for a habit.
    #[tauri::command(rename_all = "snake_case")]
    pub fn increment_streak(db_conn: State<'_, DbConn>, habit_id: u64, dt_id: u64) {
        let conn = db_conn.lock().unwrap();

        // Update streak.
        match conn.execute(
            "UPDATE habits SET streak = streak + 1 WHERE id=(?1)",
            params![habit_id],
        ) {
            Ok(_) => (),
            Err(e) => panic!("[ERROR] Could not increment streak: {e}"),
        };
        match conn.execute(
            "UPDATE habits SET highest_streak = streak WHERE highest_streak < streak",
            [],
        ) {
            Ok(_) => (),
            Err(e) => panic!("[ERROR] Could not increment streak: {e}"),
        };

        // Add record in history.
        let command = format!("INSERT INTO history VALUES (?1, ?2)");
        let mut stmt = conn
            .prepare(&command)
            .expect("[ERROR] Could not prepare insertion into history command.");
        stmt.insert(params![habit_id, dt_id])
            .expect("[ERROR] Could not insert into history!");
    }

    /// CRU(D) -> Delete a single or all day types of a habit.
    #[tauri::command(rename_all = "snake_case")]
    pub fn delete_day_type(db_conn: State<'_, DbConn>, habit_id: u64, how_many: ToDelete) {
        let conn = db_conn.lock().unwrap();

        delete_dt_helper(&conn, habit_id, how_many);
    }

    /// CRU(D) -> Delete a habit.
    #[tauri::command(rename_all = "snake_case")]
    pub fn delete_habit(db_conn: State<'_, DbConn>, habit_id: u64) {
        let conn = db_conn.lock().unwrap();

        delete_history(&conn, habit_id);
        delete_dt_helper(&conn, habit_id, ToDelete::All);

        conn.execute("DELETE FROM habits WHERE id=(?1)", params![habit_id])
            .expect("[ERROR] Could not delete habit!");
    }

    /* ------------------------------------ Helper Functions ------------------------------------ */

    fn insert_day_type(conn: &Connection, habit_id: i64, dt_name: &str, color: &str) -> i64 {
        let command = format!("INSERT INTO day_types (habit_id, name, color) VALUES (?1, ?2, ?3)");
        let mut stmt = conn
            .prepare(&command)
            .expect("[ERROR] Could not prepare day type insertion command!");

        stmt.insert(params![habit_id, dt_name, color])
            .expect("[ERROR] Could not insert day type!")
    }

    fn fetch_day_types(conn: &Connection, habit_id: u64) -> Vec<DayType> {
        let command = format!("SELECT id, name, color FROM day_types WHERE habit_id = {habit_id}");
        let mut stmt = conn
            .prepare(&command)
            .expect("[ERROR] Cannot prepare statement that retrieves a habit's day types!");

        let day_types = match stmt.query_map([], |row| {
            let dt_id = row.get(0)?;
            let dt_name = row.get(1)?;
            let dt_color = row.get(2)?;

            Ok(DayType {
                id: dt_id,
                habit_id,
                name: dt_name,
                color: dt_color,
            })
        }) {
            Err(e) => panic!("[ERROR] Could not fetch day types for habit {habit_id}: {e}"),
            Ok(dt_iter) => dt_iter.filter(|dt_res| dt_res.is_ok()).map(|dt_res| match dt_res {
                Ok(dt) => dt,
                Err(e) => panic!("[ERROR] Wtf why is Err() still here in DT? I specifically didn't ask for it: {e}"),
            }).collect::<Vec<DayType>>(),
        };

        day_types
    }

    fn delete_history(conn: &Connection, habit_id: u64) -> u64 {
        conn.execute("DELETE FROM history WHERE habit_id=(?1)", params![habit_id])
            .expect("[ERROR] Could not erase history of the habit!") as u64
    }

    fn delete_dt_helper(conn: &Connection, habit_id: u64, how_many: ToDelete) {
        match how_many {
            ToDelete::All => {
                conn.execute(
                    "DELETE FROM day_types WHERE habit_id=(?1)",
                    params![habit_id],
                )
                .expect("[ERROR] Could not delete day types of the habit!");
            }
            ToDelete::One(dt_id) => {
                conn.execute("DELETE FROM day_types WHERE id=(?1)", params![dt_id])
                    .expect("[ERROR] Could not delete one day type!");
            }
        }
    }
}
