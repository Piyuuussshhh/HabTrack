import React from "react";
import { nanoid } from "nanoid";

const Task = (props) => {
  function handleOnDrag(e, task) {
    e.dataTransfer.setData("task", task);
  }

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
          <button>edit</button>
        </li>
        <li>
          <button>del</button>
        </li>
      </ul>
    </div>
  );
};

export default Task;
