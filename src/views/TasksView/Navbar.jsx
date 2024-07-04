import React from "react";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import FastForwardIcon from "@mui/icons-material/FastForward";
import AddIcon from "@mui/icons-material/Add";

// TODO: style this component.

const Navbar = ({ onAdd }) => {
  return (
    <nav className="nav">
      <p className="page-title title" style={{ textAlign: "center" }}>
        Tasks
      </p>
      <ul>
        <li>
          <button class="btn" title="Set Tasks for Tommorow">
            <FastForwardIcon>
              </FastForwardIcon>
          </button>
        </li>
        <li>
          <button className="btn" id="add-btn" onClick={onAdd} title="Add Task">
            <AddIcon fontSize="medium"></AddIcon>
          </button>
        </li>
        <li>
          <button className="btn" title='Check Completed Task'>
            <PlaylistAddCheckIcon fontSize="medium"></PlaylistAddCheckIcon>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
