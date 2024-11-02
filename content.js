// All selectors used by the extension
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
  globalNav: '#global-nav',
  zenModeExclude: `
    .share-box-feed-entry__content, 
    .ql-editor,
    .share-creation-state__main-container,
    .share-box-feed-entry,
    .share-box__scrollable-content
  `,
  mediaContent: `
    /* Articles with images */
    .update-components-article,
    .update-components-article__image-link,
    .update-components-article--with-large-image,
    .update-components-article__description-container,
    
    /* Videos */
    .ember-view.video-js,
    [data-vjs-player],
    .vjs-tech,
    .media-player__player,
    .video-main-container,
    
    /* Documents/Carousel */
    .update-components-document__container,
    .document-s-container,
    .carousel-container,
    
    /* General media containers */
    .feed-shared-update-v2__content img,
    .feed-shared-update-v2__content video,
    .feed-shared-image__container,
    .feed-shared-video__container,
    .feed-shared-linkedin-video__container,
    .feed-shared-external-video__container,
    .feed-shared-carousel__content,
    .feed-shared-article__preview-container,
    .update-components-image,
    .video-container,
    
    /* Additional containers */
    .feed-shared-update-v2__content .update-components-image,
    .feed-shared-update-v2__content .update-components-video,
    .feed-shared-update-v2__content .update-components-document,
    div[class*="feed-shared"][class*="image"],
    div[class*="feed-shared"][class*="video"],
    div[class*="feed-shared"][class*="document"]
  `
};

// Keep track of active observers
let observers = new Map();
let zenModeActive = false;

// Function to hide elements
function hideElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    if (element) {
      element.style.display = 'none';
    }
  });
}

// Function to show elements
function showElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    if (element) {
      element.style.display = '';
    }
  });
}

// Function to handle media content
function handleMediaContent(mutations) {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        // Find and hide all media elements
        const mediaElements = node.querySelectorAll(SELECTORS.mediaContent);
        mediaElements.forEach(element => {
          // Hide the element
          element.style.display = 'none';
          
          // Also hide parent container if it's a media wrapper
          let parent = element.parentElement;
          while (parent && !parent.classList.contains('feed-shared-update-v2')) {
            if (parent.classList.contains('update-components-article') || 
                parent.classList.contains('document-s-container') ||
                parent.classList.contains('video-js') ||
                parent.classList.contains('update-components-image') ||
                parent.classList.contains('update-components-video') ||
                parent.classList.contains('update-components-document')) {
              parent.style.display = 'none';
            }
            parent = parent.parentElement;
          }
        });

        // Direct handling for video players
        const videoPlayers = node.querySelectorAll('[data-vjs-player], .video-js');
        videoPlayers.forEach(player => {
          player.style.display = 'none';
          const parentContainer = player.closest('.feed-shared-update-v2__content');
          if (parentContainer) {
            const mediaWrapper = parentContainer.querySelector('.video-container');
            if (mediaWrapper) {
              mediaWrapper.style.display = 'none';
            }
          }
        });
      }
    });
  });
}

// Function to start observing changes
function startObserving(featureType) {
  stopObserving(featureType);

  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const observer = new MutationObserver(function(mutations) {
    if (featureType === 'zenMode') {
      applyZenMode();
    } else if (featureType === 'mediaContent') {
      handleMediaContent(mutations);
      // Also immediately hide any existing media content
      hideElements(SELECTORS.mediaContent);
    } else {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          hideElements(SELECTORS[featureType]);
        }
      });
    }
  });

  observer.observe(targetNode, config);
  observers.set(featureType, observer);
}

// Function to stop observing changes
function stopObserving(featureType) {
  const observer = observers.get(featureType);
  if (observer) {
    observer.disconnect();
    observers.delete(featureType);
  }
}

// Apply Zen Mode
function applyZenMode() {
  const excludeSelectors = Object.keys(SELECTORS)
    .filter(key => key !== 'zenModeExclude' && key !== 'globalNav')
    .map(key => SELECTORS[key])
    .join(', ');

  hideElements(excludeSelectors);
  hideElements(SELECTORS.globalNav);

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
  Object.keys(SELECTORS)
    .filter(key => key !== 'zenModeExclude' && key !== 'globalNav')
    .forEach(key => {
      showElements(SELECTORS[key]);
    });

  showElements(SELECTORS.globalNav);

  const postWriterElements = document.querySelectorAll(SELECTORS.zenModeExclude);
  postWriterElements.forEach(el => {
    el.style.cssText = '';
  });
}

// Initialize media content hiding
function initializeMediaContent() {
  hideElements(SELECTORS.mediaContent);
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
    } else if (elementType === 'mediaContent') {
      if (hidden) {
        startObserving('mediaContent');
        initializeMediaContent();
      } else {
        stopObserving('mediaContent');
        showElements(SELECTORS.mediaContent);
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
    
    if (zenModeActive) {
      removeZenMode();
      zenModeActive = false;
    }

    Object.values(SELECTORS).forEach(selector => {
      showElements(selector);
    });
  }
});

// Apply saved settings on page load
chrome.storage.sync.get(null, (settings) => {
  if (settings.extensionEnabledHidden !== false) {
    Object.keys(settings).forEach(key => {
      if (key.endsWith('Hidden') && settings[key] === true) {
        const elementType = key.replace('Hidden', '');
        if (SELECTORS[elementType]) {
          if (elementType === 'zenMode') {
            zenModeActive = true;
            startObserving('zenMode');
            applyZenMode();
          } else if (elementType === 'mediaContent') {
            startObserving('mediaContent');
            initializeMediaContent();
          } else {
            startObserving(elementType);
            hideElements(SELECTORS[elementType]);
          }
        }
      }
    });
  }
});