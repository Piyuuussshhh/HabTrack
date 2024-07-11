import React, { useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const PrevArrow = ({ onClick }) => (
  <div className="custom-arrow custom-prev" onClick={onClick}>
    <span style={{ color: "white", fontSize: "20px" }}><ArrowBackIosIcon></ArrowBackIosIcon></span>
  </div>
);

const NextArrow = ({ onClick }) => (
  <div className="custom-arrow custom-next" onClick={onClick}>
    <span style={{ color: "white", fontSize: "20px" }}><ArrowForwardIosIcon></ArrowForwardIosIcon></span>
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
    {
      content: "Welcome to Habtrack",
      welcome: true,
    },
    {
      title: "Title 1",
      content: "This is the first slide content",
      // img: "path/to/your/image1.gif",
    },
    {
      title: "Title 2",
      content: "This is the second slide content",
      // img: "path/to/your/image2.gif",
    },
    {
      title: "Title 3",
      content: "This is the third slide content",
      // img: "path/to/your/image3.gif",
    },
    {
      title: "Title 4",
      content: "This is the fourth slide content",
      // img: "path/to/your/image4.gif",
    },
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
            <div
              key={index}
              className={`${slide.welcome ? 'welcome-slide' : 'slide'}`}
            >
              <div>
                <h1>{slide.title}</h1>
                <p>{slide.content}</p>
              </div>
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
