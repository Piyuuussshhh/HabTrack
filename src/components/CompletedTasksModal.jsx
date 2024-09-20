import React, { useEffect, useState } from "react";
import { CancelOutlined } from "@mui/icons-material";
import { Undo } from "@mui/icons-material";
import { invoke } from "@tauri-apps/api";

import {
  TASK,
  COMPLETED_TASKS,
  TAURI_FETCH_TASKS_VIEW,
  TODAY,
  TASKS_VIEW,
  TAURI_UPDATE_ITEM,
} from "../Constants";
import { updateFrontend } from "../utility/UpdateFrontend";
import { addItem } from "../utility/AddRemoveUpdateItems";

const CompletedTasksModal = ({ onChangeTasksView, onCancel }) => {
  const [completedStructure, setCompletedStructure] = useState(null);

  useEffect(() => {
    console.log("im running");
    // let storedCompletedView = sessionStorage.getItem(COMPLETED_VIEW);
    async function fetchCompletedTasks() {
      try {
        const response = await invoke(TAURI_FETCH_TASKS_VIEW, {
          table: TODAY,
          status: COMPLETED_TASKS,
        });
        const data = JSON.parse(response);
        console.log(JSON.stringify(data));

        setCompletedStructure(data);
      } catch (error) {
        // Deal with errors properly here.
        console.error("Error fetching tasks:", error);
      }
    }

    fetchCompletedTasks();
  }, []);

  const onUndo = (item) => {
    // Update db.
    // Even if a task connected to a habit is undone and redone, the streak will increment only once thanks to CompMap :)
    invoke(TAURI_UPDATE_ITEM, {
      table: TODAY,
      id: item.id,
      field: { Status: false },
      h_plus_dt: item.habit_id
        ? [item.habit_id, item.dt_id]
        : [null, null],
    });

    // Update frontend of completed tasks view.
    setCompletedStructure(
      completedStructure.filter((child) => child.id != item.id)
    );
    // Update frontend of active tasks view.
    updateFrontend(
      addItem,
      TASKS_VIEW,
      onChangeTasksView,
      {
        id: item.id,
        name: item.name,
        type: TASK,
        parentId: item.parent_group_id,
      },
      item.parent_group_id
    );
  };

  return (
    <div className="completed-modal-overlay">
      <div className="btn-area">
        <button type="button" onClick={onCancel}>
          <span style={{ fontSize: 30 }}>X</span>
        </button>
      </div>
      <div className="completed-modal">
        <h2>Completed Tasks</h2>
        {completedStructure ? (
          <div
            className="completed-task-list"
            style={{ overflowX: "hidden", overflowY: "auto" }}
          >
            <ul>
              {completedStructure.map((node) => {
                console.log("this is the node:" + JSON.stringify(node));
                return (
                  <li key={node.id}>
                    <div className="completed-task">
                      <label>{node.name}</label>
                      {/* Only allow tasks not corresponding to habits to be undone. */}
                      {node.habit_id === null && <button
                        type="button"
                        className="task-btn"
                        onClick={() => onUndo(node)}
                      >
                        <Undo />
                      </button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p>loading...</p>
        )}
      </div>
    </div>
  );
};

export default CompletedTasksModal;
