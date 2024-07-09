use std::process::Command;

use crate::db::ops::{
    crud_commands::{get_all_tasks, get_item},
    FetchBasis,
};

fn get_python_input(tasks: &[(u64, String)]) -> Vec<(String, String)> {
    let mut res: Vec<(String, String)> = Vec::new();
    for (parent_id, name) in tasks.iter() {
        let parent_name = get_item(*parent_id);
        res.push((parent_name, name.clone()));
    }
    res
}

#[tauri::command]
pub fn export_to_pdf() {
    let active_tasks = get_all_tasks(FetchBasis::Active);
    let completed_tasks = get_all_tasks(FetchBasis::Completed);

    let active_tasks_inp: Vec<(String, String)> = get_python_input(&active_tasks);
    let completed_tasks_inp: Vec<(String, String)> = get_python_input(&completed_tasks);

    println!("{active_tasks_inp:?}");
    println!("{completed_tasks_inp:?}");

    let output = Command::new("python3")
        .arg("../scripts/task_view_to_pdf.py")
        .args([
            serde_json::to_string(&active_tasks_inp).expect("wtf1"),
            serde_json::to_string(&completed_tasks_inp).expect("wtf2"),
        ])
        .output()
        .expect("ok the python script idea didn't work");

    if !output.status.success() {
        eprintln!("[ERROR]: {}", String::from_utf8_lossy(&output.stderr));
    } else {
        println!("shit worked");
    }
}
