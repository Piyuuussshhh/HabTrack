import React from "react";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import FastForwardIcon from "@mui/icons-material/FastForward";
import AddIcon from "@mui/icons-material/Add";

// TODO: style this component.

const Navbar = ({ isSidebarOpen, onAdd, toggleCompleted }) => {
  return (
    <nav className="nav">
      <p
        className={
          isSidebarOpen
            ? "page-title-sidebar-open title"
            : "page-title-sidebar-closed title"
        }
      >
        Tasks
      </p>
      <ul>
        <li>
          <button className="btn" title="Set Tasks for Tomorrow">
            <FastForwardIcon />
          </button>
        </li>
        <li>
          <button className="nav-add-btn" onClick={() => onAdd("")} title="Add Task">
            <AddIcon fontSize="medium"></AddIcon>
          </button>
        </li>
        <li>
          <button
            className="btn"
            onClick={toggleCompleted}
            title="Check Completed Task"
          >
            <PlaylistAddCheckIcon fontSize="medium"></PlaylistAddCheckIcon>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
