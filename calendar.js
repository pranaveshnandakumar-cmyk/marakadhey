import { parseLocalDateTime, formatTime12Hour } from "../storage/storage.js";

/**
 * Generates a pre-filled Google Calendar event URL for a reminder.
 * @param {Object} reminder The reminder object.
 * @returns {string} Pre-filled Google Calendar URL.
 */
export function generateGoogleCalendarLink(reminder) {
  const startDt = parseLocalDateTime(reminder.reminderDate, reminder.reminderTime);
  if (isNaN(startDt.getTime())) return "";

  // Event Duration: 5 minutes default (just for notification delivery)
  const endDt = new Date(startDt.getTime() + 5 * 60 * 1000);

  // Truncate title and note parameters to prevent 400 Bad Request URL length crashes
  let cleanTitle = reminder.title || "";
  if (cleanTitle.length > 120) {
    cleanTitle = cleanTitle.substring(0, 120) + "...";
  }

  let cleanNote = reminder.note ? reminder.note.trim() : "";
  if (cleanNote.length > 500) {
    cleanNote = cleanNote.substring(0, 500) + "... (Truncated)";
  }

  // Helper to format Date as YYYYMMDDTHHmmSS in local time
  const formatToGCalString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${y}${m}${d}T${hh}${mm}${ss}`;
  };

  const datesParam = `${formatToGCalString(startDt)}/${formatToGCalString(endDt)}`;
  const capitalizedPriority = reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1);

  // Event Description layout
  let description = "Saved via Marakadhey\n\n";
  description += `Title:\n${cleanTitle}\n\n`;
  description += `Scheduled Time (Local):\n${reminder.reminderDate} at ${formatTime12Hour(reminder.reminderTime)}\n\n`;
  description += `Priority:\n${capitalizedPriority}\n\n`;
  description += `URL:\n${reminder.url}`;
  if (cleanNote !== "") {
    description += `\n\nNotes:\n${cleanNote}`;
  }

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const baseUrl = "https://www.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: cleanTitle,
    dates: datesParam,
    ctz: userTimezone,
    details: description
  });

  return `${baseUrl}?${params.toString()}`;
}

// TODO: Future Enhancement: Open existing reminder in Google Calendar
// TODO: Future Enhancement: Telegram Notifications
// TODO: Future Enhancement: WhatsApp Business Integration
// TODO: Future Enhancement: Web Push Notifications
