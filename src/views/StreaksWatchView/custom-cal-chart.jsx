import React, { useState } from "react";
import "../../App.css";

// TODO: 1)Identify and generate days according to the month, rn every
// month has 31 days.
// 2)Also we are going to need shades of the color green
// to indicate the no of tasks done, rn its just green(done) or white(not done)

const CalendarChart = () => {
  const [tasks, setTasks] = useState({
    2023: {
      Jan: [1, 3, 5, 7, 10, 12, 15, 18, 20, 22, 25, 28],
      Feb: [2, 4, 6, 8, 11, 13, 16, 19, 21, 23, 26],
      Mar: [1, 3, 5, 7, 9, 12, 14, 16, 18, 20, 22, 25, 27, 29, 31],
      Apr: [1, 3, 5, 7, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      May: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31],
      Jun: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 30],
      Jul: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31],
      Aug: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31],
      Sept: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 30],
      Oct: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31],
      Nov: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 30],
      Dec: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31],
    },
  });

  const featuredWeek = {
    Mon: "#12f",
    Tue: "#3fa",
    Wed: "#2ff",
    Thu: "#0f0",
    Fri: "#12f",
    Sat: "#ff1",
    Sun: "#f0f",
  };

  return (
    // We have an empty div, because the jsx starts crying that we need a parent div
    <div>
      {/* This is the div with the featured week */}
      <div className="featured-week">
        <h2>
          <center>
            <strong>Featured Week</strong>
          </center>
        </h2>
        <div className="days">
          {/* We are passing a for loop with the featuredWeek array then coloring.
            I am passing color with the day itself to have multiple colors for multiple days.
            This is probably going to be a pain when integrating with database, as we will need
            to store the color for a particular task as well. RIP Piyush*/}

          {Object.keys(featuredWeek).map((day, index) => (
            <div key={index} className="featured-day-container">
              <div
                className="featured-day"
                style={{ backgroundColor: featuredWeek[day] }}
              ></div>
              <div className="featured-day-number">{day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* This is for the actual calender chart */}

      <div className="calendar-chart">
        {/* We have a 2D array above and we are generating months according to well the month names*/}
        {Object.keys(tasks[2023]).map((month) => (
          <div key={month} className="month">
            <h2>{month}</h2>

            <div className="days">
              {/* We are running a for loop from 1 to 31 and creating an instance of day in every iteration.
                Also, if in the above array the date occurs, then we mark it as done else not done*/}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <div key={day} className="day-container">
                  <div
                    className={`day ${
                      tasks[2023][month].includes(day) ? "done" : "not-done"
                    }`}
                  ></div>
                  {/* Needed this because the numbers kept getting inside the square */}
                  <div className="day-number">{day}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarChart;
