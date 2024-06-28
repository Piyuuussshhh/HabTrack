import React from "react";
import { TASK_GROUP } from "../Constants";

const AlertModal = ({ alertType, x, y, onConfirm, OnCancel }) => {
  function getMessage() {
    if (alertType === TASK_GROUP) {
      return (
        <p>Deleting a group will delete all its sub-tasks and sub-groups</p>
      );
    }
  }
  const message = getMessage();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <h2>Are you sure?</h2>
          {message}
          <button className="alert-btn idle-btn" onClick={onClose}>Close</button>
          <button className="cancel-btn" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
