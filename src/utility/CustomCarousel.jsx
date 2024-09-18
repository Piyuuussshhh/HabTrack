import React, { useState, useEffect } from "react";
import taskgif from "../assets/gifs/task.gif";
import tomgif from "../assets/gifs/tomm.gif";
import compgif from "../assets/gifs/comp.gif";
import groupgif from "../assets/gifs/group.gif";
import nestedgif from "../assets/gifs/nested.gif";
import workgif from "../assets/gifs/work-work-in-progress.gif";
import feedgif from "../assets/gifs/tenor.gif"

const Carousel = React.forwardRef((props, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([
    { id: 1, title: "Welcome to HabTrack" },
    {
      id: 2,
      image: taskgif,
      title: "Tasks",
      content:
        "Tasks are any real life activity that you do or plan to do. What are tasks? You can define them, because they can be anything that you want.\nSince tasks are a part of your TO-DO list, we expect that you are planning to do them! At least we hope, you will do them.\nYou can create a task.\nYou can edit them, we will let you get away with those typos.\nIf you ever feel like slacking off, you can delete them! We prefer you complete them though.\nFeel like you have a long day tommorow? You can even set tasks for tommorow! We will talk about this a bit later. ",
    },
    {
      id: 3,
      image: compgif,
      title: "Completed Tasks",
      content:
        "No better joy in life than completing a long-awaited task.\nAlso no bigger satisfaction than seeing a list of tasks that you have conquered (um, I mean completed).\nThat's why we present to you, your trophy cabinet for the day, a list of completed tasks.\nComes near and whispers 'You can flex this' Nods with agreement.\nMarked a task completed by mistake? Don't worry, we gotchu.\nYou can undo a task in completed list, because who doesn't make mistakes. ",
    },
    {
      id: 4,
      image: groupgif,
      title: "Groups",
      content: "Have a series of tasks related to each to other? You can group them together!\nIntroducing groups, so that your tasks are more organized!\nThis gives you a better idea about what to do and in which area.\nYou can add more groups, edit them and delete them as well.\nYou also have a side menu to directly add tasks to the group! Saving you a few extra clicks.\nPS: The default group is called 'root' and is denoted by /.",
    },
    {
      id: 5,
      image: nestedgif,
      title: "Nested Groups",
      content: "Feel like groups aren't enough to satisfy the organized freak in you? Don't worry, we got you covered.\nYou can create a group inside a group, which is inside a group, which is again inside a group and so on...\nCreate as many nested groups that you want.\nCaution note: Since you can delete groups, if the groups do contain tasks, you will delete the task as well!",
    },
    {
      id: 6,
      image: tomgif,
      title: "Tommorow",
      content: "We also know about the planning freaks out there, so we covered them as well. W developers, right?\nYou can set tasks for tomorrow.\nYou can create groups and then tasks inside of them. Why? Well, because the other collaborator is a planning and organizing freak.\nThe tasks you set in Tomorrow will be added to task list along with your existing tasks and groups. This will happen at midnight. We hope that there is an empty task list before midnight! (PS: You can always delete them)",
    },
    {
      id: 7,
      image: workgif,
      title: "Habits",
      content: "Habits is yet our most unique feature. We call this a productivity tracker tool and we mean it. \nThere are some tasks that needs to be done daily. Now, why add them daily in tasks?? We got habits for them.\nHabits aren't really only tasks than can be done daily, they are tasks which you can track with utmost precision.\nLet's take an example: Going to the gym.\nPeople go to the gym daily. You can track that you have been going to the gym daily. Now in gym, people tend to have different exercise days, like: back-day, legs-day, arms-day, etc. With habits you can track even these days. ",
    },

    {
      id: 8,
      image: workgif,
      title: "Habits Cont'd",
      content: "\nSo going to the gym is a habit and back-day, legs-day are a part of it, so we enable you to track on what date and time, which day you had! Essentially tracking your habits for eternity.\nWe can also help you learn a habit. We will help you maintain the 21 days streak :). "
    },
    {
      id: 9,
      image: workgif,
      title: "Streaks Watch",
      content: " We plan to convert you into a productivity freak, just like us.\nStreaks are year round tracking of tasks and habits which you have done and not done. \nDark blue squares indicates lesser tasks done and the brighter the blue, the more tasks have been done. White indicates 0 tasks done. \nYou can literally see the days which you have been slacking off and also how often you have been slacking off.\nThis will consist of two charts, one task master streak and the other habits streak.",
    },

    {
      id:10,
      image: workgif,
      title: "Streaks Watch Cont'd",
      content: "\nTask master streak will be tracking your productivity based on, if you are completing your TO-DOs. \nFor habits streak, each habit will get a different chart. Different colours will indicate different days in habits. \nYou would also see and ongoing streak(basically a number) and the highest streak(another number)."
    },
    {
      id: 11,
      image: feedgif,
      title: "Feedback and Contribute",
      content: "Feel like you are more of a productivity freak and do a better job?:\nhttps://github.com/Piyuuussshhh/HabTrack.git\nFill this feedback form:https://forms.gle/vJoGNz8T8vxtZp4b8 \nGive us feedback, ideas, special requests. We are happy to oblige :) \n\tUpdate our Readme: https://github.com/Piyuuussshhh/HabTrack/tree/main",
    },
  ]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slides]);

  const handlePrev = () => {
    setCurrentIndex((currentIndex - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1 + slides.length) % slides.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (ref) {
    ref.current = {
      handlePrev,
      handleNext,
      slides,
      currentIndex,
      handleDotClick,
    };
  }

  return (
    <div className="carousel">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`carousel-slide ${index === 0 ? "welcome-slide" : ""} ${
            index === currentIndex ? "active" : ""
          }`}
        >
          {slide.title && <h2>{slide.title}</h2>}
          {slide.image && <img src={slide.image} alt={slide.title} />}
          {slide.content && (
            <div className="help-screen-content">
              {slide.content.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default Carousel;