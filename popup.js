// Marakadhey Popup Controller - ES Module
// Handles DOM interactions, form validations, filters, and storage triggers.

import { MarakadheyStorage, formatTime12Hour, parseLocalDateTime } from "../storage/storage.js";
import { generateGoogleCalendarLink } from "../utils/calendar.js";

// State Management
let allReminders = [];
let activeFilter = "all";
let searchQuery = "";
let userSettings = { autoComplete: false, hideCompleted: true };
let visibleCount = 40;

// Select DOM Elements
const tabAdd = document.getElementById("tab-add");
const tabInbox = document.getElementById("tab-inbox");
const tabDashboard = document.getElementById("tab-dashboard");
const tabSettings = document.getElementById("tab-settings");
const contentAdd = document.getElementById("content-add");
const contentInbox = document.getElementById("content-inbox");
const contentDashboard = document.getElementById("content-dashboard");
const contentSettings = document.getElementById("content-settings");
const pendingCountBadge = document.getElementById("pending-count");

// Dashboard Elements
const dbTotalCount = document.getElementById("db-total-count");
const dbPendingCount = document.getElementById("db-pending-count");
const dbCompletedCount = document.getElementById("db-completed-count");
const dbCompletionPct = document.getElementById("db-completion-pct");
const dbProgressFill = document.getElementById("db-progress-fill");

const barOverdue = document.getElementById("bar-overdue");
const valOverdue = document.getElementById("val-overdue");
const barToday = document.getElementById("bar-today");
const valToday = document.getElementById("val-today");
const barUpcoming = document.getElementById("bar-upcoming");
const valUpcoming = document.getElementById("val-upcoming");

const barHigh = document.getElementById("bar-high");
const valHigh = document.getElementById("val-high");
const barMedium = document.getElementById("bar-medium");
const valMedium = document.getElementById("val-medium");
const barLow = document.getElementById("bar-low");
const valLow = document.getElementById("val-low");

const reminderForm = document.getElementById("reminder-form");
const editIdInput = document.getElementById("edit-id");
const validationMessage = document.getElementById("validation-message");
const editInfoBanner = document.getElementById("edit-info");
const editInfoDetails = document.getElementById("edit-info-details");

// Detected Deadline Elements
const detectedDeadlineBanner = document.getElementById("detected-deadline-banner");
const detectedDateText = document.getElementById("detected-date-text");
const btnApplyDetected = document.getElementById("btn-apply-detected");

const titleInput = document.getElementById("reminder-title");
const urlInput = document.getElementById("reminder-url");
const dateInput = document.getElementById("reminder-date");
const hourSelect = document.getElementById("reminder-hour");
const minuteSelect = document.getElementById("reminder-minute");
const ampmSelect = document.getElementById("reminder-ampm");
const prioritySelect = document.getElementById("reminder-priority");
const categorySelect = document.getElementById("reminder-category");
const notesInput = document.getElementById("reminder-notes");
const saveBtn = document.getElementById("btn-save");
const cancelEditBtn = document.getElementById("btn-cancel-edit");
const gcalCheckbox = document.getElementById("reminder-gcal");
const settingAutoCompleteCheckbox = document.getElementById("setting-auto-complete");
const settingHideCompletedCheckbox = document.getElementById("setting-hide-completed");
const settingAutoDeleteCompletedCheckbox = document.getElementById("setting-auto-delete-completed");

// Due Soon Inbox Alert Elements
const dueSoonSection = document.getElementById("due-soon-section");
const dueSoonContainer = document.getElementById("due-soon-container");

// Dashboard Next Deadline Card & Category Container
const dbNextDeadlineCard = document.getElementById("db-next-deadline-card");
const nextDeadlineTitle = document.getElementById("next-deadline-title");
const nextDeadlineDate = document.getElementById("next-deadline-date");
const dbCategoryContainer = document.getElementById("db-category-container");

const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear");
const statusFilters = document.getElementById("status-filters");
const sortSelect = document.getElementById("sort-select");
const remindersContainer = document.getElementById("reminders-container");
const emptyState = document.getElementById("empty-state");

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", async () => {
    populateMinutes();
    setupEventListeners();
    setDefaultDateTime();
    await loadSettings();
    await loadReminders();
    await loadSettingsToUI();
    await fetchActiveTabInfo();
});

// Helper to populate minutes select dynamically (00-59)
function populateMinutes() {
    if (!minuteSelect) return;
    minuteSelect.innerHTML = "";
    for (let i = 0; i < 60; i++) {
        const minStr = String(i).padStart(2, "0");
        const opt = document.createElement("option");
        opt.value = minStr;
        opt.textContent = minStr;
        minuteSelect.appendChild(opt);
    }
}

// Setup event listeners for tabs and control inputs
function setupEventListeners() {
    // Tab Switching
    tabAdd.addEventListener("click", () => switchTab("add"));
    tabInbox.addEventListener("click", () => {
        switchTab("inbox");
        renderInbox();
    });
    tabDashboard.addEventListener("click", () => {
        switchTab("dashboard");
        renderDashboard();
    });
    tabSettings.addEventListener("click", () => {
        switchTab("settings");
        loadSettingsToUI();
    });

    // Apply Detected Deadline
    if (btnApplyDetected) {
        btnApplyDetected.addEventListener("click", applyDetectedDeadline);
    }

    // Form Submit
    reminderForm.addEventListener("submit", saveReminder);

    // Preset Clicks
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const presetType = e.target.getAttribute("data-preset");
            applyPresetDateTime(presetType);
        });
    });

    if (settingAutoCompleteCheckbox) {
        settingAutoCompleteCheckbox.addEventListener("change", async (e) => {
            userSettings.autoComplete = e.target.checked;
            await MarakadheyStorage.saveSettings(userSettings);
        });
    }

    if (settingHideCompletedCheckbox) {
        settingHideCompletedCheckbox.addEventListener("change", async (e) => {
            userSettings.hideCompleted = e.target.checked;
            await MarakadheyStorage.saveSettings(userSettings);
            renderInbox();
        });
    }

    if (settingAutoDeleteCompletedCheckbox) {
        settingAutoDeleteCompletedCheckbox.addEventListener("change", async (e) => {
            userSettings.autoDeleteCompleted = e.target.checked;
            await MarakadheyStorage.saveSettings(userSettings);
            if (userSettings.autoDeleteCompleted) {
                await MarakadheyStorage.cleanCompletedReminders();
                await loadReminders();
                renderInbox();
            }
        });
    }

    // Cancel Edit
    cancelEditBtn.addEventListener("click", () => {
        resetForm();
        switchTab("inbox");
        renderInbox();
    });

    // Search
    searchInput.addEventListener("input", (e) => {
        searchReminders(e.target.value);
    });

    searchClearBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchReminders("");
    });

    // Filter Pills
    statusFilters.addEventListener("click", (e) => {
        if (e.target.classList.contains("pill")) {
            statusFilters.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
            e.target.classList.add("active");
            visibleCount = 40;
            filterReminders(e.target.getAttribute("data-filter"));
        }
    });

    // Sorting
    sortSelect.addEventListener("change", (e) => {
        sortReminders(e.target.value);
    });
}

// Applies preset date and times automatically
function applyPresetDateTime(presetType) {
    const now = new Date();
    let targetDate = new Date();

    if (presetType === "today-eve") {
        targetDate.setHours(18, 0, 0, 0);
    } else if (presetType === "tomorrow") {
        targetDate.setDate(now.getDate() + 1);
        targetDate.setHours(9, 0, 0, 0);
    } else if (presetType === "3days") {
        targetDate.setDate(now.getDate() + 3);
        targetDate.setHours(9, 0, 0, 0);
    } else if (presetType === "1week") {
        targetDate.setDate(now.getDate() + 7);
        targetDate.setHours(9, 0, 0, 0);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;

    let hours = targetDate.getHours();
    const minutes = String(targetDate.getMinutes()).padStart(2, "0");
    let ampm = "AM";

    if (hours >= 12) {
        ampm = "PM";
        if (hours > 12) hours -= 12;
    } else if (hours === 0) {
        hours = 12;
    }

    hourSelect.value = String(hours);
    minuteSelect.value = minutes;
    ampmSelect.value = ampm;
}

// Switches UI views between Add Reminder form, Inbox lists, and Settings
function switchTab(tabName) {
    tabAdd.classList.remove("active");
    tabInbox.classList.remove("active");
    tabDashboard.classList.remove("active");
    tabSettings.classList.remove("active");
    contentAdd.classList.remove("active");
    contentInbox.classList.remove("active");
    contentDashboard.classList.remove("active");
    contentSettings.classList.remove("active");

    if (tabName === "add") {
        tabAdd.classList.add("active");
        contentAdd.classList.add("active");
    } else if (tabName === "inbox") {
        tabInbox.classList.add("active");
        contentInbox.classList.add("active");
        visibleCount = 40;
    } else if (tabName === "dashboard") {
        tabDashboard.classList.add("active");
        contentDashboard.classList.add("active");
    } else if (tabName === "settings") {
        tabSettings.classList.add("active");
        contentSettings.classList.add("active");
    }
}

// Loads user settings and checks/unchecks the UI checkboxes
async function loadSettingsToUI() {
    if (settingAutoCompleteCheckbox) {
        settingAutoCompleteCheckbox.checked = userSettings.autoComplete;
    }
    if (settingHideCompletedCheckbox) {
        settingHideCompletedCheckbox.checked = userSettings.hideCompleted;
    }
    if (settingAutoDeleteCompletedCheckbox) {
        settingAutoDeleteCompletedCheckbox.checked = userSettings.autoDeleteCompleted;
    }
}

// Loads settings from storage into local state
async function loadSettings() {
    try {
        userSettings = await MarakadheyStorage.getSettings();
    } catch (err) {
        console.error("Error loading settings:", err);
    }
}

// Prefills date/time to today at 9 AM for convenience
function setDefaultDateTime() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;

    if (hourSelect) hourSelect.value = "9";
    if (minuteSelect) minuteSelect.value = "00";
    if (ampmSelect) ampmSelect.value = "AM";
}

// Queries active Chrome Tab title and URL, and triggers deadline detection
async function fetchActiveTabInfo() {
    try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                const activeTab = tabs[0];
                // Populate fields (must be readonly in form)
                if (activeTab.url && activeTab.url.startsWith("http")) {
                    // Ignore Google Calendar page URLs to prevent capturing them as the source webpage
                    const isGCal = activeTab.url.includes("calendar.google.com") || activeTab.url.includes("google.com/calendar");
                    if (isGCal) {
                        console.log("Ignoring Google Calendar URL capture.");
                        titleInput.value = "";
                        urlInput.value = "";
                        return;
                    }

                    titleInput.value = activeTab.title || "";
                    urlInput.value = activeTab.url || "";
                    
                    // Trigger dynamic deadline detection on active page
                    detectPageDeadline(activeTab.id);
                }
            }
        });
    } catch (err) {
        console.warn("Active tab query not supported in this context.", err);
    }
}

// Global variable for storing detected date
let detectedDateValue = "";

// Shows the auto-detected deadline banner
function showDetectedDeadline(dateStr) {
    if (!detectedDeadlineBanner || !detectedDateText) return;
    detectedDateValue = dateStr;
    const parts = dateStr.split("-");
    const displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    
    const bannerText = document.getElementById("detected-banner-text");
    const bannerIcon = document.getElementById("detected-banner-icon");
    
    if (bannerIcon) bannerIcon.textContent = "✨";
    if (bannerText) {
        bannerText.innerHTML = `Auto-detected deadline: <strong id="detected-date-text">${displayDate}</strong>`;
    }
    
    if (btnApplyDetected) btnApplyDetected.classList.remove("hidden");
    
    // Style as successful notification
    detectedDeadlineBanner.style.background = "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)";
    detectedDeadlineBanner.style.borderColor = "var(--primary)";
    detectedDeadlineBanner.style.color = "#C2410C";
    
    detectedDeadlineBanner.classList.remove("hidden");
}

// Shows feedback status inside the scanner banner (e.g. no dates found, or injection error)
function showScannerFeedback(msg) {
    if (!detectedDeadlineBanner) return;
    
    const bannerText = document.getElementById("detected-banner-text");
    const bannerIcon = document.getElementById("detected-banner-icon");
    
    if (bannerIcon) bannerIcon.textContent = "ℹ️";
    if (bannerText) bannerText.textContent = msg;
    
    if (btnApplyDetected) btnApplyDetected.classList.add("hidden");
    
    // Style as diagnostic status info
    detectedDeadlineBanner.style.background = "#F3F4F6";
    detectedDeadlineBanner.style.borderColor = "#9CA3AF";
    detectedDeadlineBanner.style.color = "#4B5563";
    
    detectedDeadlineBanner.classList.remove("hidden");
}

// Event handler to apply the detected date
function applyDetectedDeadline() {
    if (!detectedDateValue) return;
    dateInput.value = detectedDateValue;
    detectedDeadlineBanner.classList.add("hidden");
}

// Injects content script into active tab to scan DOM for deadlines
async function detectPageDeadline(tabId) {
    if (!chrome.scripting) return;
    try {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: scanPageForDeadlines
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.warn("Scripting execution error:", chrome.runtime.lastError.message);
                showScannerFeedback("Cannot auto-scan this page type (system page or local PDF).");
                return;
            }
            if (results && results[0] && results[0].result) {
                const detectedDateStr = results[0].result;
                if (detectedDateStr) {
                    showDetectedDeadline(detectedDateStr);
                } else {
                    showScannerFeedback("No deadline dates detected on this page.");
                }
            } else {
                showScannerFeedback("No deadline dates detected on this page.");
            }
        });
    } catch (err) {
        console.error("Error running deadline auto-detection script:", err);
        showScannerFeedback("Error executing page scanner.");
    }
}

// Page Date/Deadline Scanner (Runs in page context)
function scanPageForDeadlines() {
    const regexYYYYMMDD = /\b(202\d)[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/;
    const regexAnySlashDate = /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](202\d)\b/;
    const monthsRegex = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;
    const regexEnglishDate = new RegExp(`\\b(?:(0?[1-9]|[12]\\d|3[01])\\s+)?${monthsRegex.source}\\s+(0?[1-9]|[12]\\d|3[01])?[\\s,]+(202\\d)\\b`, "i");

    const keywords = ["deadline", "due date", "closes", "ends", "apply by", "register by", "expiration", "expires", "last date"];
    const containsKeyword = (text) => {
        const lower = text.toLowerCase();
        return keywords.some(kw => lower.includes(kw));
    };

    const formatToYYYYMMDD = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return null;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const parseEnglishDate = (matchStr) => {
        try {
            const parsed = Date.parse(matchStr);
            if (!isNaN(parsed)) return new Date(parsed);
        } catch(e) {}
        return null;
    };

    const isFuture = (dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        const today = new Date();
        today.setHours(0,0,0,0);
        return d >= today;
    };

    const elements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, span, strong, em, td, a");
    let candidates = [];

    for (const el of elements) {
        const text = el.innerText ? el.innerText.trim() : "";
        if (text.length < 5 || text.length > 300) continue;

        if (containsKeyword(text)) {
            let match = text.match(regexYYYYMMDD);
            if (match) {
                const dateStr = `${match[1]}-${match[2]}-${match[3]}`;
                if (isFuture(dateStr)) candidates.push({ date: dateStr, priority: 3 });
            }
            match = text.match(regexAnySlashDate);
            if (match) {
                const parsedDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
                const dateStr = formatToYYYYMMDD(parsedDate);
                if (dateStr && isFuture(dateStr)) candidates.push({ date: dateStr, priority: 2 });
            }
            match = text.match(regexEnglishDate);
            if (match) {
                const parsedDate = parseEnglishDate(match[0]);
                const dateStr = formatToYYYYMMDD(parsedDate);
                if (dateStr && isFuture(dateStr)) candidates.push({ date: dateStr, priority: 2 });
            }
        }
    }

    if (candidates.length === 0) {
        const bodyText = document.body.innerText || "";
        let matches = bodyText.match(new RegExp(regexYYYYMMDD.source, "g"));
        if (matches) {
            for (const m of matches.slice(0, 5)) {
                if (isFuture(m)) candidates.push({ date: m, priority: 1 });
            }
        }
        const englishMatches = bodyText.match(new RegExp(regexEnglishDate.source, "gi"));
        if (englishMatches) {
            for (const em of englishMatches.slice(0, 5)) {
                const parsedDate = parseEnglishDate(em);
                const dateStr = formatToYYYYMMDD(parsedDate);
                if (dateStr && isFuture(dateStr)) candidates.push({ date: dateStr, priority: 1 });
            }
        }
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return new Date(a.date) - new Date(b.date);
        });
        return candidates[0].date;
    }

    return null;
}

// Helper: Calculate due status according to strict rules
function calculateDueStatus(reminder) {
    if (reminder.completed) {
        return { text: "✓ Completed", class: "completed" };
    }

    const now = new Date();
    const deadline = parseLocalDateTime(reminder.reminderDate, reminder.reminderTime);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const localToday = `${year}-${month}-${day}`;

    if (deadline < now) {
        return { text: "Overdue 🔴", class: "overdue" };
    } else if (reminder.reminderDate === localToday) {
        return { text: "Due Today 🟠", class: "today" };
    } else {
        return { text: "Upcoming 🟢", class: "upcoming" };
    }
}

// Helper: Format Dates visually
function formatCardDate(dateStr, timeStr) {
    const dt = parseLocalDateTime(dateStr, timeStr);
    if (isNaN(dt.getTime())) return `${dateStr} at ${formatTime12Hour(timeStr)}`;
    const dateFormatted = dt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    return `${dateFormatted} at ${formatTime12Hour(timeStr)}`;
}

// Helper: Alert Display
function showValidationError(message) {
    validationMessage.textContent = message;
    validationMessage.classList.remove("hidden");
}

function hideValidationError() {
    validationMessage.classList.add("hidden");
}

// Reset form values
function resetForm() {
    editIdInput.value = "";
    titleInput.value = "";
    urlInput.value = "";
    notesInput.value = "";
    prioritySelect.value = "medium";
    if (categorySelect) categorySelect.value = "internship";
    if (gcalCheckbox) gcalCheckbox.checked = false;
    setDefaultDateTime();
    hideValidationError();
    if (editInfoBanner) editInfoBanner.classList.add("hidden");
    if (detectedDeadlineBanner) detectedDeadlineBanner.classList.add("hidden");
    fetchActiveTabInfo();

    saveBtn.textContent = "Save Reminder";
    cancelEditBtn.classList.add("hidden");
}

// Simple HTML escaping helper for security
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g,
        tag => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[tag] || tag)
    );
}

/* ==========================================
   REQUIRED API INTERFACE FUNCTIONS
   ========================================== */

/**
 * 1. loadReminders()
 * Loads reminder items from local storage.
 */
export async function loadReminders() {
    try {
        allReminders = await MarakadheyStorage.getAll();
        await updatePendingCount();
        return allReminders;
    } catch (err) {
        console.error("Error loading reminders:", err);
        return [];
    }
}

/**
 * 2. saveReminder()
 * Handles validation and commits reminder items to storage.
 */
export async function saveReminder(e) {
    if (e) e.preventDefault();

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const reminderDate = dateInput.value;

    // Extract 12-hour values and convert to internal 24-hour string (HH:MM)
    const hourVal = parseInt(hourSelect.value, 10);
    const minuteVal = minuteSelect.value;
    const ampmVal = ampmSelect.value;

    let hours24 = hourVal;
    if (ampmVal === "PM" && hours24 < 12) {
        hours24 += 12;
    } else if (ampmVal === "AM" && hours24 === 12) {
        hours24 = 0;
    }
    const reminderTime = `${String(hours24).padStart(2, "0")}:${minuteVal}`;

    const priority = prioritySelect.value;
    const note = notesInput.value.trim();

    if (!title) {
        showValidationError("Opportunity Title is required. (Note: Internal chrome:// pages cannot be saved).");
        return;
    }
    if (!url) {
        showValidationError("Webpage URL is required.");
        return;
    }
    if (!reminderDate || !reminderTime) {
        showValidationError("Reminder date and time are required.");
        return;
    }

    // Combine reminderDate and reminderTime before validation
    const reminderDateTime = parseLocalDateTime(reminderDate, reminderTime);

    const now = new Date();

    // Debugging console logs
    console.log("Selected:", reminderDateTime);
    console.log("Current:", now);

    if (isNaN(reminderDateTime.getTime())) {
        showValidationError("Please enter a valid date and time.");
        return;
    }

    if (reminderDateTime <= now) {
        showValidationError(
            "Reminder date must be in the future."
        );
        return;
    }

    hideValidationError();

    const isEdit = editIdInput.value !== "";
    const id = isEdit ? editIdInput.value : (Date.now().toString(36) + Math.random().toString(36).substring(2, 5));

    let createdAt = new Date().toISOString();
    let lastOpenedAt = null;
    let completed = false;

    let completedAt = null;
    let category = categorySelect ? categorySelect.value : "other";

    if (isEdit) {
        const existing = allReminders.find(r => r.id === id);
        if (existing) {
            createdAt = existing.createdAt;
            lastOpenedAt = existing.lastOpenedAt;
            completed = existing.completed;
            completedAt = existing.completedAt || null;
            category = categorySelect ? categorySelect.value : (existing.category || "other");
        }
    }

    const reminder = {
        id,
        title,
        url,
        reminderDate,
        reminderTime,
        priority,
        category,
        note,
        completed,
        createdAt,
        lastOpenedAt,
        completedAt
    };

    const addToGCal = gcalCheckbox ? gcalCheckbox.checked : false;

    try {
        await MarakadheyStorage.save(reminder);
        resetForm();
        await loadReminders();
        switchTab("inbox");
        renderInbox();

        // Open Google Calendar Tab after successful local save
        if (addToGCal) {
            const gcalUrl = generateGoogleCalendarLink(reminder);
            if (gcalUrl) {
                chrome.tabs.create({ url: gcalUrl });
            }
        }
    } catch (err) {
        showValidationError("Failed to save reminder.");
        console.error(err);
    }
}

/**
 * 3. renderInbox()
 * Dynamically draws the inbox view based on filters, searches, and sorting.
 */
export function renderInbox() {
    // 1. Render Due Soon section (within 24 Hours)
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoonReminders = allReminders.filter(r => {
        if (r.completed) return false;
        const deadline = parseLocalDateTime(r.reminderDate, r.reminderTime);
        return deadline >= now && deadline <= oneDayFromNow;
    });

    if (dueSoonReminders.length > 0) {
        dueSoonSection.classList.remove("hidden");
        dueSoonContainer.innerHTML = "";
        dueSoonReminders.forEach(reminder => {
            const card = document.createElement("div");
            card.className = `card ${reminder.priority}-prio mini-card`;
            const displayDateTime = formatCardDate(reminder.reminderDate, reminder.reminderTime);
            const categoryText = reminder.category ? reminder.category.charAt(0).toUpperCase() + reminder.category.slice(1) : "Other";

            card.innerHTML = `
              <div class="card-header" style="padding: 0; margin-bottom: 2px;">
                <h3 class="card-title" style="font-size: 0.8rem; font-weight: 700;">${escapeHTML(reminder.title)}</h3>
              </div>
              <div class="badge-row" style="margin-bottom: 2px;">
                <span class="prio-badge ${reminder.priority}" style="font-size: 0.6rem; padding: 1px 4px;">${reminder.priority}</span>
                <span class="category-badge ${reminder.category || 'other'}" style="font-size: 0.6rem; padding: 1px 4px;">${categoryText}</span>
              </div>
              <div class="card-details" style="font-size: 0.7rem;">
                <div>Due: ${displayDateTime}</div>
              </div>
              <div class="card-actions" style="border-top: none; padding-top: 4px; margin-top: 0;">
                <button class="card-btn btn-open-soon" style="font-size: 0.65rem; padding: 2px 6px;">Open</button>
                <button class="card-btn btn-complete-soon" style="font-size: 0.65rem; padding: 2px 6px;">Done</button>
              </div>
            `;
            card.querySelector(".btn-open-soon").addEventListener("click", () => openReminder(reminder.id));
            card.querySelector(".btn-complete-soon").addEventListener("click", () => toggleComplete(reminder.id));
            dueSoonContainer.appendChild(card);
        });
    } else {
        dueSoonSection.classList.add("hidden");
    }

    // 2. Filter normal list
    let displayList = [...allReminders];

    if (activeFilter === "all") {
        if (userSettings.hideCompleted) {
            displayList = displayList.filter(r => !r.completed);
        }
    } else if (activeFilter === "pending") {
        displayList = displayList.filter(r => !r.completed);
    } else if (activeFilter === "completed") {
        displayList = displayList.filter(r => r.completed);
    }

    // Search
    if (searchQuery) {
        displayList = displayList.filter(r => r.title.toLowerCase().includes(searchQuery));
    }

    // Sort
    const sortBy = sortSelect.value;
    displayList.sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === "oldest") {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortBy === "duesoon") {
            const deadlineA = parseLocalDateTime(a.reminderDate, a.reminderTime).getTime();
            const deadlineB = parseLocalDateTime(b.reminderDate, b.reminderTime).getTime();

            // Completed items go to the bottom of the "Due Soon" sort list
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return deadlineA - deadlineB;
        }
        if (sortBy === "highprio") {
            const weight = { high: 3, medium: 2, low: 1 };
            if (weight[b.priority] !== weight[a.priority]) {
                return weight[b.priority] - weight[a.priority];
            }
            const deadlineA = parseLocalDateTime(a.reminderDate, a.reminderTime).getTime();
            const deadlineB = parseLocalDateTime(b.reminderDate, b.reminderTime).getTime();
            return deadlineA - deadlineB;
        }
        return 0;
    });

    // Render cards
    const reminders = displayList;
    const inboxContainer = remindersContainer;
    console.log("Reminders:", reminders);
    console.log("Container:", inboxContainer);

    remindersContainer.innerHTML = "";

    if (displayList.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    const totalCount = displayList.length;
    const paginatedList = displayList.slice(0, visibleCount);

    paginatedList.forEach((reminder) => {
        const card = document.createElement("div");
        card.className = `card ${reminder.priority}-prio ${reminder.completed ? "completed-status" : ""}`;

        const dueInfo = calculateDueStatus(reminder);
        const displayDateTime = formatCardDate(reminder.reminderDate, reminder.reminderTime);
        const categoryText = reminder.category ? reminder.category.charAt(0).toUpperCase() + reminder.category.slice(1) : "Other";

        card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHTML(reminder.title)}</h3>
      </div>
      
      <div class="badge-row">
        <span class="status-badge ${dueInfo.class}">${dueInfo.text}</span>
        <span class="prio-badge ${reminder.priority}">${reminder.priority}</span>
        <span class="category-badge ${reminder.category || 'other'}">${categoryText}</span>
      </div>

      <div class="card-details">
        <div class="card-date">Due: ${displayDateTime}</div>
        <div class="card-url" title="${escapeHTML(reminder.url)}">${escapeHTML(reminder.url)}</div>
      </div>

      ${reminder.note ? `<div class="card-note">${escapeHTML(reminder.note)}</div>` : ""}

      <div class="card-actions">
        <button class="card-btn btn-open">Open Link</button>
        <button class="card-btn btn-gcal">Add to Calendar</button>
        <button class="card-btn btn-edit">Edit</button>
        <button class="card-btn btn-delete">Delete</button>
        <button class="card-btn btn-complete">
          ${reminder.completed ? "Mark Pending" : "Mark Complete"}
        </button>
      </div>
    `;

        // Event Bindings
        card.querySelector(".btn-open").addEventListener("click", () => openReminder(reminder.id));
        card.querySelector(".btn-gcal").addEventListener("click", () => {
            const gcalUrl = generateGoogleCalendarLink(reminder);
            if (gcalUrl) {
                chrome.tabs.create({ url: gcalUrl });
            }
        });
        card.querySelector(".btn-edit").addEventListener("click", () => editReminder(reminder.id));
        card.querySelector(".btn-delete").addEventListener("click", () => deleteReminder(reminder.id, card));
        card.querySelector(".btn-complete").addEventListener("click", () => toggleComplete(reminder.id));

        remindersContainer.appendChild(card);
    });

    if (totalCount > visibleCount) {
        const loadMoreRow = document.createElement("div");
        loadMoreRow.className = "load-more-row";
        loadMoreRow.innerHTML = `
            <button class="btn btn-secondary" id="btn-load-more" style="width: 100%; margin-top: 10px;">
                Load More (${totalCount - visibleCount} hidden)
            </button>
        `;
        remindersContainer.appendChild(loadMoreRow);
        
        document.getElementById("btn-load-more").addEventListener("click", () => {
            visibleCount += 40;
            renderInbox();
        });
    }
}

/**
 * 4. editReminder()
 * Fills out the form and prepares UI to update a reminder.
 */
export function editReminder(id) {
    const reminder = allReminders.find(r => r.id === id);
    if (!reminder) return;

    editIdInput.value = reminder.id;
    titleInput.value = reminder.title;
    urlInput.value = reminder.url;
    dateInput.value = reminder.reminderDate;

    // Parse 24-hour stored format and map back to 12-hour selectors
    const timeParts = reminder.reminderTime.split(":");
    const hours24 = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];

    let ampm = "AM";
    let hours12 = hours24;
    if (hours24 >= 12) {
        ampm = "PM";
        if (hours24 > 12) {
            hours12 = hours24 - 12;
        }
    } else if (hours24 === 0) {
        hours12 = 12;
    }

    hourSelect.value = String(hours12);
    minuteSelect.value = minutes;
    ampmSelect.value = ampm;

    prioritySelect.value = reminder.priority;
    if (categorySelect) {
        categorySelect.value = reminder.category || "other";
    }
    notesInput.value = reminder.note || "";
    if (gcalCheckbox) gcalCheckbox.checked = false;

    if (editInfoBanner && editInfoDetails) {
        editInfoDetails.textContent = `${reminder.reminderDate} at ${formatTime12Hour(reminder.reminderTime)}`;
        editInfoBanner.classList.remove("hidden");
    }

    saveBtn.textContent = "Update Reminder";
    cancelEditBtn.classList.remove("hidden");
    switchTab("add");
}

/**
 * 5. deleteReminder()
 * Deletes a reminder from storage.
 */
export async function deleteReminder(id, card) {
    const reminder = allReminders.find(r => r.id === id);
    if (!reminder) return;

    if (!card) {
        await MarakadheyStorage.delete(id);
        await loadReminders();
        renderInbox();
        return;
    }

    const deleteBtn = card.querySelector(".btn-delete");
    if (!deleteBtn) return;

    if (deleteBtn.classList.contains("confirm-state")) {
        try {
            if (card.dataset.deleteTimeoutId) {
                clearTimeout(parseInt(card.dataset.deleteTimeoutId, 10));
            }
            card.classList.add("deleting");
            await new Promise(resolve => setTimeout(resolve, 300));
            await MarakadheyStorage.delete(id);
            await loadReminders();
            renderInbox();
        } catch (err) {
            console.error("Error deleting reminder:", err);
        }
    } else {
        deleteBtn.textContent = "Confirm?";
        deleteBtn.classList.add("confirm-state");

        const timeoutId = setTimeout(() => {
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.remove("confirm-state");
        }, 3000);

        card.dataset.deleteTimeoutId = timeoutId;
    }
}

/**
 * 6. openReminder()
 * Updates lastOpenedAt or marks completed and opens the URL.
 */
export async function openReminder(id) {
    const reminder = allReminders.find(r => r.id === id);
    if (!reminder) return;

    try {
        const settings = await MarakadheyStorage.getSettings();
        if (settings.autoComplete) {
            reminder.completed = true;
            reminder.completedAt = new Date().toISOString();
        } else {
            reminder.lastOpenedAt = new Date().toISOString();
        }
        await MarakadheyStorage.save(reminder);
        chrome.tabs.create({ url: reminder.url });
        await loadReminders();
        renderInbox();
    } catch (err) {
        console.error("Error opening reminder:", err);
    }
}

/**
 * 7. toggleComplete()
 * Toggles status between completed and pending.
 */
export async function toggleComplete(id) {
    const reminder = allReminders.find(r => r.id === id);
    if (!reminder) return;

    try {
        reminder.completed = !reminder.completed;
        if (reminder.completed) {
            reminder.completedAt = new Date().toISOString();
        } else {
            reminder.completedAt = null;
        }
        await MarakadheyStorage.save(reminder);
        await loadReminders();
        renderInbox();
    } catch (err) {
        console.error("Error toggling completion status:", err);
    }
}

/**
 * 8. updatePendingCount()
 * Updates the badge counter.
 */
export async function updatePendingCount() {
    const pendingCount = allReminders.filter(r => !r.completed).length;
    pendingCountBadge.textContent = pendingCount;
}

/**
 * 9. searchReminders()
 * Updates filters query and updates list rendering.
 */
export function searchReminders(query) {
    searchQuery = query.toLowerCase().trim();
    visibleCount = 40;
    if (searchQuery) {
        searchClearBtn.classList.remove("hidden");
    } else {
        searchClearBtn.classList.add("hidden");
    }
    renderInbox();
}

/**
 * 10. filterReminders()
 * Updates filter pills selection state.
 */
export function filterReminders(filterType) {
    activeFilter = filterType;
    renderInbox();
}

/**
 * 11. sortReminders()
 * Triggers list re-sort based on select input value.
 */
export function sortReminders(sortBy) {
    sortSelect.value = sortBy;
    renderInbox();
}

/**
 * 12. renderDashboard()
 * Computes analytics and distribution rates for the Dashboard view.
 */
export function renderDashboard() {
    resetDashboardBars();

    const total = allReminders.length;
    const completed = allReminders.filter(r => r.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let overdue = 0;
    let today = 0;
    let upcoming = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    const categoryCounts = {
        internship: 0,
        job: 0,
        scholarship: 0,
        webinar: 0,
        hackathon: 0,
        certification: 0,
        personal: 0,
        other: 0
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");
    const localToday = `${currentYear}-${currentMonth}-${currentDay}`;

    allReminders.forEach((r) => {
        if (r.priority === "high") high++;
        else if (r.priority === "medium") medium++;
        else if (r.priority === "low") low++;

        const cat = r.category || "other";
        if (categoryCounts[cat] !== undefined) {
            categoryCounts[cat]++;
        } else {
            categoryCounts.other++;
        }

        if (!r.completed) {
            const deadline = parseLocalDateTime(r.reminderDate, r.reminderTime);
            if (deadline < now) {
                overdue++;
            } else if (r.reminderDate === localToday) {
                today++;
            } else {
                upcoming++;
            }
        }
    });

    // 1. Summary stats
    dbTotalCount.textContent = total;
    dbPendingCount.textContent = pending;
    dbCompletedCount.textContent = completed;
    dbCompletionPct.textContent = `${completionRate}%`;

    // 2. Next deadline calculation
    const activeUpcoming = allReminders.filter(r => {
        if (r.completed) return false;
        const deadline = parseLocalDateTime(r.reminderDate, r.reminderTime);
        return deadline >= now;
    });

    if (activeUpcoming.length > 0) {
        activeUpcoming.sort((a, b) => {
            return parseLocalDateTime(a.reminderDate, a.reminderTime) - parseLocalDateTime(b.reminderDate, b.reminderTime);
        });
        const nextEvent = activeUpcoming[0];
        const displayDateTime = formatCardDate(nextEvent.reminderDate, nextEvent.reminderTime);
        nextDeadlineTitle.textContent = nextEvent.title;
        nextDeadlineDate.textContent = displayDateTime;
        dbNextDeadlineCard.classList.remove("hidden");
    } else {
        nextDeadlineTitle.textContent = "No upcoming deadlines";
        nextDeadlineDate.textContent = "-";
    }

    valOverdue.textContent = overdue;
    valToday.textContent = today;
    valUpcoming.textContent = upcoming;

    valHigh.textContent = high;
    valMedium.textContent = medium;
    valLow.textContent = low;

    // 3. Category distribution layout update
    dbCategoryContainer.innerHTML = "";
    const maxCatCount = Math.max(...Object.values(categoryCounts), 1);
    
    Object.entries(categoryCounts).forEach(([catName, count]) => {
        const row = document.createElement("div");
        row.className = "chart-row";
        const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
        
        row.innerHTML = `
            <span class="chart-row-label">${displayName}</span>
            <div class="chart-bar-container">
                <div class="chart-bar category-bar" id="bar-cat-${catName}" style="width: 0%"></div>
            </div>
            <span class="chart-row-val">${count}</span>
        `;
        dbCategoryContainer.appendChild(row);
    });

    setTimeout(() => {
        dbProgressFill.style.width = `${completionRate}%`;

        const maxUrgency = Math.max(overdue, today, upcoming, 1);
        barOverdue.style.width = `${(overdue / maxUrgency) * 100}%`;
        barToday.style.width = `${(today / maxUrgency) * 100}%`;
        barUpcoming.style.width = `${(upcoming / maxUrgency) * 100}%`;

        const maxPriority = Math.max(high, medium, low, 1);
        barHigh.style.width = `${(high / maxPriority) * 100}%`;
        barMedium.style.width = `${(medium / maxPriority) * 100}%`;
        barLow.style.width = `${(low / maxPriority) * 100}%`;

        // Fill category bars
        Object.entries(categoryCounts).forEach(([catName, count]) => {
            const bar = document.getElementById(`bar-cat-${catName}`);
             if (bar) {
                 bar.style.width = `${(count / maxCatCount) * 100}%`;
             }
        });
    }, 50);
}

function resetDashboardBars() {
    dbProgressFill.style.width = "0%";
    barOverdue.style.width = "0%";
    barToday.style.width = "0%";
    barUpcoming.style.width = "0%";
    barHigh.style.width = "0%";
    barMedium.style.width = "0%";
    barLow.style.width = "0%";
    
    const catBars = dbCategoryContainer.querySelectorAll(".category-bar");
    catBars.forEach(b => b.style.width = "0%");
}

// Bind to window for global namespace test visibility
window.loadReminders = loadReminders;
window.saveReminder = saveReminder;
window.renderInbox = renderInbox;
window.editReminder = editReminder;
window.deleteReminder = deleteReminder;
window.openReminder = openReminder;
window.toggleComplete = toggleComplete;
window.updatePendingCount = updatePendingCount;
window.searchReminders = searchReminders;
window.filterReminders = filterReminders;
window.sortReminders = sortReminders;
window.renderDashboard = renderDashboard;
