import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { invoke } from "@tauri-apps/api";

import {
  TODAY,
  TASK,
  TASKS_VIEW,
  TASK_GROUP,
  TAURI_FETCH_TASKS,
  TAURI_ADD_TASK,
  TAURI_ADD_TASKGROUP,
} from "../../Constants";

import TaskGroup from "./TaskGroup";
import { DragDropProvider, DragDropContext } from "./DragDropContext";
import AddItemModal from "../../components/AddItemModal";

/*
    TODO -> FEWER DATABASE QUERY OPTIMIZATION.
            On addition, add the task to the database BUT
            to generate the final structure, just use the addItem function
            similar to the one in dragDropContext w some modifications.

            Similarly, this approach can be used in task deletion as well.

    TODO -> ERROR HANDLING.
            We don't handle errors when the input string in
            Parent Name in the add item model is not an actual
            valid parent group.

            Arnav's idea: Instead of a textbox, use a dropdown menu
            to display the available parent groups.

    TODO -> FIX CHEAP RELOAD TRICK.
            Rn, we have to reload the page after adding a new task
            or a group because I can't figure out how to get the new
            item to be displayed without doing so.

            Probably when the optimization mentioned above is implemented,
            a reload will not be necessary. This is because, inevitably,
            setStructure() will be called, leading to a re-render of the
            TasksView component.
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
    console.log("in useEffect in TaskView");

    async function fetchTasks() {
      const storedTasks = sessionStorage.getItem(TASKS_VIEW);
      if (storedTasks) {
        console.log("View fetched from sessionStorage.");
        setStructure(JSON.parse(storedTasks));
        return;
      }
      try {
        console.log("fetching data...");
        const response = await invoke(TAURI_FETCH_TASKS);
        console.log(response);
        const data = JSON.parse(response);
        console.log(`fetched data: ${JSON.stringify(data)}`);

        // Set sessionStorage.
        sessionStorage.setItem(TASKS_VIEW, response);

        setStructure(data);
      } catch (error) {
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
    console.log("inside add()");
    const storedView = sessionStorage.getItem(TASKS_VIEW);

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

    const parentGroupId = getId(JSON.parse(storedView));
    if (parentGroupId === NOT_FOUND) {
      // show Error in the modal.
      return;
    }
    console.log(`got id: ${parentGroupId}`);

    if (option === TASK) {
      console.log("adding task");
      invoke(TAURI_ADD_TASK, {
        table: TODAY,
        name: name,
        parent_group_id: parentGroupId,
      });
    } else if (option === TASK_GROUP) {
      console.log("adding group");
      invoke(TAURI_ADD_TASKGROUP, {
        table: TODAY,
        name: name,
        parent_group_id: parentGroupId,
      });
    }

    sessionStorage.removeItem(TASKS_VIEW);
    console.log("deleted session storage");
    setModalVisibility(false);

    // CHEAP TRICK. I NEED TO RELOAD THE WEBVIEW TO DISPLAY
    // THE UPDATED TASKS VIEW W THE NEW TASK.
    location.reload();
  };

  function closeModal() {
    setModalVisibility(false);
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
        <AddItemModal itemType={TASK} onAdd={add} onCancel={closeModal} />
      )}
    </>
  );
};

export default TasksView;
