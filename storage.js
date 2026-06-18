// Marakadhey Storage Module - ES Module
// Manages reminder records in chrome.storage.local and updates Chrome alarms accordingly.

export const APP_VERSION = "1.0";

// Naming helper for alarms
export function getAlarmName(id) {
  return `alarm-reminder-${id}`;
}

/**
 * Formats a 24-hour time string (HH:MM) into a 12-hour format with AM/PM (e.g., 14:30 -> 2:30 PM).
 * @param {string} timeString The 24-hour time string.
 * @returns {string} The formatted 12-hour time string.
 */
export function formatTime12Hour(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  
  if (isNaN(hours)) return timeString;
  
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Parses a date string (YYYY-MM-DD) and a time string (HH:MM) in local time to avoid timezone offset discrepancies.
 * @param {string} dateStr YYYY-MM-DD format
 * @param {string} timeStr HH:MM format
 * @returns {Date} A Date object in local time.
 */
export function parseLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date();
  
  const dateParts = dateStr.split("-");
  const timeParts = timeStr.split(":");
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
  const day = parseInt(dateParts[2], 10);
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  return new Date(year, month, day, hours, minutes);
}

/**
 * Shifts a date by a given number of months, handling month-end overflow correctly.
 * @param {Date} date The original Date object.
 * @param {number} months The number of months to add.
 * @param {number} [originalDay] The original start day of the month.
 * @returns {Date} The shifted Date object.
 */
export function addMonths(date, months, originalDay) {
  const targetMonth = date.getMonth() + months;
  const dayToUse = originalDay !== undefined ? originalDay : date.getDate();
  
  // Set date to 1st of target month first to avoid overflow
  date.setDate(1);
  date.setMonth(targetMonth);
  
  // Find last day of target month
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(dayToUse, lastDay));
  return date;
}

/**
 * Calculates the next occurrence of a recurring reminder that is in the future.
 * @param {string} dateStr YYYY-MM-DD format
 * @param {string} timeStr HH:MM format
 * @param {string} recurrence none|daily|weekly|monthly|quarterly|yearly
 * @returns {Object|null} An object with { reminderDate, reminderTime } or null if not recurring.
 */
export function getNextOccurrence(dateStr, timeStr, recurrence) {
  if (!recurrence || recurrence === "none") return null;

  const original = parseLocalDateTime(dateStr, timeStr);
  const originalDay = original.getDate();

  let current = parseLocalDateTime(dateStr, timeStr);
  if (isNaN(current.getTime())) {
    current = new Date();
  }

  const now = new Date();
  let iterations = 0;

  while (current <= now && iterations < 1000) {
    iterations++;
    switch (recurrence) {
      case "daily":
        current.setDate(current.getDate() + 1);
        break;
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly":
        current = addMonths(current, 1, originalDay);
        break;
      case "quarterly":
        current = addMonths(current, 3, originalDay);
        break;
      case "yearly":
        current = addMonths(current, 12, originalDay);
        break;
      default:
        return null;
    }
  }

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  const hours = String(current.getHours()).padStart(2, "0");
  const minutes = String(current.getMinutes()).padStart(2, "0");

  return {
    reminderDate: `${year}-${month}-${day}`,
    reminderTime: `${hours}:${minutes}`
  };
}

export const MarakadheyStorage = {
  /**
   * Retrieves all saved reminders from storage.
   * @returns {Promise<Array>} A promise that resolves to an array of reminders.
   */
  getAll: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get({ reminders: [], appVersion: APP_VERSION }, (result) => {
        resolve(result.reminders || []);
      });
    });
  },

  /**
   * Retrieves a single reminder by its ID.
   * @param {string} id The reminder ID.
   * @returns {Promise<Object|null>} The reminder object, or null if not found.
   */
  getById: async (id) => {
    const reminders = await MarakadheyStorage.getAll();
    return reminders.find((r) => r.id === id) || null;
  },

  /**
   * Saves a reminder (creates new or updates existing) and registers its alarm.
   * @param {Object} reminder The reminder object to save.
   * @returns {Promise<Object>} The saved reminder.
   */
  save: async (reminder) => {
    const reminders = await MarakadheyStorage.getAll();
    const index = reminders.findIndex((r) => r.id === reminder.id);

    if (index > -1) {
      reminders[index] = { ...reminders[index], ...reminder };
    } else {
      reminders.push(reminder);
    }

    await new Promise((resolve) => {
      chrome.storage.local.set({ reminders, appVersion: APP_VERSION }, resolve);
    });

    // Synchronize alarm for this reminder
    await MarakadheyStorage.syncAlarm(reminder);

    return reminder;
  },

  /**
   * Deletes a reminder by ID and clears its scheduled alarm.
   * @param {string} id The reminder ID.
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const reminders = await MarakadheyStorage.getAll();
    const filtered = reminders.filter((r) => r.id !== id);

    await new Promise((resolve) => {
      chrome.storage.local.set({ reminders: filtered, appVersion: APP_VERSION }, resolve);
    });

    // Clear associated alarm
    await MarakadheyStorage.clearAlarm(id);
  },

  /**
   * Clears a Chrome alarm for a given reminder ID.
   * @param {string} id The reminder ID.
   * @returns {Promise<boolean>} Resolves with true if alarm was cleared.
   */
  clearAlarm: (id) => {
    return new Promise((resolve) => {
      chrome.alarms.clear(getAlarmName(id), resolve);
    });
  },

  /**
   * Syncs the alarm for a reminder. Creates it if pending and in future; clears it otherwise.
   * @param {Object} reminder The reminder object.
   * @returns {Promise<void>}
   */
  syncAlarm: async (reminder) => {
    const alarmName = getAlarmName(reminder.id);

    // If completed, clear any existing alarm
    if (reminder.completed) {
      console.log(`Clearing alarm for completed reminder: ${reminder.title}`);
      await MarakadheyStorage.clearAlarm(reminder.id);
      return;
    }

    const alarmTime = parseLocalDateTime(reminder.reminderDate, reminder.reminderTime).getTime();
    const now = Date.now();

    if (alarmTime > now) {
      console.log(`Scheduling alarm for: "${reminder.title}" at ${new Date(alarmTime).toString()}`);
      chrome.alarms.create(alarmName, { when: alarmTime });
    } else {
      console.log(`Skipping alarm for: "${reminder.title}" (due time is in the past)`);
      await MarakadheyStorage.clearAlarm(reminder.id);
    }
  },

  /**
   * Loops through all reminders and synchronizes their alarms.
   * Useful on browser startup or extension install to align alarms.
   */
  syncAllAlarms: async (onMissedReminder) => {
    const reminders = await MarakadheyStorage.getAll();
    const now = Date.now();
    let changed = false;
    const missedReminders = [];
    console.log(`Syncing all alarms. Total reminders: ${reminders.length}`);

    for (const reminder of reminders) {
      if (!reminder.completed) {
        const alarmTime = parseLocalDateTime(reminder.reminderDate, reminder.reminderTime).getTime();
        const alarmName = getAlarmName(reminder.id);
        if (alarmTime > now) {
          console.log(`Re-scheduling alarm for: "${reminder.title}" at ${new Date(alarmTime).toString()}`);
          chrome.alarms.create(alarmName, { when: alarmTime });
        } else {
          // Alarm is in the past!
          if (reminder.recurrence && reminder.recurrence !== "none") {
            console.log(`Missed recurring reminder: "${reminder.title}". Advancing first...`);
            
            // 1. Calculate next occurrence
            const next = getNextOccurrence(reminder.reminderDate, reminder.reminderTime, reminder.recurrence);
            if (next) {
              reminder.reminderDate = next.reminderDate;
              reminder.reminderTime = next.reminderTime;
              changed = true;
              missedReminders.push(reminder);

              // Schedule alarm for new time
              const newAlarmTime = parseLocalDateTime(reminder.reminderDate, reminder.reminderTime).getTime();
              if (newAlarmTime > now) {
                chrome.alarms.create(alarmName, { when: newAlarmTime });
              } else {
                await MarakadheyStorage.clearAlarm(reminder.id);
              }
            } else {
              await MarakadheyStorage.clearAlarm(reminder.id);
            }
          } else {
            console.log(`Clearing past alarm for: "${reminder.title}"`);
            await MarakadheyStorage.clearAlarm(reminder.id);
          }
        }
      } else {
        await MarakadheyStorage.clearAlarm(reminder.id);
      }
    }

    if (changed) {
      await new Promise((resolve) => {
        chrome.storage.local.set({ reminders, appVersion: APP_VERSION }, resolve);
      });
      console.log("Missed recurring reminders advanced and saved to storage.");
    }

    // Now that storage is updated, trigger the recovery notifications!
    if (onMissedReminder && missedReminders.length > 0) {
      for (const reminder of missedReminders) {
        try {
          onMissedReminder(reminder);
        } catch (e) {
          console.error("Error in onMissedReminder callback:", e);
        }
      }
    }
  },

  /**
   * Retrieves settings from storage.
   * @returns {Promise<Object>} Settings object with defaults.
   */
  getSettings: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get({ settings: {} }, (result) => {
        const defaults = { autoComplete: false, hideCompleted: true, autoDeleteCompleted: false };
        const saved = result.settings || {};
        resolve({ ...defaults, ...saved });
      });
    });
  },

  /**
   * Saves settings to storage.
   * @param {Object} settings The settings object.
   * @returns {Promise<void>}
   */
  saveSettings: (settings) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings }, resolve);
    });
  },

  /**
   * Cleans up completed reminders older than 90 days if setting is enabled.
   * @returns {Promise<void>}
   */
  cleanCompletedReminders: async () => {
    const settings = await MarakadheyStorage.getSettings();
    if (!settings.autoDeleteCompleted) return;

    const reminders = await MarakadheyStorage.getAll();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let changed = false;
    const filtered = [];

    for (const r of reminders) {
      if (r.completed) {
        // Fallback sequence: completedAt -> reminderDate -> createdAt
        const dateToCheck = r.completedAt || r.reminderDate || r.createdAt;
        const compDate = new Date(dateToCheck);
        if (!isNaN(compDate.getTime()) && compDate < ninetyDaysAgo) {
          await MarakadheyStorage.clearAlarm(r.id);
          changed = true;
          continue;
        }
      }
      filtered.push(r);
    }

    if (changed) {
      await new Promise((resolve) => {
        chrome.storage.local.set({ reminders: filtered, appVersion: APP_VERSION }, resolve);
      });
      console.log("Auto-deleted completed reminders older than 90 days.");
    }
  }
};

