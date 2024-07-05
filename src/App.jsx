// Non-UI stuff.
import { useState } from "react";

// External UI Components
import AssignmentIcon from "@mui/icons-material/Assignment";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

// My UI Components
import Sidebar from "./components/Sidebar";
import "./App.css";
import TasksView from "./views/TasksView/TasksView";
import HabitsView from "./views/HabitsView/HabitsView";
import StreaksWatchView from "./views/StreaksWatchView/StreaksWatchView";
import { motion } from "framer-motion";

// Constants.
import { TASKS_VIEW, HABITS_VIEW, STREAKS_VIEW } from "./Constants";

const TABS = [
  { id: "0", name: TASKS_VIEW, icon: <AssignmentIcon /> },
  { id: "1", name: HABITS_VIEW, icon: <DirectionsRunIcon /> },
  { id: "2", name: STREAKS_VIEW, icon: <AutoGraphIcon /> },
];

function App() {
  const [tab, setTab] = useState(TASKS_VIEW);
  const [showSidebar, setSidebar] = useState(true);

  function toggleTab(newTab) {
    setTab(newTab);
  }

  function toggleSidebar() {
    setSidebar(!showSidebar);
  }

  return (
    <>
      <div className="container">
        <button className="sidebar-button" onClick={toggleSidebar}>
          <FormatListBulletedIcon></FormatListBulletedIcon>
        </button>

        {showSidebar && (
          <Sidebar
            tabs={TABS}
            toggleTab={toggleTab}
            activeTab={tab}
            toggleSidebar={toggleSidebar}
          />
        )}
        <div className="main-area">
          {tab === TASKS_VIEW && <TasksView isSidebarOpen={showSidebar}/>}
          {tab === HABITS_VIEW && <HabitsView />}
          {tab === STREAKS_VIEW && <StreaksWatchView />}
        </div>
      </div>
    </>
  );
}

export default App;
