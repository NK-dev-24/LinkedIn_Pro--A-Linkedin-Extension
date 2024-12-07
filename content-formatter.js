const formatter = {
  symbols: [
    { symbol: "○", label: "Hollow circle" },
    { symbol: "●", label: "Large solid dot" },
    { symbol: "•", label: "Small solid dot" },
    { symbol: "■", label: "Black square" },
    { symbol: "▪", label: "Small black square" },
    { symbol: "✦", label: "Star bullet" },
    { symbol: "➤", label: "Right-pointing triangle" },
    { symbol: "→", label: "Arrow" },
    { symbol: "➡️", label: "Right arrow with blue BG" },
  ],

  init() {
    this.injectFormatButtons();
    this.setupMutationObserver();
    this.setupClickOutsideHandler();
    this.setupKeyboardShortcuts();
    this.injectCharacterCounter();
  },

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only handle if we're in a contenteditable area
      if (!e.target.matches('[contenteditable="true"]')) return;

      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        // metaKey for Mac support
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            this.applyFormat("bold");
            break;
          case "i":
            e.preventDefault();
            this.applyFormat("italic");
            break;
          case "u":
            e.preventDefault();
            this.applyFormat("underline");
            break;
        }
      }
    });
  },

  injectFormatButtons() {
    const targetContainer = document.querySelector(
      ".share-creation-state__footer"
    );
    if (!targetContainer) return;

    if (targetContainer.querySelector(".li-focus-format-buttons")) return;

    const formatButtons = document.createElement("div");
    formatButtons.className = "li-focus-format-buttons";

    const buttons = [
      { format: "bold", label: "B", tooltip: "Bold (Ctrl+B)" },
      { format: "italic", label: "I", tooltip: "Italic (Ctrl+I)" },
      { format: "underline", label: "U", tooltip: "Underline (Ctrl+U)" },
      { format: "bullet-list", label: "⋮≡", tooltip: "Bullet List" },
      { format: "number-list", label: "123", tooltip: "Numbered List" },
      { format: "symbols", label: "S >", tooltip: "Insert Symbol" },
    ];

    buttons.forEach(({ format, label, tooltip }) => {
      const button = document.createElement("button");
      button.className = "li-focus-format-btn";
      button.setAttribute("data-format", format);
      button.textContent = label;

      const tooltipDiv = document.createElement("div");
      tooltipDiv.className = "li-focus-tooltip top";
      tooltipDiv.textContent = tooltip;
      button.appendChild(tooltipDiv);

      if (format === "symbols") {
        button.addEventListener("click", () => this.toggleSymbolsPanel(button));
        this.createSymbolsPanel(button);
      } else {
        button.addEventListener("click", () => this.applyFormat(format));
      }

      formatButtons.appendChild(button);
    });

    targetContainer.insertBefore(formatButtons, targetContainer.firstChild);
  },

  createSymbolsPanel(button) {
    const panel = document.createElement("div");
    panel.className = "li-focus-symbols-panel";

    this.symbols.forEach(({ symbol, label }) => {
      const symbolBtn = document.createElement("button");
      symbolBtn.className = "li-focus-symbol-btn";
      symbolBtn.textContent = symbol;
      symbolBtn.setAttribute("title", label);
      symbolBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.insertSymbol(symbol);
        this.toggleSymbolsPanel(button);
      });
      panel.appendChild(symbolBtn);
    });

    button.appendChild(panel);
  },

  toggleSymbolsPanel(button) {
    const panel = button.querySelector(".li-focus-symbols-panel");
    const isActive = panel.classList.contains("active");

    // Close any other open panels first
    document
      .querySelectorAll(".li-focus-symbols-panel.active")
      .forEach((p) => p.classList.remove("active"));

    if (!isActive) {
      panel.classList.add("active");
    }
  },

  setupClickOutsideHandler() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest('.li-focus-format-btn[data-format="symbols"]')) {
        document
          .querySelectorAll(".li-focus-symbols-panel.active")
          .forEach((panel) => panel.classList.remove("active"));
      }
    });
  },

  insertSymbol(symbol) {
    const editor = document.querySelector('[contenteditable="true"]');
    if (!editor) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const textNode = document.createTextNode(symbol + " ");
    range.deleteContents();
    range.insertNode(textNode);

    // Move cursor after inserted symbol
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  },

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          this.injectFormatButtons();
          this.injectCharacterCounter();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },

  applyFormat(format) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    // Skip empty selection
    if (!selectedText) {
      const button = document.querySelector(
        `.li-focus-format-btn[data-format="${format}"]`
      );
      if (button) {
        button.classList.add("disabled");
        setTimeout(() => {
          button.classList.remove("disabled");
        }, 200);
      }
      return;
    }

    let formattedContent;
    switch (format) {
      case "bold":
      case "italic":
      case "underline":
        if (this.isTextAlreadyFormatted(selectedText)) return;

        // Create a container for the selected content
        const container = document.createElement("div");
        container.appendChild(range.cloneContents());

        // Process text nodes only
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const nodes = [];
        let node;
        while ((node = walker.nextNode())) {
          nodes.push(node);
        }

        nodes.forEach((textNode) => {
          const text = textNode.textContent;
          let formattedText;
          switch (format) {
            case "bold":
              formattedText = this.formatBold(text);
              break;
            case "italic":
              formattedText = this.formatItalic(text);
              break;
            case "underline":
              formattedText = this.formatUnderline(text);
              break;
          }
          textNode.textContent = formattedText;
        });

        formattedContent = container.innerHTML;
        break;

      case "bullet-list":
      case "number-list":
        formattedContent =
          format === "bullet-list"
            ? this.formatBulletList(selectedText)
            : this.formatNumberList(selectedText);
        break;
      default:
        return;
    }

    // Insert the formatted content
    range.deleteContents();
    const temp = document.createElement("div");
    temp.innerHTML = formattedContent;
    const fragment = document.createDocumentFragment();
    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }
    range.insertNode(fragment);

    // Restore selection
    selection.removeAllRanges();
    selection.addRange(range);

    // Update visual state of format buttons
    this.updateFormatButtonStates(format);
  },

  updateFormatButtonStates(format) {
    const button = document.querySelector(
      `.li-focus-format-btn[data-format="${format}"]`
    );
    if (button) {
      button.classList.add("active");
      setTimeout(() => {
        button.classList.remove("active");
      }, 200); // Remove active state after 200ms for visual feedback
    }
  },

  formatBold(text) {
    const boldMap = {
      a: "𝗮",
      b: "𝗯",
      c: "𝗰",
      d: "𝗱",
      e: "𝗲",
      f: "𝗳",
      g: "𝗴",
      h: "𝗵",
      i: "𝗶",
      j: "𝗷",
      k: "𝗸",
      l: "𝗹",
      m: "𝗺",
      n: "𝗻",
      o: "𝗼",
      p: "𝗽",
      q: "𝗾",
      r: "𝗿",
      s: "𝘀",
      t: "𝘁",
      u: "𝘂",
      v: "𝘃",
      w: "𝘄",
      x: "𝘅",
      y: "𝘆",
      z: "𝘇",
      A: "𝗔",
      B: "𝗕",
      C: "𝗖",
      D: "𝗗",
      E: "𝗘",
      F: "𝗙",
      G: "𝗚",
      H: "𝗛",
      I: "𝗜",
      J: "𝗝",
      K: "𝗞",
      L: "𝗟",
      M: "𝗠",
      N: "𝗡",
      O: "𝗢",
      P: "𝗣",
      Q: "𝗤",
      R: "𝗥",
      S: "𝗦",
      T: "𝗧",
      U: "𝗨",
      V: "𝗩",
      W: "𝗪",
      X: "𝗫",
      Y: "𝗬",
      Z: "𝗭",
      " ": " ",
    };
    return text
      .split("")
      .map((char) => boldMap[char] || char)
      .join("");
  },

  formatItalic(text) {
    const italicMap = {
      a: "𝘢",
      b: "𝘣",
      c: "𝘤",
      d: "𝘥",
      e: "𝘦",
      f: "𝘧",
      g: "𝘨",
      h: "𝘩",
      i: "𝘪",
      j: "𝘫",
      k: "𝘬",
      l: "𝘭",
      m: "𝘮",
      n: "𝘯",
      o: "𝘰",
      p: "𝘱",
      q: "𝘲",
      r: "𝘳",
      s: "𝘴",
      t: "𝘵",
      u: "𝘶",
      v: "𝘷",
      w: "𝘸",
      x: "𝘹",
      y: "𝘺",
      z: "𝘻",
      A: "𝘈",
      B: "𝘉",
      C: "𝘊",
      D: "𝘋",
      E: "𝘌",
      F: "𝘍",
      G: "𝘎",
      H: "𝘏",
      I: "𝘐",
      J: "𝘑",
      K: "𝘒",
      L: "𝘓",
      M: "𝘔",
      N: "𝘕",
      O: "𝘖",
      P: "𝘗",
      Q: "𝘘",
      R: "𝘙",
      S: "𝘚",
      T: "𝘛",
      U: "𝘜",
      V: "𝘝",
      W: "𝘞",
      X: "𝘟",
      Y: "𝘠",
      Z: "𝘡",
      " ": " ",
    };
    return text
      .split("")
      .map((char) => italicMap[char] || char)
      .join("");
  },

  formatUnderline(text) {
    return text
      .split("")
      .map((char) => (char === " " ? " " : char + "\u0332"))
      .join("");
  },

  isTextAlreadyFormatted(text) {
    // Check if text contains any formatting characters
    const boldTest = /[\uD835][\uDC00-\uDFFF]/.test(text); // Unicode range for bold
    const italicTest = /[\uD835][\uDC00-\uDFFF]/.test(text); // Unicode range for italic
    const underlineTest = /\u0332/.test(text); // Underline combining character

    return boldTest || italicTest || underlineTest;
  },

  formatBulletList(text) {
    const div = document.createElement("div");
    div.innerHTML = this.getEditorHtml();

    // Process each paragraph
    const paragraphs = div.getElementsByTagName("p");
    let hasAnyBullet = false;
    let allBullets = true;

    // First check if all selected paragraphs have bullets
    Array.from(paragraphs).forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        if (text.startsWith("•")) {
          hasAnyBullet = true;
        } else {
          allBullets = false;
        }
      }
    });

    // If all paragraphs have bullets, remove them. Otherwise, add bullets
    Array.from(paragraphs).forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        if (allBullets) {
          // Remove bullet
          p.textContent = text.replace(/^• /, "");
        } else {
          // Add bullet, but first remove any existing numbered list format
          const cleanText = text.replace(/^\d+\. /, "").replace(/^• /, "");
          p.textContent = `• ${cleanText}`;
        }
      }
    });

    return div.innerHTML;
  },

  formatNumberList(text) {
    const div = document.createElement("div");
    div.innerHTML = this.getEditorHtml();

    // Process each paragraph
    const paragraphs = div.getElementsByTagName("p");
    let hasAnyNumber = false;
    let allNumbers = true;

    // First check if all selected paragraphs have numbers
    Array.from(paragraphs).forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        if (text.match(/^\d+\./)) {
          hasAnyNumber = true;
        } else {
          allNumbers = false;
        }
      }
    });

    // If all paragraphs have numbers, remove them. Otherwise, add numbers
    let counter = 1;
    Array.from(paragraphs).forEach((p) => {
      const text = p.textContent.trim();
      if (text) {
        if (allNumbers) {
          // Remove number
          p.textContent = text.replace(/^\d+\. /, "");
        } else {
          // Add number, but first remove any existing bullet format
          const cleanText = text.replace(/^• /, "").replace(/^\d+\. /, "");
          p.textContent = `${counter++}. ${cleanText}`;
        }
      }
    });

    return div.innerHTML;
  },

  // Helper function to get editor HTML
  getEditorHtml() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const div = document.createElement("div");
    div.appendChild(fragment);
    return div.innerHTML;
  },

  injectCharacterCounter() {
    // Check if counter already exists
    if (document.querySelector(".character-counter")) return;

    const editor = document.querySelector(".ql-editor");
    if (!editor) return;

    // Create counter element
    const counter = document.createElement("div");
    counter.className = "character-counter";
    counter.innerHTML = `<span class="current-chars">0</span>/<span class="max-chars">3000</span>`;

    // Find the wrapper element and append counter
    const wrapper = document.querySelector(
      ".share-creation-state__msg-wrapper"
    );
    if (wrapper) {
      wrapper.appendChild(counter);
    }

    // Update counter function
    const updateCounter = () => {
      const length = editor.textContent.length;
      const currentChars = counter.querySelector(".current-chars");
      currentChars.textContent = length;

      // Update counter colors based on length
      if (length > 2700 && length <= 3000) {
        counter.classList.add("near-limit");
        counter.classList.remove("at-limit");
      } else if (length > 3000) {
        counter.classList.add("at-limit");
        counter.classList.remove("near-limit");
      } else {
        counter.classList.remove("near-limit", "at-limit");
      }
    };

    // Add multiple event listeners to catch all text changes
    editor.addEventListener("input", updateCounter);
    editor.addEventListener("paste", updateCounter);

    // Use MutationObserver to catch programmatic changes (like clearing)
    const textObserver = new MutationObserver(updateCounter);
    textObserver.observe(editor, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    // Initial counter update
    updateCounter();
  },
};

// Initialize the formatter
formatter.init();
