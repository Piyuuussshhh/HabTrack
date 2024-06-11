import React from "react";
import Navbar from "./Navbar";

import TaskGroup from "./TaskGroup";
import { DragDropProvider, DragDropContext } from "./DragDropContext";

// // Invoke the task data from the database.
// THIS IS CHANGED. NOW YOU HAVE TO INVOKE TASK IN DragDropProvider.jsx

const TasksView = () => {
  return (
    <div className="box">
      <Navbar />
      <div className="task-area">
        {/* I don't understand how this works, but it works. */}
        <DragDropProvider>
          <DragDropContext.Consumer>
            {/* This structure = initialStructure from DragDropContext.jsx */}
            {/* Null check to ensure structure is populated w contents of db */}
            {({ structure }) =>
              structure ? (
                <TaskGroup
                  key={structure.id}
                  id={structure.id}
                  name={structure.name}
                  children={structure.children}
                />
              ) : (
                <p>loading...</p>
              )
            }
          </DragDropContext.Consumer>
        </DragDropProvider>
      </div>
    </div>
  );
};

export default TasksView;
