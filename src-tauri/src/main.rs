// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use habtrack::db::{init::DbInitializer, ops};

// Start work on database.
// TODO: Once done, merge with main, and pull changes into FEATURE-add-delete-task.

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            DbInitializer::new(app.handle()).init();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ops::add_task,
            ops::add_task_group,
            ops::get_tasks_view
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
