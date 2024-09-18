import React, { useRef } from "react";
import Carousel from "./CustomCarousel";

const Help = ({ isHelp, closeHelp}) => {
  const sliderRef = useRef(null);

  if (!isHelp) return null;

  return (
    <div className="help-screen">
      <button className="help-x-btn" onClick={closeHelp}>
        <span className="help-X"></span>
        <span className="help-Y"></span>
      </button>

      <div className="carousel-controls">
        <button className="carousel-prev" onClick={() => sliderRef.current && sliderRef.current.handlePrev()}>&#10094;</button>
        <button className="carousel-next" onClick={() => sliderRef.current && sliderRef.current.handleNext()}>&#10095;</button>
        <div className="carousel-indicators">
          {sliderRef.current && Array.from(Array(sliderRef.current.slides.length).keys()).map((index) => (
            <button
              key={index}
              className={sliderRef.current.currentIndex === index ? "active" : ""}
              onClick={() => sliderRef.current.handleDotClick(index)}
            >
              &#8226;
            </button>
          ))}
        </div>
      </div>

      <div className="help-modal">
        <Carousel ref={sliderRef}/>
      </div>
    </div>
  );
};

export default Help;