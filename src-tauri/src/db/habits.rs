use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
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
    use tauri::State;
    use crate::db::init::DbConn;

    use super::{DayType, Habit};

    #[tauri::command(rename_all="snake_case")]
    pub fn add_habit(db_conn: State<'_, DbConn>, habit: Habit, day_types: Vec<DayType>) {}

    #[tauri::command(rename_all="snake_case")]
    pub fn fetch_habits(db_conn: State<'_, DbConn>) {}

    #[tauri::command(rename_all="snake_case")]
    pub fn increment_streak(db_conn: State<'_, DbConn>, habit_id: u64) {}

    #[tauri::command(rename_all="snake_case")]
    pub fn delete_habit(db_conn: State<'_, DbConn>, habit_id: u64) {}

    #[tauri::command(rename_all="snake_case")]
    pub fn delete_day_type(db_conn: State<'_, DbConn>, dt_id: u64) {}
}