import React, { useState } from "react";
import { motion } from "framer-motion";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

const Sidebar = (props) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  const toggleSidebarVisibility = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setIsVisible(!isVisible);
      setIsSpinning(false);
    }, 200);
  };

  return (
    <>
      <motion.div
        className="sidebar"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isVisible? 1 : 0,
          opacity: isVisible? 1 : 0,
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
                id={tab.name === props.activeTab? "active" : ""}
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
      <motion.button
        className="sidebar-button"
        initial={{ rotate: 0 }}
        animate={{
          rotate: isSpinning? 180 : 0,
          transition: {
            duration: 0.2,
            ease: "easeInOut",
          },
        }}
        onClick={toggleSidebarVisibility}
      >
        {isVisible? <FormatListBulletedIcon></FormatListBulletedIcon> : <FormatListBulletedIcon></FormatListBulletedIcon>}
      </motion.button>
      <style>
        {`
    .sidebar {
            position: fixed;
            top: 0;
            height: 100vh;
            width: 220px;
            background-color: #333;
            color: #fff;
            padding: 20px;
            transform-origin: left;
          }
    .sidebar-button {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateY(-50%);
            background: #3576bb;
            color: white;
            border: none;
            padding: 9px;
            font-size: 1.05rem;
            cursor: pointer;
            border-radius: 5px;
          }
    .sidebar-button:hover {
            filter: brightness(120%);
            box-shadow: 10px 10px 10px #000;
          }

    .sidebar-button:hover::after{
            content: attr('Sidebar');
            }
        `}
      </style>
    </>
  );
};

export default Sidebar;