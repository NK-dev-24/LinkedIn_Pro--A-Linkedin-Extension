const SELECTORS = {
  homeFeed: `
    .feed-shared-update-v2,
    .scaffold-finite-scroll__content,
    button[class*="artdeco-button--secondary"][class*="scaffold-finite-scroll"],
    div[class*="sort-dropdown"],
    div[class="display-flex p5"],
    button[class*="artdeco-dropdown__trigger"],
    .feed-shared-update-v2__description-wrapper,
    .artdeco-dropdown__trigger--placement-bottom,
    .feed-index-sort-border,
    button[aria-expanded][id^="ember"][class*="artdeco-dropdown__trigger"],
    .artdeco-dropdown.mb2[id^="ember"],
    div[class="artdeco-dropdown artdeco-dropdown--placement-bottom artdeco-dropdown--justification-right ember-view"],
    button[class*="artdeco-dropdown__trigger"][class*="full-width"][class*="display-flex"]
  `,  // Added specific selectors for sort by dropdown and new post button
  rightSidebar: '.scaffold-layout__aside',
  leftSidebar: '.scaffold-layout__sidebar, .profile-rail-card',  // Only hide sidebar content, not nav
  engagementSection: '.social-details-social-counts',
  adBanners: '.ad-banner-container',
  notificationCount: '.notification-badge',
  messagingSection: '.msg-overlay-list-bubble'
};

// Keep track of active observers
let observers = new Map();

// Function to hide elements by selector
function hideElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    if (element) {
      element.style.display = 'none';
    }
  });
}

// Function to show elements by selector
function showElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    if (element) {
      element.style.display = '';
    }
  });
}

// Function to start observing changes for a specific feature
function startObserving(featureType) {
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
    observers.forEach((observer, type) => {
      stopObserving(type);
    });
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