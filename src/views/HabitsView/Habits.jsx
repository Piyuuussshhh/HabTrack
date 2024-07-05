import React from "react";
import "../../App.css";
import HabitCard from "./HabitGroup"; 

const Habits = () => {
  const habits = [
    { name: "This is a really long habit so that I can see if it works properly or not" },
    { name: "Habit 2" },
    { name: "Habit 3"}
  ];

  return (
    <div className="habits-area">
      <div className="habits-container">
        {habits.map((habit, index) => (
          <HabitCard key={index} habitName={habit.name} />
        ))}
      </div>
    </div>
  );
};

export default Habits;
