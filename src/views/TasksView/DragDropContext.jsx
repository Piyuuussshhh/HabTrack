import React, { createContext, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";

import { addItem, removeItem } from "../../utility/AddRemoveUpdateItems";
import {
  TASKS_VIEW,
  TAURI_UPDATE_ITEM,
  TODAY,
  TOMORROW_VIEW,
} from "../../Constants";
import { updateFrontend } from "../../utility/UpdateFrontend";

const DragDropContext = createContext();

const DragDropProvider = ({ children, item, dbTable }) => {
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

    // There is a redundant command call when the todo is dropped in the
    // same group of its origin. No update is made, and simply the database
    // is queried. Fix that.

    invoke(TAURI_UPDATE_ITEM, {
      table: dbTable,
      id: droppedItemId,
      field: { Parent: targetId },
    });

    setStructure(() => {
      const view = dbTable === TODAY ? TASKS_VIEW : TOMORROW_VIEW;
      updateFrontend(removeItem, view, null, droppedItemId);
      updateFrontend(addItem, view, null, draggedItem, targetId);
      return JSON.parse(sessionStorage.getItem(view));
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
