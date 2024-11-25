export function formatTime(time) {
  const [hour, minute] = time.split(":");
  const hourInt = parseInt(hour, 10);
  const isPM = hourInt >= 12;
  const formattedHour = hourInt % 12 || 12; // Convert "0" to "12"
  const amPm = isPM ? "PM" : "AM";
  return `${formattedHour}:${minute} ${amPm}`;
}
