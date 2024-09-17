use headless_chrome::{Browser, LaunchOptions};
use std::{collections::HashMap, fs::File, io::Write, path::PathBuf};
use tauri::{api::dialog::FileDialogBuilder, State};

use crate::db::{
    init::DbConn,
    todos::{
        commands::{fetch_todos, TODAY},
        FetchBasis, Todo, Type,
    },
};

// Maps a task to its parent group. TC = O(n^2) where n => number of records in todos (all active tasks and all taskgroups).
fn map_parent_to_tasks(todos: &[Todo]) -> HashMap<String, Vec<String>> {
    let mut parent_and_task: Vec<(String, String)> = Vec::new();

    for todo in todos.iter() {
        if todo.id == 0 || todo.todo_type == Type::TaskGroup {
            continue;
        }

        let pid = todo.parent_group_id.unwrap();
        for parent_todo in todos.iter() {
            if parent_todo.id == pid {
                parent_and_task.push((parent_todo.name.clone(), todo.name.clone()));
            }
        }
    }

    let mut res: HashMap<String, Vec<String>> = HashMap::new();

    for (parent, task) in parent_and_task {
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

fn generate_html(active_tasks: Vec<Todo>, completed_tasks: Vec<Todo>) -> String {
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
        generate_ordered_list(map_parent_to_tasks(&active_tasks), false),
        generate_ordered_list(map_parent_to_tasks(&completed_tasks), true)
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

    FileDialogBuilder::new()
        .set_title("Export Tasks to PDF")
        .add_filter("PDF files", &["pdf"])
        .set_file_name("Today's Tasks.pdf")
        .save_file(move |path| {
            /*
                I love how path above is an Option<PathBuf>. Its because
                this function will be executed no matter what button the
                user presses; "Save" or "Cancel".
                If they press "Cancel": path = None
                If they press "Save": path = Some(<actual path the user chose>)
            */
            if let Some(path) = path {
                let pdf = match generate_pdf(generate_html(active_tasks, completed_tasks)) {
                    Ok(data) => data,
                    Err(e) => {
                        println!("[ERROR] Couldn't generate pdf: {e}");
                        return;
                    }
                };
                match write_pdf(pdf, path) {
                    Ok(_) => (),
                    Err(err) => println!("{err}"),
                }
            }
        });
}
