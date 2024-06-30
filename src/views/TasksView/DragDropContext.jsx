import React, { createContext, useEffect, useState } from "react";

import { addItem, removeItem } from "../../utility/AddRemoveUpdateItems";
import { TASKS_VIEW } from "../../Constants";

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
      removeItem(droppedItemId, newStructure);
      addItem(draggedItem, targetId, newStructure);
      sessionStorage.setItem(TASKS_VIEW, JSON.stringify(newStructure));
      return newStructure;
    });
    setDraggedItem(null);
  };

  return (
    <DragDropContext.Provider value={{ structure, handleOnDrag, handleOnDrop }}>
      {children}
    </DragDropContext.Provider>
  );
};

export { DragDropContext, DragDropProvider };
