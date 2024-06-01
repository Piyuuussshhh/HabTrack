import React, { useState } from "react";
import { nanoid } from "nanoid";
import Task from "./Task";

const TaskGroup = (props) => {
  const [tasksInGroup, setTasksInGroup] = useState(props.subtasks);

  function handleOnDrop(e) {
    // TODO: handle drop of taskgroups too.
    const newTask = e.dataTransfer.getData("task");
    setTasksInGroup([...tasksInGroup, newTask]);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }
  return (
    <div
      className="taskgroup-container"
      draggable
      onDrop={(e) => {
        handleOnDrop(e);
      }}
      onDragOver={(e) => {
        handleDragOver(e);
      }}
    >
      {props.name !== "/" && <h3 className="bold">{props.name}</h3>}
      <div className="subtasks-list">
        {tasksInGroup.map((task) => {
          if (task.type === "task") {
            return (<Task name={task.name} id={task.id} key={task.id} />);
          } else {
            return (<TaskGroup key={task.id}
              id={task.id}
              name={task.name}
              subtasks={task.children}/>)
          }
        })}
      </div>
    </div>
  );
};

export default TaskGroup;
