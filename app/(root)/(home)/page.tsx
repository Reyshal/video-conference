"use client";

import MeetingTypeList from "@/components/MeetingTypeList";
import { useGetLatestCall } from "@/hooks/use-get-latest-call";
import React from "react";
import { motion } from "motion/react";

const Home = () => {
  const now = new Date(); // Get current date and time
  const { call: todayCall } = useGetLatestCall(); // Custom hook to fetch the next scheduled call

  // Format current time (e.g. "08:30 PM")
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format current date (e.g. "Monday, January 1, 2025")
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(now);

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      {/* Hero section with background and animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // Start slightly lower and transparent
        animate={{ opacity: 1, y: 0 }} // Fade in and move up
        transition={{ duration: 0.5 }} // Animation duration
        className="h-[300px] w-full rounded-[20px] bg-hero bg-cover" // Styling with background
      >
        <div className="flex h-full flex-col justify-between max-lg:px-5 max-lg:py-8 lg:p-11">
          {/* Show upcoming meeting time if one is scheduled */}
          {todayCall && (
            <h2 className="glassmorphism max-w-[270px] rounded py-2 text-center text-base font-normal">
              Upcoming Meeting at:{" "}
              {todayCall.state.startsAt!.toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </h2>
          )}

          {/* Display current time and date */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time}</h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
          </div>
        </div>
      </motion.div>

      {/* List of meeting types (e.g., quick meeting, scheduled, etc.) */}
      <MeetingTypeList />
    </section>
  );
};

export default Home;
