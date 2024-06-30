// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use habtrack::db::{init::DbInitializer, ops, DB_SINGLETON};

// Start work on database.
// TODO: Once done, merge with main, and pull changes into FEATURE-add-delete-task.

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_init_obj = DbInitializer::new(app.handle()).init();
            DB_SINGLETON
                .lock()
                .unwrap()
                .set_conn(db_init_obj.get_db_path().as_str())
                .expect("i fucked up");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ops::commands::get_tasks_view,
            ops::commands::add_task,
            ops::commands::add_task_group,
            ops::commands::delete_task,
            ops::commands::delete_task_group,
            ops::commands::edit_task_or_group,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
