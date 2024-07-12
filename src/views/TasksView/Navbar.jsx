import React from "react";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import FastForwardIcon from "@mui/icons-material/FastForward";
import AddIcon from "@mui/icons-material/Add";
import { Download } from "@mui/icons-material";
import { invoke } from "@tauri-apps/api";
import { ROOT, TAURI_OPEN_TOMORROW_WINDOW } from "../../Constants";

// TODO: style this component.

const Navbar = ({ isSidebarOpen, onExport, onAdd, toggleCompleted }) => {
  const seeTomorrow = async () => {
    try {
      await invoke(TAURI_OPEN_TOMORROW_WINDOW);
      console.log('Tomorrow window opened');
    } catch (error) {
      console.error('Error opening tomorrow window:', error);
    }
  };

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
          <button className="btn" title="Export to PDF" onClick={onExport}>
            <Download />
          </button>
        </li>
        <li>
          <button className="btn" title="Set Tasks for Tomorrow" onClick={seeTomorrow}>
            <FastForwardIcon />
          </button>
        </li>
        <li>
          <button className="nav-add-btn" onClick={() => onAdd(ROOT)} title="Add Task">
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
