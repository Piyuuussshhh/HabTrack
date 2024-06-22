import React from "react";
import { useContext } from "react";
import { invoke } from "@tauri-apps/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";

import { DragDropContext } from "./DragDropContext";
import { TASK, TASKS_VIEW, TAURI_DELETE_TASK, TODAY } from "../../Constants";

const Task = (props) => {
  // Adds ID of dragged task to DragEvent datastore and changes state of the DragDropContext.
  const { handleOnDrag } = useContext(DragDropContext);

  /*Tried adding the edit symbol, but the entire screen just goes black?*/
  /* <FontAwesomeIcon icon={faEdit} className="icon edit-icon" /> */

  const handleDelete = (e) => {
    e.preventDefault();
    invoke(TAURI_DELETE_TASK, {
      table: TODAY,
      id: props.id,
    });
    sessionStorage.removeItem(TASKS_VIEW);
    // TODO: NO RELOADING, DELETE FROM SESSIONSTORAGE.
    location.reload();
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
      <div className="text-container">
        <label className="task-name" htmlFor={props.id}>
          {props.name}
        </label>
        {/* <p className='sub-text'></p> */}
      </div>
      <ul>
        <li>
          <button className="edit-icon">
            <EditIcon />
          </button>
        </li>
        <li>
          <button className="delete-icon" onClick={handleDelete}>
            <DeleteForeverIcon />
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Task;
