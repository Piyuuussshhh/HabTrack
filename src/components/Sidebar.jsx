import React, { useState } from "react";
import { motion } from "framer-motion";

const Sidebar = (props) => {
  const [isVisible, setIsVisible] = useState(true);

  const toggleSidebarVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      <motion.div
        className="sidebar"
        initial={{ x: "-100%" }}
        animate={{ x: isVisible ? 0 : "-100%" }}
        transition={{ duration: 0.3 }}
      >
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
      </motion.div>
    
    </>
  );
};

export default Sidebar;
