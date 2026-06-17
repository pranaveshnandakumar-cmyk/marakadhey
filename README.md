# Marakadhey

**Don't lose opportunities.**

Marakadhey is a Chrome Extension that helps users save important webpages and receive reminders before deadlines.

Whether it's an internship application, scholarship, webinar, hackathon, certification, registration, or any important opportunity, Marakadhey ensures you don't forget it.

---

## Features

### Save Opportunities Instantly

Capture the current webpage with one click.

* Automatically fetches page title
* Automatically captures page URL
* Add custom notes
* Set reminder date and time
* Set priority level (High, Medium, Low)

---

### Smart Inbox

Manage all saved reminders in one place.

* Search reminders
* Sort by date and priority
* Filter:

  * All
  * Pending
  * Completed

---

### Desktop Notifications

Receive reminders directly through Chrome notifications.

Actions:

* Open Link
* Snooze 1 Day

---

### Completion Workflow

Optional settings allow users to:

* Automatically mark reminders as completed after opening
* Hide completed reminders from the Inbox
* Keep reminder history without clutter

---

### Mobile Reminder Support

Integrates with Google Calendar.

When enabled:

* Creates a pre-filled Google Calendar event
* Sends reminder notifications to your mobile device through Google Calendar
* Works without additional apps

---

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

---

## Screenshots

### Add Reminder

Save a webpage and schedule a reminder.

### Inbox

Track pending and completed reminders.

### Notifications

Get notified before deadlines.

### Settings

Customize reminder behavior.

---

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

### Version 1.2

* Hide Completed Reminders
* Auto Complete Workflow
* Google Calendar Integration

### Future Features

* Telegram Notifications
* Web Push Notifications
* Cloud Sync
* Export & Backup
* Reminder Analytics
* Mobile Companion App

---

## Why Marakadhey?

Many opportunities are not missed because of lack of skill.

They are missed because we forget them.

Marakadhey was built to solve a simple problem:

> Save now. Remember later.

---

## Author

Pranavesh N

B.Tech Electronics and Communication Engineering

Vellore Institute of Technology, Chennai

---

## License

MIT License

```

Made with ❤️ to help people never miss opportunities.
```
