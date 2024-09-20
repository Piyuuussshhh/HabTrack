// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::sync::{Arc, Mutex};

use habtrack::{db::init, db::todos, db::habits, window, export};
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = match app.path_resolver().app_data_dir() {
                Some(p) => p.to_string_lossy().into_owned(),
                None => panic!("[ERROR] Cannot find data directory on this device!"),
            };

            let conn = init::db::init(&db_path);
            init::todos::create_tables(&conn).unwrap();
            init::todos::migrate_todos(&conn).unwrap();
            init::habits::create_tables(&conn).unwrap();
            init::habits::validate_streaks(&conn).unwrap();

            app.manage(Arc::new(Mutex::new(conn)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            todos::commands::get_todos,
            todos::commands::add_todo,
            todos::commands::delete_todo,
            todos::commands::update_todo,
            habits::commands::add_habit,
            habits::commands::add_day_type,
            habits::commands::fetch_habits,
            habits::commands::increment_streak,
            habits::commands::delete_day_type,
            habits::commands::delete_habit,
            habits::commands::fetch_history,
            habits::commands::create_habit_todo,
            window::open_tomorrow_window,
            window::close_tomorrow_window,
            export::export_to_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
