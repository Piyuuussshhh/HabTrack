import React, { useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const PrevArrow = ({ onClick }) => (
  <div className="custom-arrow custom-prev" onClick={onClick}>
    <span style={{ color: "white", fontSize: "20px" }}>{"<"}</span>
  </div>
);

const NextArrow = ({ onClick }) => (
  <div className="custom-arrow custom-next" onClick={onClick}>
    <span style={{ color: "white", fontSize: "20px" }}>{">"}</span>
  </div>
);

const Help = ({ isHelp, closeHelp }) => {
  const sliderRef = useRef(null);

  if (!isHelp) return null;

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, // Hide default arrows
  };

  const slides = [
    "Slide 1 content",
    "Slide 2 content",
    "Slide 3 content",
    "Slide 4 content",
  ];

  return (
    <div className="help-screen">
      <div className="help-close-x-btn" onClick={closeHelp}>
        <button className="help-x-btn">
          <span className="help-X"></span>
          <span className="help-Y"></span>
        </button>
      </div>

      <div className="help-modal">
        <Slider ref={sliderRef} {...settings}>
          {slides.map((slide, index) => (
            <div key={index} className="slide">
              {slide}
            </div>
          ))}
        </Slider>
        <PrevArrow onClick={() => sliderRef.current.slickPrev()} />
        <NextArrow onClick={() => sliderRef.current.slickNext()} />
      </div>
    </div>
  );
};

export default Help;
