// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Master toggle functionality
  const masterToggle = document.getElementById('masterToggle');
  const allToggles = document.querySelectorAll('input[type="checkbox"]:not(#masterToggle)');

  // Load master toggle state
  chrome.storage.sync.get('extensionEnabled', function(result) {
    masterToggle.checked = result.extensionEnabled !== false;
    setTogglesState(masterToggle.checked);
  });

  // Master toggle event listener
  masterToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    setTogglesState(isEnabled);
    chrome.storage.sync.set({ extensionEnabled: isEnabled });
    
    // If disabling, show all hidden elements
    if (!isEnabled) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'resetAll'
        });
      });
    }
  });

  function setTogglesState(enabled) {
    allToggles.forEach(toggle => {
      toggle.disabled = !enabled;
      toggle.parentElement.style.opacity = enabled ? '1' : '0.5';
    });
  }

  // Individual toggles functionality
  const toggles = {
    'homeFeed': 'Home Feed',
    'rightSidebar': 'Right Sidebar',
    'connectionSuggestions': 'Connection Suggestions',
    'engagementSection': 'Post Engagements',
    'promotedPosts': 'Promoted Posts',
    'jobSuggestions': 'Job Suggestions',
    'adBanners': 'Advertisements',
    'networkPanel': 'Network Panel',
    'premiumUpsell': 'Premium Promotions',
    'notificationCount': 'Notification Counts',
    'messagingSection': 'Messaging Section'
  };

  Object.keys(toggles).forEach(toggleId => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      // Load saved state
      const savedKey = `${toggleId}Hidden`;
      chrome.storage.sync.get(savedKey, function(result) {
        toggle.checked = result[savedKey] || false;
      });

      // Add change listener
      toggle.addEventListener('change', function() {
        if (!masterToggle.checked) return;

        const isHidden = this.checked;
        const settings = { [savedKey]: isHidden };
        
        chrome.storage.sync.set(settings);
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'toggleElement',
            elementType: toggleId,
            hidden: isHidden
          });
        });
      });
    }
  });
});