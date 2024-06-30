import React, { useState, useContext } from "react";
import { invoke } from "@tauri-apps/api";

// Icon Imports
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";

// Local Resources
import { DragDropContext } from "./DragDropContext";
import {
  TASK,
  TASKS_VIEW,
  TODAY,
  TAURI_DELETE_TASK,
  TAURI_EDIT_TASK_OR_GROUP,
} from "../../Constants";
import { removeItem, updateItem } from "../../utility/AddRemoveUpdateItems";

const Task = (props) => {
  // Adds ID of dragged task to DragEvent datastore and changes state of the DragDropContext.
  const { handleOnDrag } = useContext(DragDropContext);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedName, setEditedName] = useState(null);

  const handleDelete = (e) => {
    e.preventDefault();

    // Delete task from the database.
    invoke(TAURI_DELETE_TASK, {
      table: TODAY,
      id: props.id,
    });

    // Delete task from the frontend.
    let storedView = JSON.parse(sessionStorage.getItem(TASKS_VIEW));
    removeItem(props.id, storedView);
    sessionStorage.setItem(TASKS_VIEW, JSON.stringify(storedView));
    props.onChangeTasksView();
  };

  function handleEdit() {
    if (editingTaskId) {
      setEditingTaskId(null);
    } else {
      setEditingTaskId(props.id);
    }
  }

  function onChange(e) {
    setEditedName(e.target.value);
  }

  function handleConfirmEdit() {
    // Update name in the database.
    invoke(TAURI_EDIT_TASK_OR_GROUP, {
      table: TODAY,
      name: editedName,
      id: props.id,
    });

    // Update name on the frontend.
    const storedView = JSON.parse(sessionStorage.getItem(TASKS_VIEW));
    updateItem(props.id, editedName, storedView);
    sessionStorage.setItem(TASKS_VIEW, JSON.stringify(storedView));

    setEditingTaskId(null);
    props.onChangeTasksView();
  }

  function cancelEdit() {
    setEditedName(null);
    setEditingTaskId(null);
  }

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => {
        /* A duplicate of this current task is passed to handleOnDrag*/
        handleOnDrag(e, { id: props.id, name: props.name, type: TASK });
      }}
      onClick={editingTaskId === props.id ? cancelEdit : null}
    >
      <input type="checkbox" id={props.id} />
      <label className="task-checkbox" htmlFor={props.id}></label>
      <div className="text-container">
        {editingTaskId == props.id ? (
          <span className="edit-area">
            <input
              type="text"
              className="edit-task-inp"
              onInput={onChange}
              onBlur={cancelEdit}
              autoFocus
            />
          </span>
        ) : (
          <label className="task-name" htmlFor={props.id}>
            {props.name}
          </label>
        )}
      </div>
      <ul>
        {editingTaskId == props.id ? (
          <li>
            <button className="task-btn" onClick={handleConfirmEdit}>
              <CheckIcon />
            </button>
          </li>
        ) : (
          <>
            <li>
              <button className="task-btn" onClick={handleEdit}>
                <EditIcon />
              </button>
            </li>
            <li>
              <button className="delete-icon" onClick={handleDelete}>
                <DeleteIcon />
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default Task;
