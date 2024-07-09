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


      <div className="radio-input">
        <div className="glass">
          <div className="glass-inner"></div>
        </div>
        <div className="selector">
          <div className="choice">
            <div className="ball1">
              <input
                type="radio"
                id="one"
                name="number-selector"
                value="Tasks"
                defaultChecked={true}
                className="choice-circle"
              />
              <div className="ball"></div>
            </div>
            <label className="choice-name" htmlFor="one">
              Task
            </label>
          </div>
          <div className="choice">
            <div className="ball2">
              <input
                type="radio"
                id="two"
                name="number-selector"
                value="Habits"
                className="choice-circle"
              />
              <div className="ball"></div>
            </div>
            <label className="choice-name">Habits</label>
          </div>
          <div className="choice">
            <div className="ball3">
              <input
                type="radio"
                id="three"
                name="number-selector"
                value="Streaks"
                className="choice-circle"
              />
              <div className="ball"></div>
            </div>
            <label className="choice-name" htmlFor="three">
              Streaks
            </label>
          </div>
        </div>
      </div>


      <div className="help-modal">


      </div>
    </div>
  );
};

export default Help;
