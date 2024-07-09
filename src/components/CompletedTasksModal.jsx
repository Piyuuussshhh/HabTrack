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
    invoke(TAURI_UPDATE_ITEM, {
      table: TODAY,
      id: item[0],
      field: { Status: false },
    });

    // Update frontend of completed tasks view.
    setCompletedStructure(
      completedStructure.filter((child) => child[0] != item[0])
    );
    // Update frontend of active tasks view.
    updateFrontend(
      addItem,
      TASKS_VIEW,
      onChangeTasksView,
      {
        id: item[0],
        name: item[1],
        type: TASK,
        parentId: item[item.length - 1],
      },
      item[item.length - 1]
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
                console.log("this is the node:" + node);
                return (
                  <li key={node[0]}>
                    <div className="completed-task">
                      <label>{node[1]}</label>
                      <button
                        type="button"
                        className="task-btn"
                        onClick={() => onUndo(node)}
                      >
                        <Undo />
                      </button>
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
