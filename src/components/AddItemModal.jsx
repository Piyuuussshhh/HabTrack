import React from "react";
import { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";

// itempType is either TASK or HABIT.

const AddItemModal = ({ itemType, onAdd, onCancel }) => {
  const [option, setOption] = useState("Task");
  const [name, setName] = useState("");
  const [parentName, setParentName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    console.log("inside handleSubmit");
    onAdd(option, name, parentName);
  }

  function onClose() {
    onCancel();
  }

  return (
    <div className="modal-overlay">
      <div>
        <button className="close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="modal">
          <h2>Add</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Options:</label>
              <div className="option-buttons">
                <button
                  type="button"
                  className={option === "Task" ? "active" : ""}
                  onClick={() => setOption("Task")}
                >
                  Task
                </button>
                <button
                  type="button"
                  className={option === "TaskGroup" ? "active" : ""}
                  onClick={() => setOption("TaskGroup")}
                >
                  Group
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Parent Name:</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => onClose()}>
                Cancel
              </button>
              <button type="submit">Add</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
