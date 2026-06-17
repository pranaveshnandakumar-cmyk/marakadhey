# Marakadhey

**Don't lose opportunities.**

Marakadhey is a Chrome Extension that helps users save important webpages and receive reminders before deadlines.

Whether it's an internship application, scholarship, webinar, hackathon, certification, registration, or any important opportunity, Marakadhey ensures you don't forget it.

---
## Privacy Policy
Marakadhey stores reminder data locally on the user's device using Chrome Storage.

No personal data is collected, transmitted, sold, or shared with third parties.

Google Calendar integration opens a Google Calendar event creation page and does not access the user's Google account.

---

## Features

### Save Opportunities Instantly
Capture the current webpage with one click.
* **Auto-Captures Webpage Info**: Automatically fetches the current page title and active URL.
* **Auto-Deadline Detection**: Scans the active page's DOM for upcoming date patterns and suggests them in a one-click apply banner.
* **Quick Presets**: Set deadlines instantly with quick-preset buttons (Today Eve, Tomorrow Morning, 3 Days, 1 Week).
* **Category Tagging**: Categorize your reminders (Internship, Job, Scholarship, Webinar, Hackathon, Certification, Personal, Other) with distinct color-coded badges.
* **Custom Priorities**: Set priority levels (High, Medium, Low) to emphasize important deadlines.
* **Notes**: Append custom notes to keep extra details (e.g. login info, requirements).

---

### Smart Inbox & UX Hardening
Manage all saved reminders inside a clean, high-performance workspace.
* **Smart Filtering & Search**: Find opportunities instantly via real-time search, filter pills (All, Pending, Completed), and status counts.
* **Advanced Sorting**: Sort by newest, oldest, priority weight, or due date (which pushes completed items to the bottom).
* **Performance Pagination**: Renders up to 40 cards initially, appending a smooth "Load More" button for larger lists to keep the interface fast.
* **Inline Delete Confirmations**: Replaces disruptive native prompts with a non-blocking, modern "Confirm?" button transition that reverts after 3 seconds of inactivity.

---

### Analytics & Dashboard
A dedicated, beautiful dashboard tab to monitor your application progress.
* **High-Level Metrics**: View total, pending, and completed reminder counts alongside a completion rate percentage indicator.
* **Urgency & Priority Distribution**: Visual bar graphs displaying the ratio of overdue, today's, and upcoming tasks, as well as priority weights.
* **Category Distribution**: Dynamic charts showcasing reminder counts across all categories.
* **Upcoming Deadline Spotlight**: Highlights your next urgent pending deadline so you stay focused.

---

### Desktop Notifications & Safety
Receive timely reminders directly through Chrome notifications.
* **Require Interaction**: Reminders remain on your screen so they cannot be missed.
* **Action Buttons**:
  * **Open Link**: Launches the original opportunity page in a new browser tab.
  * **Snooze 1 Day**: Automatically postpones the reminder for 24 hours.
* **Accidental Click Protection**: Clicking or dismissing the body of the notification toast safely clears it from view and will never trigger unwanted browser tabs.

---

### Google Calendar Quick Sync
Sync reminders with your schedule on the fly.
* **Add to Calendar**: Every card features a yellow-tinted "Add to Calendar" button.
* **Non-Intrusive Integration**: Opens a pre-filled Google Calendar template event tab with pre-populated deadline dates, title, and truncated details without requesting any account permissions.
* **Mobile Alerts**: Get reminders on your phone through Google Calendar notification alerts.

---

### Completion & Housekeeping Workflow
Keep your database clean and lightweight.
* **Auto-Complete Option**: Automatically marks reminders as completed when you click "Open Link".
* **Hide Completed**: Clean up your active inbox by toggling off completed reminders.
* **Auto-Delete Completed**: Automatically purges completed reminders older than 90 days in the background.

## Use Cases

Marakadhey is useful for:

* Internship Applications
* Placement Registrations
* Scholarships
* Hackathons
* Webinars
* Certifications
* College Registrations
* Exam Registrations
* Event Registrations
* Personal Deadlines


## Tech Stack

* HTML
* CSS
* JavaScript
* Chrome Extension Manifest V3

Chrome APIs Used:

* Storage API
* Alarms API
* Notifications API
* Tabs API

---

## Project Structure

```text
Marakadhey/
│
├── manifest.json
│
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── background/
│   └── service-worker.js
│
├── storage/
│   └── storage.js
│
├── utils/
│   └── calendar.js
│
├── notifications/
│   └── notifications.js
│
└── assets/
    └── icon.png
```

---

## Installation

### Developer Mode

1. Open Chrome
2. Navigate to:

```text
chrome://extensions
```

3. Enable Developer Mode
4. Click **Load Unpacked**
5. Select the Marakadhey project folder

The extension is now installed locally.

---

## Roadmap

### Version 2.0 (Completed)
* **Status Controls**: Hide Completed Reminders and Auto-Complete opening workflow.
* **Google Calendar Quick Sync**: Optional manual "Add to Calendar" card button with auto-truncating details.
* **Auto-Deadline Detection**: DOM scanner to auto-detect page deadlines.
* **Timezone Alarm Synchronization**: Automatic system timezone change tracking and alarm rescheduling.
* **Analytics Dashboard**: Progress rates, priority distributions, and upcoming spotlights.
* **UX Hardening**: 40-item pagination (Load More) and inline animated delete confirmation.

### Future Features
* Telegram / Discord Bot Notifications
* Web Push Notifications
* Multi-device Cloud Sync
* Database Export & Backup
* Mobile Companion App

---

## Why Marakadhey?

Many opportunities are not missed because of lack of skill.

They are missed because we forget them.

Marakadhey was built to solve a simple problem:

> Save now. Remember later.

