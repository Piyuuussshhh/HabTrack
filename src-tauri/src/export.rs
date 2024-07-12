use std::{collections::HashMap, process::Command};

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

fn map_parent_to_tasks(task_list: Vec<(String, String)>) -> HashMap<String, Vec<String>> {
    let mut res: HashMap<String, Vec<String>> = HashMap::new();

    for (parent, task) in task_list {
        res.entry(parent).or_insert(Vec::new()).push(task);
    }

    res
}

fn generate_ordered_list(map: HashMap<String, Vec<String>>, is_completed: bool) -> String {
    let mut html = String::from("<ul>");

    let checked = match is_completed {
        true => "checked",
        false => "",
    };

    for (parent, tasks) in map.into_iter() {
        match parent.as_str() {
            "/" => {
                html.push_str(&format!(
                    "{}",
                    tasks.into_iter()
                        .map(|task| format!(
                            "<li><div class=\"sub-task\"><input type=\"checkbox\" {checked}/><span>{task}</span></div></li>"
                        ))
                        .collect::<Vec<String>>()
                        .concat()
                ));
            }
            _ => {
                html.push_str(&format!(
                    "<li><h3>{parent}</h3><ul>{}</ul></li>",
                    tasks.into_iter()
                        .map(|task| format!("<li><div class=\"sub-task\"><input type=\"checkbox\" {checked}/><span>{task}</span></div></li>"))
                        .collect::<Vec<String>>()
                        .concat()
                ));
            }
        }
    }

    html.push_str("</ul>");
    html
}

#[tauri::command]
pub fn export_to_pdf() {
    let active_tasks = get_all_tasks(FetchBasis::Active);
    let completed_tasks = get_all_tasks(FetchBasis::Completed);

    let active_tasks_inp: Vec<(String, String)> = get_python_input(&active_tasks);
    let completed_tasks_inp: Vec<(String, String)> = get_python_input(&completed_tasks);

    let pdf_html = format!(
        "<!DOCTYPE html>
         <html lang=\"en\">
         <head>
         <meta charset=\"UTF-8\" />
         <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
         <title>Tasks for Today</title>
         <body>
           <h1>Active Tasks</h1>
           {}
           <div class=\"page-break\"></div>
           <h1>Completed Tasks</h1>
           {}
         </body>
         </head>",
        generate_ordered_list(map_parent_to_tasks(active_tasks_inp), false),
        generate_ordered_list(map_parent_to_tasks(completed_tasks_inp), true)
    );

    let pdf_css = format!(
        "
        @import url(\"https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap\");

        body {{
            font-family: 'Inter', sans-serif;
        }}

        h1 {{
            text-align: center;
        }}

        ul {{
            list-style-type: none;
        }}

        li {{
            margin-top: 20px;
            margin-bottom: 20px;
        }}

        p {{
            font-weight: bold;
        }}

        input:checked:after {{
            color: black;
            content: '✔';
        }}

        .sub-task {{
            display: flex;
            flex-direction: row;
            justify-items: space-between;
            align-items: center;
        }}

        span {{
            margin-left: 10px;
        }}

        .page-break {{
            page-break-after: always;
        }}
    "
    );

    let output = Command::new("python3")
        .arg("../scripts/task_view_to_pdf.py")
        .args([pdf_html, pdf_css])
        .output()
        .expect("ok the python script idea didn't work");

    if !output.status.success() {
        eprintln!("[ERROR]: {}", String::from_utf8_lossy(&output.stderr));
    }
}
