// content.js
const SELECTORS = {
  homeFeed: '.feed-shared-update-v2',
  promotedPosts: 'div[class*="feed-shared-update-v2"]:has(span:contains("Promoted"))',
  connectionSuggestions: 'div[class*="feed-shared-update-v2"]:has(span:contains("Suggested"))',
  jobSuggestions: 'div[class*="feed-shared-update-v2"]:has(span:contains("Jobs"))',
  rightSidebar: '.scaffold-layout__aside',
  engagementSection: '.social-details-social-counts',
  adBanners: '.ad-banner-container',
  networkPanel: '.mn-discovery-cohort',
  premiumUpsell: '.premium-upsell-link',
  notificationCount: '.notification-badge',
  messagingSection: '.msg-overlay-list-bubble'
};

// Keep track of active observers
let observers = new Map();

// Function to hide elements by selector
function hideElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    element.style.display = 'none';
  });
}

// Function to show elements by selector
function showElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    element.style.display = '';
  });
}

// Function to start observing changes for a specific feature
function startObserving(featureType) {
  // Stop existing observer if any
  stopObserving(featureType);

  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        hideElements(SELECTORS[featureType]);
      }
    });
  });

  observer.observe(targetNode, config);
  observers.set(featureType, observer);
}

// Function to stop observing changes for a specific feature
function stopObserving(featureType) {
  const observer = observers.get(featureType);
  if (observer) {
    observer.disconnect();
    observers.delete(featureType);
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'toggleElement') {
    const { elementType, hidden } = request;
    
    if (hidden) {
      startObserving(elementType);
      hideElements(SELECTORS[elementType]);
    } else {
      stopObserving(elementType);
      showElements(SELECTORS[elementType]);
    }
  } else if (request.type === 'resetAll') {
    // Stop all observers
    observers.forEach((observer, type) => {
      stopObserving(type);
    });
    // Show all elements
    Object.values(SELECTORS).forEach(selector => {
      showElements(selector);
    });
  }
});

// Apply saved settings on page load
chrome.storage.sync.get(null, (settings) => {
  if (settings.extensionEnabled !== false) {
    Object.keys(settings).forEach(key => {
      if (key.endsWith('Hidden') && settings[key] === true) {
        const elementType = key.replace('Hidden', '');
        if (SELECTORS[elementType]) {
          startObserving(elementType);
          hideElements(SELECTORS[elementType]);
        }
      }
    });
  }
});