import React, { useState } from "react";

const Help = ({ isHelp, closeHelp }) => {
    if (!isHelp) return null;

  return (
    <div className="help-screen">
      <div className="close-x-btn" onClick={closeHelp}>
        <button className="x-btn">
          <span className="X"></span>
          <span className="Y"></span>
        </button>
      </div>
      
      <div className="help-content"></div>
    </div>
  );
};

export default Help;
