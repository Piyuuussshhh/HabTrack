import React, { useState } from "react";

const Help = ({ isHelp, closeHelp }) => {
    if (!isHelp) return null;

  return (
    <div className="help-screen">
      <div className="hekp-close-x-btn" onClick={closeHelp}>
        <button className="help-x-btn">
          <span className="help-X"></span>
          <span className="help-Y"></span>
        </button>
      </div>

      <div className="help-modal">


      </div>
      
      <div className="help-content"></div>
    </div>
  );
};

export default Help;
