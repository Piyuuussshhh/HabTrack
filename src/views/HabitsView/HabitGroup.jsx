import React from "react";
import { useState } from 'react';
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const HabitCard = ({ habitName }) => {
  const [dayType, setDayType] = useState(""); // Initialize state variable

  const handleDayTypeChange = (event) => {
    setDayType(event.target.value); // Update state variable when user selects a new option
  };

  return (
    <div className="habits-card">
      <input type="checkbox" />
      <label></label>
      <div className="text-container2">
        <label className="task-name">{habitName}</label>
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
  );
};

export default HabitCard;