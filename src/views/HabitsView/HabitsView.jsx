import React from "react";
import Navbar from "./Navbar3";
import Habits from "./Habits";

// TODO wtf is HabitsGroup? uh... update the frontend of TasksView if tasks are created for habits.

const HabitsView = () => {
  return (
    <div className="box">
      <Navbar />

      <Habits />
    </div>
  );
};

export default HabitsView;
