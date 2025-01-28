// Constants
const GITHUB_REPO =
  "https://github.com/NK-dev-24/Li-Focus---A-Linkedin-Extension";
const FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSevtYtDfXoiUBfl4NM6Ryb8Lfehmv0MYKaNaMHmDBUW_z5Afw/viewform?usp=sf_link";

const EXTENSION_VERSION = '1.0.0';

const FEATURES = [
  "extensionEnabled",
  "homeFeed",
  "mediaContent",
  // "promotedAndAds", // Commented out to preserve other features
  "notificationCount",
  "messagingSection",
  "rightSidebar",
  "leftSidebar",
  "zenMode",
];

const NAVBAR_FEATURES = [
  "hideHomeIcon",
  "hideNetworkIcon",
  "hideJobsIcon",
  "hideMessagingIcon",
  "hideNotificationsIcon",
  "hideMeIcon",
  "hideBusinessIcon",
];

// DOM Elements
const elements = {
  themeToggle: document.getElementById("themeToggle"),
  powerButton: document.getElementById("powerButton"),
  extensionContent: document.getElementById("extensionContent"),
  feedbackBtn: document.getElementById("feedbackBtn"),
  githubBtn: document.getElementById("githubBtn"),
  sections: document.querySelectorAll(".section"),
};

// Initialize navbar toggle buttons with proper state persistence
function initializeNavbarToggles() {
  NAVBAR_FEATURES.forEach((feature) => {
    const button = document.getElementById(feature);
    if (button) {
      // Load saved state
      chrome.storage.sync.get(feature + "Hidden", (result) => {
        const isHidden = result[feature + "Hidden"] === true;
        button.classList.toggle("active", isHidden);

        // Ensure the visual state matches the stored state
        if (isHidden) {
          button.setAttribute("aria-pressed", "true");
        }
      });

      // Add click handler
      button.addEventListener("click", () => {
        const isHidden = button.classList.toggle("active");
        button.setAttribute("aria-pressed", isHidden.toString());

        // Save state
        chrome.storage.sync.set({
          [feature + "Hidden"]: isHidden,
        });

        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "toggleElement",
              elementType: feature,
              hidden: isHidden,
            });
          }
        });
      });
    }
  });
}

// Feature Management
function loadSavedSettings() {
  chrome.storage.sync.get(null, (settings) => {
    // Load feature toggles
    FEATURES.forEach((feature) => {
      const element = document.getElementById(feature);
      if (element) {
        const isEnabled = settings[`${feature}Hidden`] === true;
        
        // Special handling for zen mode
        if (feature === "zenMode") {
          element.checked = isEnabled;
          if (isEnabled) {
            // Ensure zen mode is properly applied
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: "toggleElement",
                  elementType: "zenMode",
                  hidden: true
                });
              }
            });
          }
        } else {
          // Handle other features
          if (element.type === "checkbox") {
            element.checked = isEnabled;
          } else {
            element.classList.toggle("active", isEnabled);
          }
        }
      }
    });

    // Handle extension power state
    const extensionEnabled = settings.extensionEnabledHidden !== false;
    updatePowerState(extensionEnabled);

    // Ensure visual states are consistent
    elements.sections.forEach((section) => {
      const toggles = section.querySelectorAll(
        '.toggle-button, input[type="checkbox"]'
      );
      toggles.forEach((toggle) => {
        const featureId = toggle.id;
        const isEnabled = settings[`${featureId}Hidden`] === true;

        if (toggle.type === "checkbox") {
          toggle.checked = isEnabled;
        } else {
          toggle.classList.toggle("active", isEnabled);
        }
      });
    });
  });
}

function updatePowerState(isEnabled) {
  elements.powerButton.classList.toggle("inactive", !isEnabled);
  elements.extensionContent.classList.toggle("disabled", !isEnabled);
  elements.sections.forEach((section) => {
    section.classList.toggle("disabled", !isEnabled);
  });

  // Save power state
  chrome.storage.sync.set({
    extensionEnabledHidden: isEnabled,
  });
}

function toggleFeature(feature, enabled) {
  // Save state immediately
  chrome.storage.sync.set({
    [`${feature}Hidden`]: enabled,
  });

  // Update content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab?.id) {
      chrome.tabs.sendMessage(activeTab.id, {
        type: "toggleElement",
        elementType: feature,
        hidden: enabled,
      });
    }
  });
}

// Event Listeners
function initializeEventListeners() {
  // Feature toggles
  FEATURES.forEach((feature) => {
    const element = document.getElementById(feature);
    if (element) {
      element.addEventListener("change", (e) => {
        const isEnabled =
          e.target.type === "checkbox"
            ? e.target.checked
            : e.target.classList.contains("active");
        toggleFeature(feature, isEnabled);
      });
    }
  });

  // Power button
  elements.powerButton.addEventListener("click", () => {
    const isEnabled = !elements.powerButton.classList.contains("inactive");
    updatePowerState(!isEnabled);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: !isEnabled ? "enableExtension" : "resetAll",
        });
      }
    });
  });

  // Theme toggle
  elements.themeToggle.addEventListener("click", toggleTheme);

  // Footer buttons
  elements.feedbackBtn.addEventListener("click", () => {
    window.open(FORM, "_blank");
  });

  elements.githubBtn.addEventListener("click", () => {
    window.open(GITHUB_REPO, "_blank");
  });
}

// Theme Management
function initializeTheme() {
  chrome.storage.sync.get("darkMode", (result) => {
    const prefersDark =
      result.darkMode ??
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.toggle("dark", prefersDark);
    updateThemeToggleIcon(prefersDark);
  });
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  updateThemeToggleIcon(isDark);
  chrome.storage.sync.set({ darkMode: isDark });
}

function updateThemeToggleIcon(isDark) {
  elements.themeToggle.innerHTML = isDark
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  loadSavedSettings();
  initializeNavbarToggles();
  initializeEventListeners();
});
