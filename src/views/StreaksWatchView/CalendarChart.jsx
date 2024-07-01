import React, { useState } from "react";
import "../../App.css";


const daysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

const getShadeOfBlue = (tasksCompleted, totalTasks) => {
  if (tasksCompleted === 0) {
    return "#fff"; // White for zero tasks
  }
  const maxIntensity = 1; // Max intensity for full opacity
  const minIntensity = 0.1; // Min intensity for almost transparent

  // Calculate the intensity inversely: more tasks -> lighter color
  const intensity =
    minIntensity +
    (tasksCompleted / totalTasks) * (maxIntensity - minIntensity);

  return `rgba(0, 123, 255, ${intensity})`; // Blue shade based on intensity
};

const generateTaskArray = (tasks) => {
  const months = Object.keys(tasks[2023]);
  const result = {};

  months.forEach((month) => {
    const totalDays = daysInMonth(
      new Date(`${month} 1, 2023`).getMonth() + 1,
      2023
    );
    const monthTasks = tasks[2023][month];
    const taskArray = new Array(totalDays).fill([0, 0]);

    monthTasks.forEach((day) => {
      taskArray[day - 1] = [day, monthTasks.length];
    });

    result[month] = taskArray;
  });

  return result;
};

// Example usage:
const tasks = {
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
};

const featuredWeek = {
  Mon: "#12f",
  Tue: "#3fa",
  Wed: "#2ff",
  Thu: "#0f0",
  Fri: "#12f",
  Sat: "#ff1",
  Sun: "#f0f",
};

const App = () => {
  const taskArray = generateTaskArray(tasks);

  return (
    <div className="streaks-area">
      <div className="streaks-container">
        <div className="featured-week">
          <div className="featured-week-title">
          <h2>
            <center>
              <strong>Featured Week</strong>
            </center>
          </h2>
          </div>
          <div className="days">
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
   

      <div className="calendar-chart">
        <h1>Task Master Streak</h1>
        <div className="months-container">
            {Object.keys(tasks[2023]).map((month, index) => (
              <div
                key={month}
                className="month"
              >
                <h2>{month}</h2>
                <div className="days">
                  
                  {taskArray[month].map(
                    ([tasksCompleted, totalTasks], dayIndex) => (
                      <div key={dayIndex + 1} className="day-container">
                        <div
                          className="day"
                          style={{
                            backgroundColor: getShadeOfBlue(
                              tasksCompleted,
                              totalTasks
                            ),
                          }}
                          title={`Completed ${tasksCompleted} / ${totalTasks} tasks on ${month} ${
                            dayIndex + 1
                          }`}
                        ></div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
