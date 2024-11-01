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
  `,  
  rightSidebar: '.scaffold-layout__aside',
  leftSidebar: '.scaffold-layout__sidebar, .profile-rail-card',  
  engagementSection: '.social-details-social-counts',
  adBanners: '.ad-banner-container',
  notificationCount: '.notification-badge',
  messagingSection: '.msg-overlay-list-bubble',
  zenModeExclude: `
    .share-box-feed-entry__content, 
    .ql-editor,
    .share-creation-state__main-container,
    .share-box-feed-entry,
    .share-box__scrollable-content
  `
};

// Keep track of active observers
let observers = new Map();
let zenModeActive = false;

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
        if (featureType === 'zenMode') {
          applyZenMode();
        } else {
          hideElements(SELECTORS[featureType]);
        }
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

// Apply Zen Mode
function applyZenMode() {
  // Hide everything except post writer
  const excludeSelectors = Object.keys(SELECTORS)
    .filter(key => key !== 'zenModeExclude')
    .map(key => SELECTORS[key])
    .join(', ');

  hideElements(excludeSelectors);

  // Highlight post writer with orange border
  const postWriterElements = document.querySelectorAll(SELECTORS.zenModeExclude);
  postWriterElements.forEach(el => {
    el.style.transition = 'all 0.3s ease';
    el.style.border = '3px solid orange';
    el.style.margin = '10px';
    el.style.borderRadius = '8px';
    el.style.padding = '10px';
    el.style.backgroundColor = 'white';
    el.style.position = 'fixed';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.zIndex = '9999';
    el.style.maxWidth = '80%';
    el.style.maxHeight = '80%';
    el.style.overflow = 'auto';
    el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  });
}

// Remove Zen Mode styling
function removeZenMode() {
  // Restore visibility of all elements
  Object.keys(SELECTORS)
    .filter(key => key !== 'zenModeExclude')
    .forEach(key => {
      showElements(SELECTORS[key]);
    });

  // Remove orange border and styling
  const postWriterElements = document.querySelectorAll(SELECTORS.zenModeExclude);
  postWriterElements.forEach(el => {
    el.style.transition = '';
    el.style.border = '';
    el.style.margin = '';
    el.style.borderRadius = '';
    el.style.padding = '';
    el.style.backgroundColor = '';
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    el.style.transform = '';
    el.style.zIndex = '';
    el.style.maxWidth = '';
    el.style.maxHeight = '';
    el.style.overflow = '';
    el.style.boxShadow = '';
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'toggleElement') {
    const { elementType, hidden } = request;
    
    if (elementType === 'zenMode') {
      zenModeActive = hidden;
      if (hidden) {
        startObserving('zenMode');
        applyZenMode();
      } else {
        stopObserving('zenMode');
        removeZenMode();
      }
    } else {
      if (hidden) {
        startObserving(elementType);
        hideElements(SELECTORS[elementType]);
      } else {
        stopObserving(elementType);
        showElements(SELECTORS[elementType]);
      }
    }
  } else if (request.type === 'resetAll') {
    observers.forEach((observer, type) => {
      stopObserving(type);
    });
    
    // Remove Zen Mode if active
    if (zenModeActive) {
      removeZenMode();
      zenModeActive = false;
    }

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
          if (elementType === 'zenMode') {
            zenModeActive = true;
            startObserving('zenMode');
            applyZenMode();
          } else {
            startObserving(elementType);
            hideElements(SELECTORS[elementType]);
          }
        }
      }
    });
  }
});