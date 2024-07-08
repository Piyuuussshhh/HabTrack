import React from "react";

const Card = ({ onClose }) => {
  return (
    <div className="prog-screen">

      <div className="close-x-btn">
        <button className="x-btn" onClick={onClose}>
          <span className="X"></span>
          <span className="Y"></span>
        </button>
      </div>

      <div className="prog-card">
        <p><center>Date Month</center></p>
        
      </div>

    </div>
  );
};

export default Card;
