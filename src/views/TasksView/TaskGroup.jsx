import React, { useContext } from "react";

import Task from "./Task";
import { DragDropContext } from "./DragDropContext";

const ROOT = "/";

const TaskGroup = ({key, id, name, children}) => {
  const { handleOnDrop } = useContext(DragDropContext);

  return (
    <div
      className="taskgroup-container"
      draggable
      onDrop={(e) => {
        handleOnDrop(e, id);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {name !== ROOT && <h3 className="bold">{name}</h3>}
      <div className="subtasks-list">
        {children.map((child) => {
          if (child.type === "task") {
            return <Task name={child.name} id={child.id} key={child.id} />;
          } else {
            return (
              <TaskGroup
                key={child.id}
                id={child.id}
                name={child.name}
                children={child.children}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default TaskGroup;
