import React from 'react';
import ReactCalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css'; // Import the styles

const CalendarChart = ({ data }) => {
  const generateEmptyDays = (startDate, endDate) => {
    const emptyDays = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 && emptyDays.length > 0) {
        emptyDays.push({ date: current.toISOString().slice(0, 10), count: 0 });
      }
      current.setDate(current.getDate() + 1);
    }

    return emptyDays;
  };

  // Generate empty days between months
  const emptyDays = generateEmptyDays('2023-01-01', '2023-12-31');

  // Combine data with empty days
  const combinedData = [...emptyDays, ...data];

  return (
    <div style={{ minWidth: '500px', margin: 'auto' }}>
      <ReactCalendarHeatmap
        startDate={new Date('2023-01-01')}
        endDate={new Date('2023-10-31')}
        values={combinedData}
        showWeekdayLabels
        showMonthLabels
      />
    </div>
  );
};

export default CalendarChart;
