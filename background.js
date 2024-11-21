chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-zen-mode") {
    chrome.storage.sync.get(["zenModeHidden"], (result) => {
      const newState = !result.zenModeHidden;
      chrome.storage.sync.set({ zenModeHidden: newState });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "toggleElement",
          elementType: "zenMode",
          hidden: newState,
        });
      });
    });
  } else if (command === "toggle-extension") {
    chrome.storage.sync.get(["extensionEnabledHidden"], (result) => {
      const newState = !result.extensionEnabledHidden;
      chrome.storage.sync.set({ extensionEnabledHidden: newState });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: newState ? "enableExtension" : "resetAll",
        });
      });
    });
  }
});
