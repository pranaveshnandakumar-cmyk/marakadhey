// Marakadhey Notifications Module - ES Module
// Interacts with the chrome.notifications API to display alerts.

import { formatTime12Hour } from "../storage/storage.js";

export const MarakadheyNotifications = {
  /**
   * Displays a system notification for the given reminder.
   * @param {Object} reminder The reminder object.
   */
  show: (reminder) => {
    const notificationId = reminder.id;
    
    const options = {
      type: "basic",
      iconUrl: "/assets/icon.png", // Absolute path to updated icon asset from extension root
      title: "Marakadhey Reminder",
      message: `${reminder.title} is due at ${formatTime12Hour(reminder.reminderTime)}.`,
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
