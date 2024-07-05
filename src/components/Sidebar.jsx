import React, { useState } from "react";
import { motion } from "framer-motion";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

const Sidebar = (props) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  const toggleSidebarVisibility = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsVisible(!isVisible);
      setIsSpinning(false);
    }, 200);

    // props.toggleSidebar();
  };

  return (
    <>
      <div className="sidebar">
        <ul className="sidebar-list">
          {props.tabs.map((tab) => {
            return (
              <li
                key={tab.name}
                className="row"
                id={tab.name === props.activeTab ? "active" : ""}
                onClick={() => {
                  props.toggleTab(tab.name);
                }}
              >
                <div id="icon">{tab.icon}</div>
                <span className="tab-title">{tab.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
