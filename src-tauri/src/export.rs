use headless_chrome::{Browser, LaunchOptions};
use rusqlite::Connection;
use std::{collections::HashMap, fs::File, io::Write, path::PathBuf};
use tauri::{api::dialog::FileDialogBuilder, State};

use crate::db::{
    init::DbConn,
    todos::{
        commands::{fetch_todos, TODAY},
        FetchBasis, Todo,
    },
};

fn get_parent_group_and_todo(conn: &Connection, todos: &[Todo]) -> Vec<(String, String)> {
    let mut res: Vec<(String, String)> = Vec::new();
    for todo in todos.iter() {
        if todo.id == 0 {
            continue;
        }
        let parent = match fetch_todos(conn, TODAY, FetchBasis::ById(todo.parent_group_id.unwrap()))
        {
            Ok(parent_group) => parent_group,
            Err(e) => panic!("[ERROR] why tf is python is still here: {e}"),
        };
        res.push((parent[0].name.clone(), todo.name.clone()));
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

fn generate_html(conn: &Connection, active_tasks: Vec<Todo>, completed_tasks: Vec<Todo>) -> String {
    let active_tasks_inp: Vec<(String, String)> = get_parent_group_and_todo(conn, &active_tasks);
    let completed_tasks_inp: Vec<(String, String)> = get_parent_group_and_todo(conn, &completed_tasks);

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

    format!(
        "<!DOCTYPE html>
         <html lang=\"en\">
         <head>
         <meta charset=\"UTF-8\" />
         <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
         <style>{}</style>
         <title>Tasks for Today</title>
         </head>
         <body>
           <h1>Active Tasks</h1>
           {}
           <div class=\"page-break\"></div>
           <h1>Completed Tasks</h1>
           {}
         </body>
         </html>",
        pdf_css,
        generate_ordered_list(map_parent_to_tasks(active_tasks_inp), false),
        generate_ordered_list(map_parent_to_tasks(completed_tasks_inp), true)
    )
}

fn generate_pdf(html: String) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let browser = Browser::new(LaunchOptions {
        headless: true,
        ..Default::default()
    })?;

    let tab = browser.new_tab()?;

    tab.navigate_to(&format!("data:text/html;charset=utf-8,{}", html))?;
    tab.wait_until_navigated()?;
    tab.wait_for_element("body")?;

    let pdf_data = tab.print_to_pdf(None)?;

    Ok(pdf_data)
}

fn write_pdf(pdf_data: Vec<u8>, pdf_name: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = File::create(pdf_name)?;
    file.write_all(&pdf_data)?;

    Ok(())
}

#[tauri::command]
pub fn export_to_pdf(db_conn: State<'_, DbConn>) {
    let conn = db_conn.lock().unwrap();
    let active_tasks = match fetch_todos(&conn, TODAY, FetchBasis::Active) {
        Ok(todos) => todos,
        Err(_) => return,
    };
    let completed_tasks = match fetch_todos(&conn, TODAY, FetchBasis::Completed) {
        Ok(todos) => todos,
        Err(_) => return,
    };

    // Since we are forming the pdf before we start to save the file, this takes some time
    // and the app sort of hangs for a period of time before the file dialog shows up.
    let pdf = match generate_pdf(generate_html(&conn, active_tasks, completed_tasks)) {
        Ok(data) => data,
        Err(e) => {
            println!("[ERROR] Couldn't generate pdf: {e}");
            return;
        }
    };

    FileDialogBuilder::new()
        .set_title("Export Tasks to PDF")
        .add_filter("PDF files", &["pdf"])
        .set_file_name("Today's Tasks.pdf")
        .save_file(move |path| {
            if let Some(path) = path {
                match write_pdf(pdf, path) {
                    Ok(_) => (),
                    Err(err) => println!("{err}"),
                }
            }
        });
}
