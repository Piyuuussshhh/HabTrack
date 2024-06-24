import React from "react";
import { DragDropContext } from "./DragDropContext";
import { useContext } from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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
        handleOnDrag(e, {id: props.id, name: props.name, type: "task"});
      }}
    >
      <input type="checkbox" id={props.id} />
      <label className="task-checkbox" htmlFor={props.id}></label>
      <div className="text-container">
        <label className="task-name" htmlFor={props.id}>
          {props.name}
        </label>
        {/* <p className='sub-text'></p> */}
      </div>
      <ul>
        <li>
          <button className="task-btn"><EditIcon></EditIcon></button>

        </li>
        <li>
          <button className="delete-icon"><DeleteIcon></DeleteIcon></button>
        </li>
      </ul>
    </div>
  );
};

export default Task;
