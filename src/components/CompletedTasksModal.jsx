import React, { useEffect, useState } from "react";
import { X } from "@mui/icons-material";

const CompletedTasksModal = ({ onCancel }) => {
  const [completedStructure, setCompletedStructure] = useState(null);

  useEffect(() => {
    const fetchCompletedView = () => {

    }

    fetchCompletedView();
  }, []);

  return (
    <div className="completed-modal-overlay" onClick={onCancel}>
      <button type="button" onClick={onCancel}>
        <X />
      </button>
      <div className="completed-modal">
        <h2>Completed Tasks</h2>
        <ul>
          {completedStructure ? <></>: <p>loading...</p>}
        </ul>
      </div>
    </div>
  );
};

export default CompletedTasksModal;
