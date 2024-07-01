import React from "react";
import "../../App.css";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const Habits = () => {
  return (
    <div className="habits-area">
      <div className="habits-container">
        <div className="habits-card">

          <input type="checkbox" />
          <label></label>
          <div className="text-container2">
            <label className="task-name">Habit 1</label>
            </div>
            <div className="day-type">
                <p>DAY TYPE</p>
            </div>
          <ul>
            <li>
              <button className="task-btn">
                <EditIcon />
              </button>
            </li>
            <li>
              <button className="delete-icon">
                <DeleteIcon />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Habits;
