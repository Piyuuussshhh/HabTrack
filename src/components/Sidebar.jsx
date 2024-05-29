import React from "react";

const Sidebar = (props) => {
  return (
    <div className="sidebar">
      <ul className="sidebar-list">
        {props.tabs.map((tab) => {
          return (
            <li
              key={tab.name}
              className="row"
              id={tab.name == props.activeTab ? "active" : ""}
              onClick={() => {
                props.toggleTab(tab.name);
              }}
            >
              <div id="icon">{tab.icon}</div>
              <span className="bold tab-title">{tab.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
