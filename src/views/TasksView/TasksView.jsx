import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { invoke } from "@tauri-apps/api";

import {
  TODAY,
  TASK,
  TASKS_VIEW,
  TASK_GROUP,
  TAURI_FETCH_TASKS_VIEW,
  TAURI_ADD_TASK,
  TAURI_ADD_TASKGROUP,
} from "../../Constants";

import TaskGroup from "./TaskGroup";
import { DragDropProvider, DragDropContext } from "./DragDropContext";
import Modal from "../../components/Modal";
import { addItem } from "../../utility/AddRemoveItems";

/*
    TODO -> ERROR HANDLING.
            We don't handle errors when the input string in
            Parent Name in the add item model is not an actual
            valid parent group.

            Arnav's idea: Instead of a textbox, use a dropdown menu
            to display the available parent groups.
*/

const NOT_FOUND = -1;

const TasksView = () => {
  const [showModal, setModalVisibility] = useState(false);
  const [structure, setStructure] = useState("");

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
        const response = await invoke(TAURI_FETCH_TASKS_VIEW, { table: TODAY });
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

  function seeModal() {
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

    if (option === TASK) {
      invoke(TAURI_ADD_TASK, {
        table: TODAY,
        name: name,
        parent_group_id: parentGroupId,
      })
        .then((id) => {
          // Adding the new task to the view without having to fetch again.
          addItem(
            {
              id: id,
              name: name,
              type: TASK,
              is_active: true,
              parent_group_id: parentGroupId,
              children: null,
            },
            parentGroupId,
            storedView
          );
          setStructure(storedView);
          sessionStorage.setItem(TASKS_VIEW, JSON.stringify(storedView));
        })
        // TODO: ERROR HANDLING {i know you came here probably by ctrl+f-ing for console.log()s}
        .catch((error) => console.log(error));
    } else if (option === TASK_GROUP) {
      invoke(TAURI_ADD_TASKGROUP, {
        table: TODAY,
        name: name,
        parent_group_id: parentGroupId,
      }).then((id) => {
        // Adding the new group to the view without having to fetch again.
        addItem(
          {
            id: id,
            name: name,
            type: TASK_GROUP,
            is_active: null,
            parent_group_id: parentGroupId,
            children: [],
          },
          parentGroupId,
          storedView
        );
        setStructure(storedView);
        sessionStorage.setItem(TASKS_VIEW, JSON.stringify(storedView));
      });
    }

    setModalVisibility(false);
  };

  function closeModal() {
    setModalVisibility(false);
  }

  function onDelete() {
    setStructure(JSON.parse(sessionStorage.getItem(TASKS_VIEW)));
  }

  return (
    <>
      <div className="box">
        <Navbar onAdd={seeModal} />
        <div className="task-area">
          {/* I don't understand how this works, but it works. */}
          <DragDropProvider item={structure}>
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
                    onDelete={onDelete}
                  />
                ) : (
                  <p>loading...</p>
                )
              }
            </DragDropContext.Consumer>
          </DragDropProvider>
        </div>
      </div>
      {showModal && <Modal itemType={TASK} onAdd={add} onCancel={closeModal} />}
    </>
  );
};

export default TasksView;
