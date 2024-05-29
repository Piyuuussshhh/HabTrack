// Non-UI stuff.
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

// External UI Components
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
// I have no idea how CSS frameworks like bootstrap or tailwind work.
import NavDropdown from "react-bootstrap/NavDropdown";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

// My UI Components
import Sidebar from "./components/Sidebar";
import "./App.css";
import TasksView from "./views/TasksView/TasksView";
import HabitsView from "./views/HabitsView/HabitsView";
import StreaksWatchView from "./views/StreaksWatchView/StreaksWatchView";

const TABS = [
  { id: "0", name: "Tasks", icon: <AssignmentIcon /> },
  { id: "1", name: "Habits", icon: <DirectionsRunIcon /> },
  { id: "2", name: "StreaksWatch", icon: <AutoGraphIcon /> },
];

function App() {
  const [tab, setTab] = useState("Tasks");
  const [showSidebar, setSidebar] = useState(true);

  function toggleTab(newTab) {
    setTab(newTab);
  }

  return (
    <>
      <div className="container">
        <button
          type="button"
          className="toggle-sidebar-btn"
          onClick={() => setSidebar(!showSidebar)}
        >{<FormatListBulletedIcon />}</button>
        {showSidebar && (
          <Sidebar tabs={TABS} toggleTab={toggleTab} activeTab={tab} />
        )}
        <div className="main-area">
          {tab === "Tasks" && <TasksView />}
          {tab === "Habits" && <HabitsView />}
          {tab === "StreaksWatch" && <StreaksWatchView />}
        </div>
      </div>
    </>
  );
}

export default App;
