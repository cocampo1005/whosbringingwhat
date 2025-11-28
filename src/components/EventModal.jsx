import { useState } from "react";
import { IoClose } from "react-icons/io5";
import Calendar from "react-calendar";
import "../styles/Calendar.css";
import { useAuth } from "../contexts/AuthContext";
import ImageUpload from "./ImageUpload";
import useEscapeKey from "../hooks/useEscapeKey";
import UnsavedChangesPrompt from "./UnsavedChangesPrompt";

export default function EventModal({ closeModal, onSubmit, initialData = {} }) {
  const { currentUser } = useAuth();

  const initialHostId =
    initialData.hostId || initialData.createdById || currentUser?.uid || null;

  const initialMembers =
    initialData.members || (initialHostId ? [initialHostId] : []);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    // Handle ISO string or Legacy format
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  };

  const [eventData, setEventData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    date: parseDate(initialData.date),
    items: initialData.items || [],
    time: initialData.time || "",
    location: initialData.location || "",
    createdBy: initialData.createdBy || currentUser.name,
    createdById: initialData.createdById || currentUser?.uid || null,
    hostId: initialHostId,
    members: initialMembers,
    imageUrl: initialData.imageUrl || "",
    bannerColor: initialData.bannerColor || "",
  });

  const [hasInteracted, setHasInteracted] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isFormValid =
    eventData.title.trim() !== "" &&
    !!eventData.date &&
    eventData.time.trim() !== "" &&
    eventData.location.trim() !== "";

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
    setHasInteracted(true);
    setEventData((prev) => ({ ...prev, date: selectedDate }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setHasInteracted(true);
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Helper to format date as YYYY-MM-DD
    const toISODateString = (date) => {
      if (!date) return null;
      // If it's already a string, check if it's ISO or formatted
      if (typeof date === "string") {
        // If it matches YYYY-MM-DD, return it
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // If it's the old format "Fri, Oct 27, 2023", try to parse it
        const parsed = new Date(date);
        if (!isNaN(parsed)) {
          const offset = parsed.getTimezoneOffset();
          const adjusted = new Date(parsed.getTime() - offset * 60 * 1000);
          return adjusted.toISOString().split("T")[0];
        }
        return date; // Fallback
      }
      // It's a Date object
      const offset = date.getTimezoneOffset();
      const adjusted = new Date(date.getTime() - offset * 60 * 1000);
      return adjusted.toISOString().split("T")[0];
    };

    const formattedData = {
      ...eventData,
      date: toISODateString(eventData.date),
    };

    if (!eventData.date) {
      alert("Please select a date for the event.");
      return;
    }
    onSubmit(formattedData);
    closeModal();
  };

  const requestClose = () => {
    if (hasInteracted) {
      setShowUnsavedPrompt(true);
    } else {
      closeModal();
    }
  };

  useEscapeKey(
    () => {
      if (showUnsavedPrompt) {
        setShowUnsavedPrompt(false);
        return;
      }
      requestClose();
    },
    true,
  );

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    requestClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-center md:justify-end bg-gray-500 bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="relative flex h-full w-full max-w-full md:max-w-md flex-col overflow-hidden bg-yellow-50 shadow-lg">
        <div className="flex items-center justify-center bg-primaryRed px-4 py-3">
          <h2 className="text-center text-lg font-semibold text-white">
            {initialData.title ? "Edit Event" : "Add New Event"}
          </h2>
          <IoClose
            className="absolute right-4 top-3 cursor-pointer text-2xl text-white"
            onClick={requestClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
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

          {/* Event Photo */}
          <div className="mb-4">
            <ImageUpload
              label="Add Event Photo"
              imageUrl={eventData.imageUrl}
              onImageChange={(url) => {
                setHasInteracted(true);
                setEventData((prev) => ({ ...prev, imageUrl: url }));
              }}
              storageFolder="event-images"
              objectId={initialData.id || eventData.createdById || currentUser?.uid || "event"}
              imageAlt="Event photo preview"
              onUploadingChange={setUploading}
              inputId="event-image-upload"
            />
          </div>

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
            disabled={!isFormValid || uploading}
            className={`mt-4 w-full rounded-lg py-2 text-center text-sm font-semibold text-white ${
              !isFormValid || uploading
                ? "cursor-not-allowed bg-red-300"
                : "bg-primaryRed hover:bg-secondaryRed"
            }`}
          >
            {uploading
              ? "Uploading..."
              : initialData.title
                ? "Save Changes"
                : "Add Event"}
          </button>
        </form>
        </div>
      </div>
      <UnsavedChangesPrompt
        isOpen={showUnsavedPrompt}
        title="Discard changes?"
        description="You have unsaved changes for this event. Are you sure you want to close without saving?"
        onCancel={() => setShowUnsavedPrompt(false)}
        onConfirm={() => {
          setShowUnsavedPrompt(false);
          closeModal();
        }}
      />
    </div>
  );
}
