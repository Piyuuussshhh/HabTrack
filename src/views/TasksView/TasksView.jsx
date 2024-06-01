import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import Navbar from "./Navbar";

import Task from "./Task";
import TaskGroup from "./TaskGroup";
import { type } from "@tauri-apps/api/os";

// Invoke the task data from the database.

// For now I'm making dummy tasks.

const DATA = {
  id: "root",
  type: "group",
  name: "/",
  children: [
    { id: "1", type: "task", name: "Cook food" },
    { id: "2", type: "task", name: "Take meds" },
    {
      id: "3",
      type: "group",
      name: "Programming",
      children: [
        { id: "4", type: "task", name: "learn react" },
        { id: "5", type: "task", name: "learn rust" },
        {
          id: "6",
          type: "group",
          name: "WebDev",
          children: [
            { id: "7", type: "task", name: "learn HTML" },
            { id: "8", type: "task", name: "learn CSS" },
          ],
        },
      ],
    },
    { id: "9", type: "task", name: "yo" },
  ],
};

const TEMP = {
  id: "root",
  type: "group",
  name: "/",
  children: [{ id: "1", type: "task", name: "cook food" }],
};

const TasksView = () => {
  const [structure, setStructure] = useState(DATA);

  const renderStructure = (node) => {
    if (node.type === "task") {
      return <Task key={node.id} id={node.id} name={node.name} />;
    } else if (node.type === "group") {
      return (
        <TaskGroup
          key={node.id}
          id={node.id}
          name={node.name}
          subtasks={node.children}
        />
      );
    }
  };

  return (
    <>
      <Navbar />
      <div>{renderStructure(structure)}</div>
    </>
  );
};

export default TasksView;
