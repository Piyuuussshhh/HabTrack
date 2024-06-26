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
      <motion.div
        className="sidebar"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isVisible ? 1 : 0,
          opacity: isVisible ? 1 : 0,
          transition: {
            duration: 0.2,
            ease: "easeInOut",
          },
        }}
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
