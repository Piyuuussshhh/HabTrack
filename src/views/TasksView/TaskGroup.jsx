import React, { useContext, useState } from "react";

import { IconButton } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  ROOT,
  TASK,
  TASKS_VIEW,
  TASK_GROUP,
  TAURI_DELETE_GROUP,
  TODAY,
} from "../../Constants";
import Task from "./Task";
import { DragDropContext } from "./DragDropContext";
import { invoke } from "@tauri-apps/api";
import { removeItem } from "../../utility/AddRemoveItems";
import AlertModal from "../../components/AlertModal";

const TaskGroup = ({ id, name, children, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAlert, setAlertVisibility] = useState(false);

  const { handleOnDrop } = useContext(DragDropContext);

  const groupOptions = ["Edit", "Add Task", "Delete Group"];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  function handleMenuItemClick(e, option) {
    if (option === "Delete Group") {
      setAlertVisibility(true);
    }

    handleClose();
  }

  function handleConfirmDelete() {
    deleteGroup();
    setAlertVisibility(false);
  }

  function deleteGroup() {
    // Deleting group from database.
    invoke(TAURI_DELETE_GROUP, {
      table: TODAY,
      id: id,
    });

    // Deleting group from front-end.
    const storedView = JSON.parse(sessionStorage.getItem(TASKS_VIEW));
    removeItem(id, storedView);
    sessionStorage.setItem(TASKS_VIEW, JSON.stringify(storedView));
    // To rerender TasksView.
    onDelete();
  }

  function onCancel() {
    setAlertVisibility(false);
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
          {/* Use IconMenu instead for better looks. Add icon -> Add task etc.*/}
          <Menu
            anchorEl={anchorEl}
            keepMounted
            onClose={handleClose}
            open={open}
            MenuListProps={{
              'display': "flex",
              'flex-direction': "column",
            }}
          >
            {groupOptions.map((option) => (
              <MenuItem
                key={option}
                onClick={(e) => handleMenuItemClick(e, option)}
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
      {showAlert && (
        <AlertModal
          alertType={TASK_GROUP}
          message={
            "Deleting a group will delete all its sub-tasks and sub-groups."
          }
          onConfirm={handleConfirmDelete}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default TaskGroup;
