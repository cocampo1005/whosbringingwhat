import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import Calendar from "react-calendar";
import "../styles/Calendar.css";
import { useAuth } from "../contexts/AuthContext";

export default function EventModal({ closeModal, onSubmit, initialData = {} }) {
  const { currentUser } = useAuth();

  const initialHostId =
    initialData.hostId || initialData.createdById || currentUser?.uid || null;

  const initialMembers =
    initialData.members || (initialHostId ? [initialHostId] : []);

  const [eventData, setEventData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    date: initialData.date || null,
    items: initialData.items || [],
    time: initialData.time || "",
    location: initialData.location || "",
    createdBy: initialData.createdBy || currentUser.name,
    createdById: initialData.createdById || currentUser?.uid || null,
    hostId: initialHostId,
    members: initialMembers,
  });

  const [modalHeight, setModalHeight] = useState("100vh");

  useEffect(() => {
    const updateModalHeight = () => {
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      setModalHeight(`${viewportHeight - 32}px`);
    };

    // Set initial height
    updateModalHeight();

    // Update height on resize
    window.addEventListener("resize", updateModalHeight);

    return () => {
      window.removeEventListener("resize", updateModalHeight);
    };
  }, []);

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
        ? eventData.date
        : formatDate(eventData.date),
    };

    if (!eventData.date) {
      alert("Please select a date for the event.");
      return;
    }
    onSubmit(formattedData);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div
        className="relative ml-8 mr-8 flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-yellow-50 p-0 shadow-lg md:ml-[236px]"
        style={{ maxHeight: modalHeight }}
      >
        <div className="flex w-full items-center justify-center rounded-t-2xl bg-primaryRed px-4 py-2 relative">
          <h2 className="text-center text-lg font-semibold text-white">
            {initialData.title ? "Edit Event" : "Add New Event"}
          </h2>
          <IoClose
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-3xl text-white"
            onClick={closeModal}
          />
        </div>
        <div className="flex-1 px-4 pb-4 pt-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col">
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
            className="mb-4 block min-h-16 w-full rounded-lg border-gray-300 py-1.5 shadow-sm focus:border-primaryRed focus:ring-0"
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

          <label className="block text-sm/6 text-primaryDark">Time</label>
          <input
            required
            type="time"
            name="time"
            value={eventData.time}
            onChange={handleChange}
            className="mb-4 block min-h-9 w-full rounded-lg border-0 py-1.5 text-primaryDark shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-primaryRed"
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
            className="mt-4 w-full rounded-lg bg-primaryRed py-2 text-center text-white"
          >
            {initialData.title ? "Save Changes" : "Add Event"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
