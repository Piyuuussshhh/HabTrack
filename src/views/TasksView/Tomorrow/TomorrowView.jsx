import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

import "../../../App.css";
import {
  TOMORROW,
  ROOT,
  TASK,
  TASK_GROUP,
  TOMORROW_VIEW,
  TAURI_CLOSE_TOMORROW_WINDOW,
  TAURI_FETCH_TASKS_VIEW,
  ACTIVE_TASKS,
  TAURI_ADD_ITEM,
} from "../../../Constants";
import { DragDropProvider, DragDropContext } from "../DragDropContext";
import TaskGroup from "../TaskGroup";
import Modal from "../../../components/Modal";
import { addItem } from "../../../utility/AddRemoveUpdateItems";
import { updateFrontend } from "../../../utility/UpdateFrontend";
import TomorrowNavbar from "./TomorrowNavbar";

const NOT_FOUND = -1;

const TomorrowView = () => {
  const [structure, setStructure] = useState(null);
  const [preselectGroup, setPreselectGroup] = useState(ROOT);
  const [showModal, setModalVisibility] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      const storedView = sessionStorage.getItem(TOMORROW_VIEW);
      if (storedView) {
        setStructure(JSON.parse(storedView));
        return;
      }
      try {
        const response = await invoke(TAURI_FETCH_TASKS_VIEW, {
          table: TOMORROW,
          status: ACTIVE_TASKS,
        });
        const data = JSON.parse(response);

        // Set sessionStorage.
        sessionStorage.setItem(TOMORROW_VIEW, response);

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

  const onChangeTomorrowView = () => {
    setStructure(JSON.parse(sessionStorage.getItem(TOMORROW_VIEW)));
  };

  const seeModal = (name) => {
    setPreselectGroup(name);
    setModalVisibility(true);
  };

  const closeModal = () => {
    setModalVisibility(false);
  };

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

    const storedView = JSON.parse(sessionStorage.getItem(TOMORROW_VIEW));
    const parentGroupId = getId(storedView);
    if (parentGroupId === NOT_FOUND) {
      // show Error in the modal.
      return;
    }

    invoke(TAURI_ADD_ITEM, {
      table: TOMORROW,
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
          TOMORROW_VIEW,
          onChangeTomorrowView,
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

  const onDone = async () => {
    try {
      await invoke(TAURI_CLOSE_TOMORROW_WINDOW);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <div className="box">
        <TomorrowNavbar onAdd={seeModal} onDone={onDone} />
        <div className="task-area">
          <DragDropProvider item={structure} dbTable={TOMORROW}>
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
                    onChangeView={onChangeTomorrowView}
                    preselectGroup={seeModal}
                    dbTable={TOMORROW}
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
          view={TOMORROW_VIEW}
          preselected={preselectGroup}
          onAdd={add}
          onCancel={() => closeModal("AddModal")}
        />
      )}
    </>
  );
};

export default TomorrowView;
