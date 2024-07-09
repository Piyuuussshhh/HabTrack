import React, { useState, useEffect } from "react";
import { TASK_GROUP, TASK, ROOT } from "../Constants";

const Modal = ({ view, preselected, onAdd, onCancel }) => {
  const [option, setOption] = useState(TASK);
  const [name, setName] = useState("");
  const [group, setGroup] = useState(preselected);
  const [groups, setAllGroups] = useState(null);

  useEffect(() => {
    let storedView = JSON.parse(sessionStorage.getItem(view));

    const extractNames = (obj) => {
      let names = [];

      const traverse = (node) => {
        if (node.type === TASK_GROUP) {
          names.push(node.name);
        }
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => traverse(child));
        }
      };

      traverse(obj);
      return names;
    };

    let temp = extractNames(storedView);

    setAllGroups(temp);
  }, []);

  const handleTypeChange = (type) => {
    setOption(type);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleGroupChange = (e) => {
    setGroup(e.target.value);
  };

  function handleSubmit(e) {
    e.preventDefault();
    onAdd(option, name, group);
  }

  return (
    <div className="modal">
      <div className="close-x-btn">
        <button className="x-btn">
          <span className="X"></span>
          <span className="Y"></span>
        </button>
      </div>
      <div className="modal-content">
        <h2>Add</h2>
        <div className="tab">
          <button
            className={option === TASK ? "active" : "idle-btn"}
            onClick={() => handleTypeChange(TASK)}
          >
            <strong>Task</strong>
          </button>
          <button
            className={option === TASK_GROUP ? "active" : "idle-btn"}
            onClick={() => handleTypeChange(TASK_GROUP)}
          >
            <strong>Group</strong>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              <strong>Name:</strong>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={handleNameChange}
              autoFocus
            />
          </div>
          {groups && (
            <>
              <div className="form-group">
                <label htmlFor="group">
                  <strong>Group:</strong>
                </label>
                <select
                  id="group"
                  onChange={handleGroupChange}
                  defaultValue={preselected}
                >
                  {groups.map((group, idx) => (
                    <option key={idx} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="buttons">
            <button className="cancel-btn" type="button" onClick={onCancel}>
              <strong>Cancel</strong>
            </button>
            <button
              className="add-btn"
              type="submit"
              onClick={(e) => handleSubmit(e)}
            >
              <strong>Add</strong>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Modal;
