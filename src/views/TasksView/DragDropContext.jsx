import React, { createContext, useState } from "react";

const DragDropContext = createContext();

// TODO: Import task data from database here.

const DragDropProvider = ({ children }) => {
  const initialStructure = {
    id: "0",
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
    ],
  };

  const [structure, setStructure] = useState(initialStructure);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleOnDrag = (event, item) => {
    event.dataTransfer.setData("text/plain", item.id);
    setDraggedItem(item);
  };

  const handleOnDrop = (event, targetId) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedItemId = event.dataTransfer.getData("text/plain");
    console.log(`droppedItemId: ${droppedItemId}`);
    console.log(`targetId: ${targetId}`);

    setStructure((prevStructure) => {
      const newStructure = JSON.parse(JSON.stringify(prevStructure));

      // Helper function to find and remove the item from its original location
      const removeItem = (id, node) => {
        if (node.children) {
          node.children = node.children.filter((child) => child.id !== id);
          node.children.forEach((child) => removeItem(id, child));
        }
      };
      removeItem(droppedItemId, newStructure);

      // Helper function to find the target group and add the item
      const addItem = (item, targetId, node) => {
        if (node.id === targetId) {
          if (!node.children) node.children = [];
          node.children.push(item);
          // Sorting & reversing so that sub-tasks appear above sub-groups.
          node.children.sort(tasksFirstGroupsNext);
          console.log(children);
        } else if (node.children) {
          node.children.forEach((child) => addItem(item, targetId, child));
        }
      };
      addItem(draggedItem, targetId, newStructure);

      return newStructure;
    });
    setDraggedItem(null);
  };

  function tasksFirstGroupsNext(child1, child2) {
    if (child1.type === "task" && child2.type === "group") {
      return -1;
    } else if (child1.type === "group" && child2.type === "task") {
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
