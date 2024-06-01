import React from "react";
import { nanoid } from "nanoid";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const Task = (props) => {
  function handleOnDrag(e, task) {
    e.dataTransfer.setData("task", task);
  }

  /*Tried adding the edit symbol, but the entire screen just goes black?*/
  /* <FontAwesomeIcon icon={faEdit} className="icon edit-icon" /> */
  
  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => {
        handleOnDrag(e, `${props.name}`);
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
