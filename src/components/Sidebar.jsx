import React from "react";

/*
  In props, I pass:
    -> the names of all the tabs in an array {tabs}
    -> the active tab that the user is currently viewing {activeTab}
    -> the function to change the active tab {toggleTab}
*/
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
              <span className="tab-title">{tab.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
