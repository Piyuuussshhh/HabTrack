import React from "react";
import AddIcon from "@mui/icons-material/Add";
import BeenhereIcon from '@mui/icons-material/Beenhere';
import { ROOT } from "../../../Constants";

const TomorrowNavbar = ({ onAdd, onDone}) => {
  return (
    <nav className="nav">
      <p className={"page-title-sidebar-closed title"}>Tomorrow's Tasks</p>
      <ul>
        <li>
          <button
            className="nav-add-btn"
            onClick={() => onAdd(ROOT)}
            title="Add Task"
          >
            <AddIcon fontSize="medium"></AddIcon>
          </button>
        </li>
        <li>
          <button
            className="btn"
            onClick={onDone}
            title="Save"
          >
            <BeenhereIcon />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default TomorrowNavbar;
