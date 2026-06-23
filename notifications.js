// Marakadhey Notifications Module - ES Module
// Interacts with the chrome.notifications API to display alerts.

import { formatTime12Hour, parseLocalDateTime } from "/storage/storage.js";

function formatNotificationDate(dateStr, timeStr) {
  const dt = parseLocalDateTime(dateStr, timeStr);
  if (isNaN(dt.getTime())) return `${dateStr} at ${formatTime12Hour(timeStr)}`;
  const dateFormatted = dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  return `${dateFormatted} at ${formatTime12Hour(timeStr)}`;
}

export const MarakadheyNotifications = {
  /**
   * Displays a system notification for the given reminder.
   * @param {Object} reminder The reminder object.
   * @param {boolean} isMissed True if this notification is for a missed recurring reminder.
   */
  show: (reminder, isMissed = false) => {
    const notificationId = reminder.id;
    const isRecurring = reminder.recurrence && reminder.recurrence !== "none";

    let title = "Marakadhey Reminder";
    let message = `${reminder.title} is due at ${formatTime12Hour(reminder.reminderTime)}.`;

    if (isRecurring) {
      const displayRecurrence = reminder.recurrence.charAt(0).toUpperCase() + reminder.recurrence.slice(1);
      if (isMissed) {
        title = `🔁 ${displayRecurrence} Reminder (Missed)`;
        const nextDue = formatNotificationDate(reminder.reminderDate, reminder.reminderTime);
        message = `You missed the previous occurrence of "${reminder.title}". Next occurrence scheduled for: ${nextDue}.`;
      } else {
        title = `🔁 ${displayRecurrence} Reminder`;
      }
    }
    
    const options = {
      type: "basic",
      iconUrl: "/assets/icon.png", // Absolute path to updated icon asset from extension root
      title: title,
      message: message,
      contextMessage: reminder.note ? reminder.note.substring(0, 60) : "Don't lose opportunities.",
      buttons: [
        { title: "Open Link" },
        { title: "Snooze 1 Day" }
      ],
      priority: 2, // High priority
      requireInteraction: true // Stays visible until dismissed by user
    };

    try {
      chrome.notifications.create(notificationId, options, (id) => {
        if (chrome.runtime.lastError) {
          console.error("Error creating notification inside callback:", chrome.runtime.lastError.message);
        } else {
          console.log(`Notification shown successfully for ID: ${id}`);
        }
      });
    } catch (err) {
      console.error("Synchronous error creating notification:", err);
    }
  },

  /**
   * Clear an active notification by ID.
   * @param {string} notificationId The notification/reminder ID.
   * @returns {Promise<boolean>} Resolves to true if successfully cleared.
   */
  clear: (notificationId) => {
    return new Promise((resolve) => {
      chrome.notifications.clear(notificationId, resolve);
    });
  }
};

// TODO: Mobile notifications placeholder
// TODO: Email reminders placeholder
// TODO: Telegram reminders placeholder
