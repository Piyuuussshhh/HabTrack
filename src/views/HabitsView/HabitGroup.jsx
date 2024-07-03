import React from "react";
import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "bootstrap";

const HabitCard = ({ habitName }) => {
  const [dayType, setDayType] = useState(""); // Initialize state variable

  const handleDayTypeChange = (event) => {
    setDayType(event.target.value); // Update state variable when user selects a new option
  };

  return (
    <div className="habits-card">
      <div className="done-btn-area">
        <button className="done-btn" title="Done">
          <CheckIcon></CheckIcon>
        </button>
      </div>
      <label></label>
      <div className="habit-data">
        <div className="text-container2">
          <label className="habit-name">{habitName}</label>
        </div>
        <div className="day-type">
          <select value={dayType} onChange={handleDayTypeChange}>
            <option value="">Select day type</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            {/* Add more options as needed */}
          </select>
        </div>
      </div>
      <ul className="action-btn">
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
  );
};

export default HabitCard;
