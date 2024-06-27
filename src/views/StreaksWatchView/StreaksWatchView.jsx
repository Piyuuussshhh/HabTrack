import React from "react";
// import CalendarChart from "./Cal-chart";
import Navbar from "./Navbar2";
import CalendarChart from "./custom-cal-chart";

const StreaksWatchView = () => {
  return (
    <div>
      <Navbar />
      <div>
        <CalendarChart />
      </div>
    </div>
  );
};

export default StreaksWatchView;
