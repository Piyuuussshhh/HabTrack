import React, { useState, useEffect, useContext } from "react";
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
  TAURI_DELETE_ITEM,
  TAURI_EDIT_ITEM,
  TAURI_UPDATE_STATUS_ITEM,
} from "../../Constants";
import { removeItem, updateItem } from "../../utility/AddRemoveUpdateItems";
import { updateFrontend } from "../../utility/UpdateFrontend";

const Task = (props) => {
  // Adds ID of dragged task to DragEvent datastore and changes state of the DragDropContext.
  const { handleOnDrag } = useContext(DragDropContext);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedName, setEditedName] = useState(null);
  const [isCompleted, setCompleted] = useState(false);

  useEffect(() => {
    if (editingTaskId) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingTaskId]);

  const handleDelete = (e) => {
    e.preventDefault();

    // Delete task from the database.
    invoke(TAURI_DELETE_ITEM, {
      table: TODAY,
      id: props.id,
      item_type: TASK,
    });

    // Delete task from the frontend.
    updateFrontend(removeItem, TASKS_VIEW, props.onChangeTasksView, props.id);
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
    invoke(TAURI_EDIT_ITEM, {
      table: TODAY,
      name: editedName,
      id: props.id,
    });

    // Update name on the frontend.
    updateFrontend(
      updateItem,
      TASKS_VIEW,
      props.onChangeTasksView,
      props.id,
      editedName
    );

    setEditingTaskId(null);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      cancelEdit();
    }
  };

  function cancelEdit() {
    setEditedName(null);
    setEditingTaskId(null);
  }

  function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function handleCompletion(e) {
    setCompleted(true);
    await sleep(1500);
    setCompleted(false);
    const isCompleted = e.target.checked;
    if (isCompleted) {
      // Update database.
      invoke(TAURI_UPDATE_STATUS_ITEM, {
        table: TODAY,
        id: props.id,
        status: isCompleted,
      });

      // Update frontend.
      updateFrontend(removeItem, TASKS_VIEW, props.onChangeTasksView, props.id);
    }
  }

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => {
        /* A duplicate of this current task is passed to handleOnDrag*/
        handleOnDrag(e, {
          id: props.id,
          name: props.name,
          type: TASK,
        });
      }}
    >
      <input type="checkbox" id={props.id} onClick={handleCompletion} />
      <label className="task-checkbox" htmlFor={props.id}></label>
      <div className="text-container">
        {editingTaskId === props.id ? (
          <input
            type="text"
            className="edit-task-inp"
            onInput={onChange}
            placeholder="press ESC key to stop editing..."
            autoFocus
          />
        ) : (
          <span>
            <label className="task-name" htmlFor={props.id}>
              {props.name}
            </label>
          </span>
        )}
      </div>
      <ul>
        {editingTaskId === props.id ? (
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
      {isCompleted && (
        <div className="progress-loader">
          <div className="progress"></div>
        </div>
      )}
    </div>
  );
};

export default Task;
