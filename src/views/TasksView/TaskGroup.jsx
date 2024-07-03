import React, { useContext, useState } from "react";

import { IconButton } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
// import DeleteIcon from "@mui/icons-material/Delete";

import {
  ROOT,
  TASK,
  TASKS_VIEW,
  TASK_GROUP,
  TAURI_DELETE_ITEM,
  TODAY,
} from "../../Constants";
import Task from "./Task";
import { DragDropContext } from "./DragDropContext";
import { invoke } from "@tauri-apps/api";
import { removeItem } from "../../utility/AddRemoveUpdateItems";
import AlertModal from "../../components/AlertModal";
import { updateFrontend } from "../../utility/UpdateFrontend";

const TaskGroup = ({ id, name, children, onChangeTasksView }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAlert, setAlertVisibility] = useState(false);

  const { handleOnDrop } = useContext(DragDropContext);

  const groupOptions = ["Edit", "Add Task", "Delete Group"];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);

  function handleMenuItemClick(option) {
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
    invoke(TAURI_DELETE_ITEM, {
      table: TODAY,
      id: id,
      item_type: TASK_GROUP,
    });

    // Deleting group from front-end.
    updateFrontend(removeItem, TASKS_VIEW, onChangeTasksView, id);
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
              display: "flex",
              "flex-direction": "column",
            }}
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
                  onChangeTasksView={onChangeTasksView}
                />
              );
            } else if (child.type === TASK_GROUP) {
              return (
                <TaskGroup
                  key={child.id}
                  id={child.id}
                  name={child.name}
                  children={child.children}
                  onChangeTasksView={onChangeTasksView}
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
