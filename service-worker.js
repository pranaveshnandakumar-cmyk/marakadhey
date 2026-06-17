// Marakadhey Background Service Worker - ES Module
// Manages alarms, notification events, and lifecycle synchronization.

import { MarakadheyStorage, parseLocalDateTime } from "../storage/storage.js";
import { MarakadheyNotifications } from "../notifications/notifications.js";

// Prefix for alarms
const ALARM_PREFIX = "alarm-reminder-";

// Helper to extract reminder ID from alarm name
function getReminderIdFromAlarm(alarmName) {
  if (alarmName.startsWith(ALARM_PREFIX)) {
    return alarmName.substring(ALARM_PREFIX.length);
  }
  return null;
}

// 1. Alarm Trigger Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Check for timezone shift on every alarm wakeup
  await checkTimezoneChange();

  if (alarm.name === "auto-delete-completed-alarm") {
    try {
      await MarakadheyStorage.cleanCompletedReminders();
    } catch (error) {
      console.error("Error during auto-delete cleanup:", error);
    }
    return;
  }

  const reminderId = getReminderIdFromAlarm(alarm.name);
  if (!reminderId) return;

  try {
    const reminder = await MarakadheyStorage.getById(reminderId);
    if (reminder && !reminder.completed) {
      MarakadheyNotifications.show(reminder);
    }
  } catch (error) {
    console.error("Error processing alarm:", error);
  }
});

// Helper: Open Reminder URL and track timestamp
async function openReminderLink(reminderId) {
  try {
    const reminder = await MarakadheyStorage.getById(reminderId);
    if (reminder && reminder.url) {
      const settings = await MarakadheyStorage.getSettings();
      if (settings.autoComplete) {
        reminder.completed = true;
        reminder.completedAt = new Date().toISOString();
      } else {
        reminder.lastOpenedAt = new Date().toISOString();
      }
      await MarakadheyStorage.save(reminder);
      chrome.tabs.create({ url: reminder.url });
    }
  } catch (error) {
    console.error("Error opening link:", error);
  }
}

// Helper: Snooze Reminder for 24 Hours
async function snoozeReminder(reminderId) {
  try {
    const reminder = await MarakadheyStorage.getById(reminderId);
    if (reminder) {
      const originalDate = parseLocalDateTime(reminder.reminderDate, reminder.reminderTime);
      const baseTime = isNaN(originalDate.getTime()) ? new Date() : originalDate;
      const newDeadline = new Date(baseTime.getTime() + 24 * 60 * 60 * 1000);

      const year = newDeadline.getFullYear();
      const month = String(newDeadline.getMonth() + 1).padStart(2, "0");
      const day = String(newDeadline.getDate()).padStart(2, "0");
      const hours = String(newDeadline.getHours()).padStart(2, "0");
      const minutes = String(newDeadline.getMinutes()).padStart(2, "0");

      reminder.reminderDate = `${year}-${month}-${day}`;
      reminder.reminderTime = `${hours}:${minutes}`;
      reminder.completed = false; // Keep pending

      await MarakadheyStorage.save(reminder);
      console.log(`Reminder ${reminderId} snoozed successfully to ${reminder.reminderDate} ${reminder.reminderTime}`);
    }
  } catch (error) {
    console.error("Error snoozing reminder:", error);
  }
}

// 2. Notification Button Click Handler
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    await openReminderLink(notificationId);
  } else if (buttonIndex === 1) {
    await snoozeReminder(notificationId);
  }
  await MarakadheyNotifications.clear(notificationId);
});

// 3. Notification Body Click Handler
chrome.notifications.onClicked.addListener(async (notificationId) => {
  // Only clear/dismiss the notification from view.
  // The website URL should only be opened when the user explicitly clicks the "Open Link" action button.
  await MarakadheyNotifications.clear(notificationId);
});

// Helper: Check for system timezone change and re-sync alarms if shifted
async function checkTimezoneChange() {
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Promise((resolve) => {
    chrome.storage.local.get(["lastTimezone"], async (result) => {
      if (result.lastTimezone && result.lastTimezone !== currentTz) {
        console.log(`Timezone changed from ${result.lastTimezone} to ${currentTz}. Re-registering all alarms...`);
        await MarakadheyStorage.syncAllAlarms();
      }
      chrome.storage.local.set({ lastTimezone: currentTz }, resolve);
    });
  });
}

// 4. Startup / Install Listeners for Notification & Alarm Reliability
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started. Re-registering all alarms for reliability...");
  await checkTimezoneChange();
  await MarakadheyStorage.syncAllAlarms();
  chrome.alarms.create("auto-delete-completed-alarm", { periodInMinutes: 24 * 60 });
  await MarakadheyStorage.cleanCompletedReminders();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`Extension installed/updated (Reason: ${details.reason}). Re-registering all alarms...`);
  await checkTimezoneChange();
  await MarakadheyStorage.syncAllAlarms();
  chrome.alarms.create("auto-delete-completed-alarm", { periodInMinutes: 24 * 60 });
  await MarakadheyStorage.cleanCompletedReminders();
});
