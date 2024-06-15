import React from "react";
import CalendarChart from "./Cal-chart";

const StreaksWatchView = () => {
  const data = [
    { date: "2023-01-01", count: 1 },
    { date: "2023-01-02", count: 2 },
    { date: "2023-01-01", count: 1 },
    { date: "2023-04-02", count: 9 },
  ];

  return (
    <div>
      <h1>GitHub Contributions Graph</h1>
      <CalendarChart data={data} />
    </div>
  );
};

export default StreaksWatchView;
