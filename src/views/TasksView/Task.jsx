import React from "react";
import { useContext } from "react";
import { invoke } from "@tauri-apps/api";

// Icon Imports
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// Local Resources
import { DragDropContext } from "./DragDropContext";
import { TASK, TASKS_VIEW, TAURI_DELETE_TASK, TODAY } from "../../Constants";
import { removeItem } from "../../utility/AddRemoveItems";

const Task = (props) => {
  // Adds ID of dragged task to DragEvent datastore and changes state of the DragDropContext.
  const { handleOnDrag } = useContext(DragDropContext);

  const handleDelete = (e) => {
    e.preventDefault();

    invoke(TAURI_DELETE_TASK, {
      table: TODAY,
      id: props.id,
    });

    let storedView = JSON.parse(sessionStorage.getItem(TASKS_VIEW));

    removeItem(props.id, storedView);

    sessionStorage.setItem(TASKS_VIEW, JSON.stringify(storedView));
    props.onDelete();
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => {
        /* A duplicate of this current task is passed to handleOnDrag*/
        handleOnDrag(e, { id: props.id, name: props.name, type: TASK });
      }}
    >
      <input type="checkbox" id={props.id} />
      <label className="task-checkbox" htmlFor={props.id}></label>
      <div className="text-container">
        <label className="task-name" htmlFor={props.id}>
          {props.name}
        </label>
      </div>
      <ul>
        <li>
          <button className="task-btn"><EditIcon></EditIcon></button>
        </li>
        <li>
          <button className="delete-icon" onClick={handleDelete}><DeleteIcon></DeleteIcon></button>
        </li>
      </ul>
    </div>
  );
};

export default Task;