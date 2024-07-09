use std::process::Command;

use crate::db::ops::{crud_commands::get_all_tasks, FetchBasis};

#[tauri::command]
pub fn export_to_pdf() {
    let active_tasks = get_all_tasks(FetchBasis::Active);
    let completed_tasks = get_all_tasks(FetchBasis::Completed);

    println!("{active_tasks:?}");
    println!("{completed_tasks:?}");

    let output = Command::new("python3")
        .arg("../scripts/task_view_to_pdf.py")
        .args([
            serde_json::to_string(&active_tasks).expect("wtf1"),
            serde_json::to_string(&completed_tasks).expect("wtf2"),
        ])
        .output()
        .expect("ok the python script idea didn't work");

    if !output.status.success() {
        eprintln!("[ERROR]: {}", String::from_utf8_lossy(&output.stderr));
    } else {
        println!("shit worked");
    }
}
