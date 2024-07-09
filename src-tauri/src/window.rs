use tauri::Manager;

const TOMORROW: &str = "tomorrow";

#[tauri::command]
pub async fn open_tomorrow_window(handle: tauri::AppHandle) {
    tauri::WindowBuilder::new(
        &handle,
        TOMORROW,
        tauri::WindowUrl::App("src/views/TasksView/Tomorrow/index.html".parse().unwrap()),
    )
    .title("Tomorrow's Tasks")
    .inner_size(1000.0, 800.0)
    .position(100.0, 100.0)
    .build()
    .unwrap();
}

#[tauri::command]
pub async fn close_tomorrow_window(handle: tauri::AppHandle) {
    if let Some(window) = handle.get_window(TOMORROW) {
        window.close().unwrap();
    }
}
