import React, { useContext, useState } from "react";

import { IconButton } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";

import { ROOT, TASK, TASK_GROUP } from "../../Constants";
import Task from "./Task";
import { DragDropContext } from "./DragDropContext";

const TaskGroup = ({ id, name, children, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const { handleOnDrop } = useContext(DragDropContext);

  const groupOptions = ["Delete Group"];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  function handleMenuItemClick(option) {
    if (option === "Delete Group") {
      deleteGroup();
    }

    handleClose();
  }

  function deleteGroup() {
    console.log("deleting group: " + name + "-" + id);
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div
      className="taskgroup-container"
      onDrop={(e) => {
        handleOnDrop(e, id);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {name !== ROOT && (
        <div className="group-header">
          {name !== ROOT && <h3 className="bold">{name}</h3>}
          <IconButton
            style={{ color: "white", alignSelf: "start" }}
            aria-label="more"
            onClick={handleClick}
            aria-haspopup="true"
            aria-controls="long-menu"
          >
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            onClose={handleClose}
            open={open}
          >
            {groupOptions.map((option) => (
              <MenuItem
                key={option}
                onClick={() => handleMenuItemClick(option)}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>
        </div>
      )}
      {children.length > 0 ? (
        <div className="subtasks-list">
          {children.map((child) => {
            if (child.type === TASK) {
              return (
                <Task
                  name={child.name}
                  id={child.id}
                  key={child.id}
                  onDelete={onDelete}
                />
              );
            } else if (child.type === TASK_GROUP) {
              return (
                <TaskGroup
                  key={child.id}
                  id={child.id}
                  name={child.name}
                  children={child.children}
                  onDelete={onDelete}
                />
              );
            }
          })}
        </div>
      ) : (
        <p>No tasks yet!</p>
      )}
    </div>
  );
};

export default TaskGroup;
