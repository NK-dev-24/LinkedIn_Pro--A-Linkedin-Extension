// Constants
const CONFIG = {
  VERSION: "1.0.0",
  GITHUB_REPO: "https://github.com/NK-dev-24/Li-Focus---A-Linkedin-Extension",
  FEEDBACK_FORM:
    "https://docs.google.com/forms/d/e/1FAIpQLSevtYtDfXoiUBfl4NM6Ryb8Lfehmv0MYKaNaMHmDBUW_z5Afw/viewform?usp=sf_link",
  DEFAULT_SETTINGS: {
    extensionEnabled: true,
    darkMode: true,
  },
};

const FEATURES = [
  "extensionEnabled",
  "homeFeed",
  // "mediaContent",
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
  resetButton: document.getElementById("resetButton"),
};

function enhanceAccessibility() {
  elements.powerButton.setAttribute("aria-label", "Toggle Extension On/Off");
  elements.themeToggle.setAttribute(
    "aria-label",
    "Switch between light and dark mode"
  );
}

// Initialize navbar toggle buttons with proper state persistence
function initializeNavbarToggles() {
  NAVBAR_FEATURES.forEach((feature) => {
    const button = document.getElementById(feature);
    if (button) {
      chrome.storage.sync.get(feature + "Hidden", (result) => {
        const isHidden = result[feature + "Hidden"] === true;
        button.classList.toggle("active", isHidden);
        if (isHidden) {
          button.setAttribute("aria-pressed", "true");
        }
      });

      button.addEventListener("click", () => {
        const isHidden = button.classList.toggle("active");
        button.setAttribute("aria-pressed", isHidden.toString());
        chrome.storage.sync.set({
          [feature + "Hidden"]: isHidden,
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab?.id && activeTab.url?.includes("linkedin.com")) {
            chrome.tabs
              .sendMessage(activeTab.id, {
                type: "toggleElement",
                elementType: feature,
                hidden: isHidden,
              })
              .catch(() => {
                // Ignore connection error
                console.log(
                  "Not on LinkedIn page or content script not loaded"
                );
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
    FEATURES.forEach((feature) => {
      const element = document.getElementById(feature);
      if (element) {
        const isEnabled = settings[`${feature}Hidden`] === true;
        element.checked = isEnabled;
      }
    });

    const extensionEnabled = settings.extensionEnabledHidden !== false;
    updatePowerState(extensionEnabled);

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

  chrome.storage.sync.set({
    extensionEnabledHidden: isEnabled,
  });
}

function toggleFeature(feature, enabled) {
  chrome.storage.sync.set({
    [`${feature}Hidden`]: enabled,
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab?.id && activeTab.url?.includes("linkedin.com")) {
      chrome.tabs
        .sendMessage(activeTab.id, {
          type: "toggleElement",
          elementType: feature,
          hidden: enabled,
        })
        .catch(() => {
          // Ignore connection error
          console.log("Not on LinkedIn page or content script not loaded");
        });
    }
  });
}

// Event Listeners
function initializeEventListeners() {
  // Feature toggles with label click support
  FEATURES.forEach((feature) => {
    const element = document.getElementById(feature);
    if (element) {
      // Find the parent toggle-item
      const toggleItem = element.closest(".toggle-item");
      if (toggleItem) {
        const label = toggleItem.querySelector(".toggle-label");

        // Add click handler to the label
        label.addEventListener("click", (e) => {
          // Prevent default if clicking on the info icon
          if (e.target.classList.contains("info-icon")) {
            return;
          }
          element.checked = !element.checked;
          toggleFeature(feature, element.checked);
        });

        // Add click handler to the checkbox
        element.addEventListener("change", (e) => {
          toggleFeature(feature, e.target.checked);
        });
      }
    }
  });

  elements.powerButton.addEventListener("click", () => {
    const isEnabled = !elements.powerButton.classList.contains("inactive");
    updatePowerState(!isEnabled);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id && activeTab.url?.includes("linkedin.com")) {
        chrome.tabs
          .sendMessage(activeTab.id, {
            type: !isEnabled ? "enableExtension" : "resetAll",
          })
          .catch(() => {
            // Ignore connection error
            console.log("Not on LinkedIn page or content script not loaded");
          });
      }
    });
  });

  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.feedbackBtn.addEventListener("click", () => {
    window.open(CONFIG.FEEDBACK_FORM, "_blank");
  });

  elements.githubBtn.addEventListener("click", () => {
    window.open(CONFIG.GITHUB_REPO, "_blank");
  });

  elements.resetButton.addEventListener("click", () => {
    resetAllSettings();
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
  // Initialize core functionality
  initializeTheme();
  loadSavedSettings();
  initializeNavbarToggles();
  initializeEventListeners();
  enhanceAccessibility();
});

function resetAllSettings() {
  // Reset all feature toggles
  FEATURES.forEach((feature) => {
    const element = document.getElementById(feature);
    if (element) {
      element.checked = false;
      toggleFeature(feature, false);
    }
  });

  // Reset all navbar toggles
  NAVBAR_FEATURES.forEach((feature) => {
    const button = document.getElementById(feature);
    if (button) {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
      chrome.storage.sync.set({
        [feature + "Hidden"]: false,
      });
    }
  });

  // Enable extension if disabled
  updatePowerState(true);

  // Send reset message to content script only if we're on a LinkedIn page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab?.id && activeTab.url?.includes("linkedin.com")) {
      chrome.tabs
        .sendMessage(activeTab.id, {
          type: "resetAll",
        })
        .catch(() => {
          // Ignore connection error - this means we're not on a LinkedIn page
          console.log("Not on LinkedIn page or content script not loaded");
        });
    }
  });
}
