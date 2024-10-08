// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::sync::{Arc, Mutex};
use tauri::Manager;

use habtrack::{db::init, db::todos, export, window};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = match app.path_resolver().app_data_dir() {
                Some(p) => p.to_string_lossy().into_owned(),
                None => panic!("[ERROR] Cannot find data directory on this device!"),
            };

            let conn = init::init(&db_path);
            init::create_tables(&conn).unwrap();
            init::migrate_todos(&conn).unwrap();

            app.manage(Arc::new(Mutex::new(conn)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            todos::commands::get_todos,
            todos::commands::add_todo,
            todos::commands::delete_todo,
            todos::commands::update_todo,
            window::open_tomorrow_window,
            window::close_tomorrow_window,
            export::export_to_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
