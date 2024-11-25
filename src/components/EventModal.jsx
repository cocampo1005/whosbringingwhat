import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import Calendar from "react-calendar";
import "../styles/Calendar.css";
import { useAuth } from "../contexts/AuthContext";

export default function EventModal({ closeModal, onSubmit, initialData = {} }) {
  const { currentUser } = useAuth();

  const [eventData, setEventData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    date: initialData.date || null,
    time: initialData.time || "",
    location: initialData.location || "",
    createdBy: initialData.createdBy || currentUser.name,
  });

  // Format the selected date to "Month Day, Year"
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Check if the date is already formatted (as a string)
  const isFormattedDate = (date) => {
    // Adjust the regex to match your formatted date structure
    const formattedDateRegex = /^[a-zA-Z]{3},?\s[a-zA-Z]+\s\d{1,2},\s\d{4}$/;
    return typeof date === "string" && formattedDateRegex.test(date);
  };

  // Handle calendar date selection
  const handleDateChange = (selectedDate) => {
    setEventData((prev) => ({ ...prev, date: selectedDate }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedData = {
      ...eventData,
      date: isFormattedDate(eventData.date)
        ? eventData.date // Use the date as-is if already formatted
        : formatDate(eventData.date), // Format if it's not already formatted
    };

    if (!eventData.date) {
      alert("Please select a date for the event.");
      return;
    }
    onSubmit(formattedData);
    closeModal();
  };

  return (
    <div className="fixed left-0 top-0 z-10 flex h-full w-full flex-grow flex-col overflow-scroll bg-yellow-50 p-4">
      <div className="flex justify-center">
        <h2 className="text-lg font-semibold">
          {initialData.title ? "Edit Event" : "Add New Event"}
        </h2>
        <IoClose
          className="absolute right-4 top-4 cursor-pointer text-3xl"
          onClick={closeModal}
        />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col">
        {/* Event Name */}
        <label className="mb-2 block text-sm">Event Name</label>
        <input
          type="text"
          name="title"
          value={eventData.title}
          onChange={handleChange}
          placeholder="Enter event name"
          className="mb-4 min-h-9"
          required
        />

        {/* Event Description */}
        <label className="mb-2 block text-sm">Description</label>
        <textarea
          name="description"
          value={eventData.description}
          onChange={handleChange}
          placeholder="Enter event description"
          className="mb-4 block min-h-16 w-full rounded-md border-0 py-1.5 shadow-sm"
        />

        {/* Event Date */}
        <label className="mb-2 block text-sm">Date</label>
        <Calendar
          onChange={handleDateChange}
          value={eventData.date}
          className="mb-4"
          locale="en-US"
          next2Label={null}
          prev2Label={null}
        />

        <label className="block text-sm/6 font-medium text-primaryDark">
          Time
        </label>
        <input
          required
          type="time"
          name="time"
          value={eventData.time}
          onChange={handleChange}
          className="mb-4 block min-h-9 w-full rounded-md border-0 py-1.5 text-primaryDark shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-primaryRed"
        />

        {/* Event Location */}
        <label className="mb-2 block text-sm">Location</label>
        <input
          required
          type="text"
          name="location"
          value={eventData.location}
          onChange={handleChange}
          placeholder="Enter location"
          className="min-h-9"
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-primaryRed py-2 text-center text-white"
        >
          {initialData.title ? "Save Changes" : "Add Event"}
        </button>
      </form>
    </div>
  );
}
