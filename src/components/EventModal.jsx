import { useState } from "react";
import { SheetShell, Button } from "./ui";
import Calendar from "react-calendar";
import "../styles/Calendar.css";
import { useAuth } from "../contexts/AuthContext";
import ImageUpload from "./ImageUpload";
import useEscapeKey from "../hooks/useEscapeKey";
import UnsavedChangesPrompt from "./UnsavedChangesPrompt";

const labelCls =
  "mb-2 ml-3 block font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted [font-stretch:125%]";

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
    <>
      <SheetShell
        title={initialData.title ? "Edit Event" : "Add New Event"}
        labelledById="event-modal-title"
        onClose={requestClose}
        onBackdropClick={handleBackdropClick}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Event Name */}
          <label htmlFor="event-title" className={labelCls}>
            Event Name
          </label>
          <input
            id="event-title"
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            placeholder="Enter event name"
            className="mb-4 block min-h-9 w-full"
            required
          />

          {/* Event Description */}
          <label htmlFor="event-description" className={labelCls}>
            Description
          </label>
          <textarea
            id="event-description"
            name="description"
            value={eventData.description}
            onChange={handleChange}
            placeholder="Enter event description"
            className="mb-4 block min-h-16 w-full"
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
          <label className={labelCls}>Date</label>
          <Calendar
            onChange={handleDateChange}
            value={eventData.date}
            className="mb-4"
            locale="en-US"
            next2Label={null}
            prev2Label={null}
          />

          <label htmlFor="event-time" className={labelCls}>
            Time
          </label>
          <input
            id="event-time"
            required
            type="time"
            name="time"
            value={eventData.time}
            onChange={handleChange}
            className="mb-4 block h-11 w-full rounded-full border-0 bg-surface2 px-4 font-sans text-base text-ink focus:outline-none focus:ring-2 focus:ring-selected"
          />

          {/* Event Location */}
          <label htmlFor="event-location" className={labelCls}>
            Location
          </label>
          <input
            id="event-location"
            required
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleChange}
            placeholder="Enter location"
            className="block min-h-9 w-full"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid || uploading}
            className="mt-6 w-full"
          >
            {uploading
              ? "Uploading..."
              : initialData.title
                ? "Save Changes"
                : "Add Event"}
          </Button>
        </form>
      </SheetShell>
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
    </>
  );
}
