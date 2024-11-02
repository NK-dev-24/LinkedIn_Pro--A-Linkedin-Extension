// Store IDs of all features that can be toggled
const FEATURE_IDS = [
    'extensionEnabled',
    'zenMode',
    'homeFeed',
    'mediaContent',
    'rightSidebar',
    'leftSidebar',
    'adBanners',
    'engagementSection',
    'notificationCount',
    'messagingSection'
  ];
  
  // Function to save toggle state and notify content script
  function saveToggleState(elementId, checked) {
    // Create setting object
    const setting = {};
    setting[elementId + 'Hidden'] = checked;
    
    // Save to chrome storage
    chrome.storage.sync.set(setting);
    
    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'toggleElement',
          elementType: elementId,
          hidden: checked
        });
      }
    });
  }
  
  // Function to reset all features
  function resetAllFeatures(toggles) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'resetAll'
        });
      }
    });
    
    // Uncheck all toggles except extension enabled
    toggles.forEach(toggle => {
      if (toggle.id !== 'extensionEnabled') {
        toggle.checked = false;
        saveToggleState(toggle.id, false);
      }
    });
  }
  
  // Function to handle Zen Mode
  function handleZenMode(checked, toggles) {
    if (checked) {
      // When Zen Mode is enabled, disable other toggles
      toggles.forEach(toggle => {
        if (toggle.id !== 'extensionEnabled' && toggle.id !== 'zenMode') {
          toggle.checked = false;
          saveToggleState(toggle.id, false);
        }
      });
    }
  }
  
  // Initialize popup when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Get all toggle switches
    const toggles = FEATURE_IDS.map(id => document.getElementById(id));
    
    // Load saved settings
    chrome.storage.sync.get(null, function(settings) {
      toggles.forEach(toggle => {
        if (toggle) {
          const settingKey = toggle.id + 'Hidden';
          toggle.checked = settings[settingKey] || false;
          
          // Add change listener
          toggle.addEventListener('change', function() {
            if (toggle.id === 'extensionEnabled') {
              // Handle main toggle
              if (!toggle.checked) {
                resetAllFeatures(toggles);
              }
            } else if (toggle.id === 'zenMode') {
              // Handle Zen Mode
              handleZenMode(toggle.checked, toggles);
            }
            
            // Save state for any toggle change
            saveToggleState(toggle.id, toggle.checked);
          });
        }
      });
    });
  });