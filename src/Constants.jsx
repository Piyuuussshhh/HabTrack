// Table names
const TODAY = "today";
const TOMORROW = "tomorrow";

// Frontend Global.
const ROOT = "/";
const TASKS_VIEW = "Tasks";
const TOMORROW_VIEW = "Tomorrow";
const HABITS_VIEW = "Habits";
const STREAKS_VIEW = "StreaksWatch";

const COMPLETED_VIEW = "Completed";

// TasksView.
const TASK = "Task";
const TASK_GROUP = "TaskGroup";
const ACTIVE_TASKS = true;
const COMPLETED_TASKS = false;
const TAURI_FETCH_TASKS_VIEW = "get_tasks_view";
const TAURI_ADD_ITEM = "add_item";
const TAURI_DELETE_ITEM = "delete_item";
const TAURI_UPDATE_ITEM = "update_item";

// New Window.
const TAURI_OPEN_TOMORROW_WINDOW = "open_tomorrow_window";
const TAURI_CLOSE_TOMORROW_WINDOW = "close_tomorrow_window";

export {
  // Table names
  TODAY,
  TOMORROW,

  // Frontend Global
  ROOT,
  TASKS_VIEW,
  TOMORROW_VIEW,
  HABITS_VIEW,
  STREAKS_VIEW,

  // Completed Tasks
  COMPLETED_VIEW,

  // TasksView
  TASK,
  TASK_GROUP,
  ACTIVE_TASKS,
  COMPLETED_TASKS,
  TAURI_FETCH_TASKS_VIEW,
  TAURI_ADD_ITEM,
  TAURI_DELETE_ITEM,
  TAURI_UPDATE_ITEM,

  // New Window,
  TAURI_OPEN_TOMORROW_WINDOW,
  TAURI_CLOSE_TOMORROW_WINDOW,
};
