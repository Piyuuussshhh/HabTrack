import { invoke } from "@tauri-apps/api";
import React, { createContext, useEffect, useState } from "react";

const TASK = "Task";
const TASK_GROUP = "TaskGroup";

const DragDropContext = createContext();

// TODO: Import task data from database here.

const DragDropProvider = ({ children }) => {
  const [structure, setStructure] = useState();
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    console.log("in useEffect in DragDropContext");
    async function fetchTasks() {
      try {
        console.log("fetching data...");
        const response = await invoke("get_tasks_view");
        const data = JSON.parse(response);
        console.log(`fetched data: ${data.name}`);

        setStructure(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    }

    fetchTasks();

    // THE EMPTY DEPENDENCY ARRAY AS THE SECOND ARGUMENT OF
    // useEffect() IS VERY IMPORTANT BECAUSE IT STOPS THE
    // FUNCTION FROM RUNNING A BAJILLION TIMES.
  }, []);

  const handleOnDrag = (event, item) => {
    event.dataTransfer.setData("text/plain", item.id);
    setDraggedItem(item);
  };

  const handleOnDrop = (event, targetId) => {
    event.preventDefault();
    event.stopPropagation();
    // DraggedItemID is a string for whatever reason, convert it to number.
    const droppedItemId = Number(event.dataTransfer.getData("text/plain"));
    console.log(`droppedItemId: ${droppedItemId}`);
    console.log(`targetId: ${targetId}`);

    setStructure((prevStructure) => {
      const newStructure = JSON.parse(JSON.stringify(prevStructure));

      // Helper function to find and remove the item from its original location
      const removeItem = (id, node) => {
        if (node.children) {
          node.children = node.children.filter((child) => child.id !== id);
          // If item not found in node.children, search and remove it from each child of node.children.
          node.children.forEach((child) => removeItem(id, child));
        }
      };
      removeItem(droppedItemId, newStructure);

      // Helper function to find the target group and add the item.
      const addItem = (item, targetId, node) => {
        if (node.id === targetId) {
          if (!node.children) node.children = [];
          node.children.push(item);
          // Sorting & reversing so that sub-tasks appear above sub-groups.
          node.children.sort(tasksFirstGroupsNext);
          console.log(children);
        } else if (node.children) {
          // Find and add the item in the group in which it needs to be added.
          node.children.forEach((child) => addItem(item, targetId, child));
        }
      };
      addItem(draggedItem, targetId, newStructure);

      return newStructure;
    });
    setDraggedItem(null);
  };

  function tasksFirstGroupsNext(child1, child2) {
    if (child1.type === TASK && child2.type === TASK_GROUP) {
      return -1;
    } else if (child1.type === TASK_GROUP && child2.type === TASK) {
      return 1;
    } else {
      return 0;
    }
  }

  return (
    <DragDropContext.Provider value={{ structure, handleOnDrag, handleOnDrop }}>
      {children}
    </DragDropContext.Provider>
  );
};

export { DragDropContext, DragDropProvider };
