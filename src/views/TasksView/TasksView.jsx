import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { invoke } from "@tauri-apps/api";

import {
  TODAY,
  TASK,
  TASKS_VIEW,
  ACTIVE_TASKS,
  TASK_GROUP,
  TAURI_FETCH_TASKS_VIEW,
  TAURI_ADD_ITEM,
  ROOT,
  TAURI_EXPORT_TO_PDF,
} from "../../Constants";

import TaskGroup from "./TaskGroup";
import { DragDropProvider, DragDropContext } from "./DragDropContext";
import Modal from "../../components/Modal";
import { addItem } from "../../utility/AddRemoveUpdateItems";
import { updateFrontend } from "../../utility/UpdateFrontend";
import CompletedTasksModal from "../../components/CompletedTasksModal";

/*
    TODO -> ERROR HANDLING.
            We don't handle errors when the input string in
            Parent Name in the add item model is not an actual
            valid parent group.

            Arnav's idea: Instead of a textbox, use a dropdown menu
            to display the available parent groups.
*/

const NOT_FOUND = -1;

const TasksView = ({ isSidebarOpen, mainAreaRef }) => {
  const [showModal, setModalVisibility] = useState(false);
  const [structure, setStructure] = useState("");
  const [showCompleted, setCompletedTasksVisibility] = useState(false);
  const [preselectGroup, setPreselectGroup] = useState(ROOT);

  /*
      Probably should not do this, and just add the task to
      the JSON object in sessionStorage. SEE TOP TODO.
  */
  useEffect(() => {
    async function fetchTasks() {
      const storedView = sessionStorage.getItem(TASKS_VIEW);
      if (storedView) {
        setStructure(JSON.parse(storedView));
        return;
      }
      try {
        const response = await invoke(TAURI_FETCH_TASKS_VIEW, {
          table: TODAY,
          status: ACTIVE_TASKS,
        });
        const data = JSON.parse(response);

        // Set sessionStorage.
        sessionStorage.setItem(TASKS_VIEW, response);

        setStructure(data);
      } catch (error) {
        // Deal with errors properly here.
        console.error("Error fetching tasks:", error);
      }
    }

    fetchTasks();

    // THE EMPTY DEPENDENCY ARRAY AS THE SECOND ARGUMENT OF
    // useEffect() IS VERY IMPORTANT BECAUSE IT STOPS THE
    // FUNCTION FROM RUNNING A BAJILLION TIMES.
  }, []);

  function seeModal(name) {
    setPreselectGroup(name);
    setModalVisibility(true);
  }

  const add = (option, name, parentName) => {
    function getId(node) {
      // This will store the id of the parent if it is found, -1 if not.
      let res = NOT_FOUND;

      if (node.type === TASK_GROUP && node.name === parentName) {
        return node.id;
      } else if (node.type === TASK_GROUP && node.children) {
        node.children.forEach((child) => {
          let temp = getId(child);
          if (temp != -1) {
            res = temp;
          }
        });
      }

      return res;
    }

    const storedView = JSON.parse(sessionStorage.getItem(TASKS_VIEW));
    const parentGroupId = getId(storedView);
    if (parentGroupId === NOT_FOUND) {
      // show Error in the modal.
      return;
    }

    invoke(TAURI_ADD_ITEM, {
      table: TODAY,
      name: name,
      parent_group_id: parentGroupId,
      item_type: option,
    })
      .then((id) => {
        let isActive = option === TASK ? true : null;
        let children = option === TASK ? null : [];
        // Adding the new task to the view without having to fetch again.
        updateFrontend(
          addItem,
          TASKS_VIEW,
          onChangeTasksView,
          {
            id: id,
            name: name,
            type: option,
            is_active: isActive,
            parent_group_id: parentGroupId,
            children: children,
          },
          parentGroupId
        );
      })
      // TODO: ERROR HANDLING {i know you came here probably by ctrl+f-ing for console.log()s}
      .catch((error) => console.log(error));

    setModalVisibility(false);
  };

  function closeModal(type) {
    if (type === "AddModal") {
      setModalVisibility(false);
    } else if (type === "CompletedModal") {
      setCompletedTasksVisibility(false);
    }
  }

  function toggleCompleted() {
    setCompletedTasksVisibility(true);
  }

  function onChangeTasksView() {
    setStructure(JSON.parse(sessionStorage.getItem(TASKS_VIEW)));
  }

  const onExport = async () => {
    try {
      await invoke(TAURI_EXPORT_TO_PDF);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <div className="box">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onExport={onExport}
          onAdd={seeModal}
          toggleCompleted={toggleCompleted}
          onChangeView={onChangeTasksView}
        />
        <div className="task-area">
          {/* I don't understand how this works, but it works. */}
          <DragDropProvider item={structure} dbTable={TODAY}>
            <DragDropContext.Consumer>
              {/* This structure = initialStructure from DragDropContext.jsx */}
              {/* Null check to ensure structure is populated w contents of db */}
              {({ structure }) =>
                structure ? (
                  <TaskGroup
                    key={structure.id}
                    id={structure.id}
                    name={structure.name}
                    children={structure.children}
                    onChangeView={onChangeTasksView}
                    preselectGroup={seeModal}
                    dbTable={TODAY}
                    taskViewRef={mainAreaRef}
                  />
                ) : (
                  <p>loading...</p>
                )
              }
            </DragDropContext.Consumer>
          </DragDropProvider>
        </div>
      </div>
      {showModal && (
        <Modal
          view={TASKS_VIEW}
          preselected={preselectGroup}
          onAdd={add}
          onCancel={() => closeModal("AddModal")}
        />
      )}
      {showCompleted && (
        <CompletedTasksModal
          onChangeTasksView={onChangeTasksView}
          onCancel={() => closeModal("CompletedModal")}
        />
      )}
    </>
  );
};

export default TasksView;
