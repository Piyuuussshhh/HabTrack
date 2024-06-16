import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { DragDropContext } from "./DragDropContext";
import { useContext } from "react";

import { TASK } from "../../Constants";

const Task = (props) => {
  // Adds ID of dragged task to DragEvent datastore and changes state of the DragDropContext.
  const { handleOnDrag } = useContext(DragDropContext);

  /*Tried adding the edit symbol, but the entire screen just goes black?*/
  /* <FontAwesomeIcon icon={faEdit} className="icon edit-icon" /> */

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
          <button className="task-btn">Edit</button>
        </li>
        <li>
          <FontAwesomeIcon icon={faTrashAlt} className="delete-icon" />
        </li>
      </ul>
    </div>
  );
};

export default Task;
