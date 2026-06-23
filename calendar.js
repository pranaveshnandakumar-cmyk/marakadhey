import { parseLocalDateTime, formatTime12Hour } from "/storage/storage.js";

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

  // Formats Date as YYYYMMDDTHHmmSSZ in strict absolute UTC time
  const formatToGCalUTCString = (date) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
  };

  const datesParam = `${formatToGCalUTCString(startDt)}/${formatToGCalUTCString(endDt)}`;
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

  const baseUrl = "https://www.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: cleanTitle,
    dates: datesParam,
    details: description
  });

  if (reminder.recurrence && reminder.recurrence !== "none") {
    let rrule = "";
    switch (reminder.recurrence) {
      case "daily": 
        rrule = "RRULE:FREQ=DAILY"; 
        break;
      case "weekly": 
        if (reminder.recurrenceSubtype === "weekdays") {
          rrule = "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
        } else if (reminder.recurrenceSubtype === "weekends") {
          rrule = "RRULE:FREQ=WEEKLY;BYDAY=SA,SU";
        } else if (reminder.recurrenceSubtype === "custom" && Array.isArray(reminder.recurrenceDays) && reminder.recurrenceDays.length > 0) {
          const dayMap = { 0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA" };
          const days = reminder.recurrenceDays.map(d => dayMap[d]).filter(Boolean).join(",");
          rrule = `RRULE:FREQ=WEEKLY;BYDAY=${days}`;
        } else {
          rrule = "RRULE:FREQ=WEEKLY";
        }
        break;
      case "monthly": 
        rrule = "RRULE:FREQ=MONTHLY";
        break;
      case "quarterly": 
        rrule = "RRULE:FREQ=MONTHLY;INTERVAL=3"; 
        break;
      case "yearly": 
        rrule = "RRULE:FREQ=YEARLY"; 
        break;
    }
    if (rrule) {
      params.set("recur", rrule);
    }
  }

  return `${baseUrl}?${params.toString()}`;
}
