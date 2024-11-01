// Saves the toggle state to chrome.storage and sends message to content script
function saveToggleState(elementId, checked) {
  const setting = {};
  setting[elementId + 'Hidden'] = checked;
  
  chrome.storage.sync.set(setting);
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
          type: 'toggleElement',
          elementType: elementId,
          hidden: checked
      });
  });
}

// Initialize popup with saved settings
document.addEventListener('DOMContentLoaded', function() {
  // Get all toggle inputs
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  
  // Load saved settings for each toggle
  chrome.storage.sync.get(null, function(settings) {
      toggles.forEach(toggle => {
          const settingKey = toggle.id + 'Hidden';
          toggle.checked = settings[settingKey] || false;
          
          // Add change listener
          toggle.addEventListener('change', function() {
              if (toggle.id === 'extensionEnabled') {
                  // If main toggle is turned off, reset all features
                  if (!toggle.checked) {
                      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                          chrome.tabs.sendMessage(tabs[0].id, {
                              type: 'resetAll'
                          });
                      });
                      
                      // Uncheck all other toggles
                      toggles.forEach(t => {
                          if (t.id !== 'extensionEnabled') {
                              t.checked = false;
                              saveToggleState(t.id, false);
                          }
                      });
                  }
              }
              
              saveToggleState(toggle.id, toggle.checked);
          });
      });
  });
});