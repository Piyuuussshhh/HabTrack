import React from "react";

const AlertModal = ({ alertType, message, onConfirm, onCancel }) => {
  return (
    <div className="modal" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Are you sure?</h2>
        <p>{message}</p>
        <div className="buttons">
          <button
            className="idle-btn"
            style={{ width: 100 }}
            onClick={onCancel}
          >
            <strong>Close</strong>
          </button>
          <button
            className="cancel-btn"
            style={{ width: 100 }}
            onClick={onConfirm}
          >
            <strong>Confirm</strong>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
