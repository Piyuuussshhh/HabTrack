import React, { createContext, useEffect, useState } from "react";

import { TASK, TASK_GROUP } from "../../Constants";

const DragDropContext = createContext();

const DragDropProvider = ({ children, item }) => {
  const [structure, setStructure] = useState();
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    setStructure(item);
  }, [item]);

  const handleOnDrag = (event, item) => {
    event.dataTransfer.setData("text/plain", item.id);
    setDraggedItem(item);
  };

  const handleOnDrop = (event, targetId) => {
    event.preventDefault();
    event.stopPropagation();
    // droppedItemID is a string for whatever reason, convert it to number.
    // basically event.dataTransfer.getData() always returns a string.
    const droppedItemId = Number(event.dataTransfer.getData("text/plain"));

    setStructure((prevStructure) => {
      const newStructure = JSON.parse(JSON.stringify(prevStructure));

      // Helper function to find and remove the item from its original location.
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
