// Enhanced panel resizing without visible handles, using hover detection
function setupImprovedResizablePanels() {
  // Get panel elements
  const appContainer = document.querySelector(".app-container");
  const aiPanel = document.querySelector(".ai-panel");
  const graphPanel = document.querySelector(".graph-panel");
  const equationPanel = document.querySelector(".equation-panel");

  if (!appContainer || !aiPanel || !graphPanel || !equationPanel) {
    console.error("One or more panel elements not found");
    return;
  }

  // Create invisible resize areas
  const leftResizeArea = document.createElement("div");
  leftResizeArea.className = "resize-area left-resize-area";

  const rightResizeArea = document.createElement("div");
  rightResizeArea.className = "resize-area right-resize-area";

  // Insert resize areas into DOM
  aiPanel.after(leftResizeArea);
  equationPanel.before(rightResizeArea);

  // Left resize area (AI panel)
  setupResizeArea(leftResizeArea, function (deltaX) {
    const containerWidth = appContainer.clientWidth;
    const minWidth = 200; // Minimum panel width in pixels
    const maxWidth = containerWidth - 400; // Max width

    // Calculate new width
    let newWidth = aiPanel.offsetWidth + deltaX;
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    const newPercent = (newWidth / containerWidth) * 100 + "%";

    // Apply new width
    aiPanel.style.width = newPercent;

    // Refresh the graph after resize
    if (window.calculator && window.calculator.redrawGraph) {
      window.calculator.redrawGraph();
    }
  });

  // Right resize area (Equation panel)
  setupResizeArea(rightResizeArea, function (deltaX) {
    const containerWidth = appContainer.clientWidth;
    const minWidth = 200; // Minimum panel width in pixels
    const maxWidth = containerWidth - 400; // Max width

    // Calculate new width
    let newWidth = equationPanel.offsetWidth - deltaX;
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    const newPercent = (newWidth / containerWidth) * 100 + "%";

    // Apply new width
    equationPanel.style.width = newPercent;

    // Refresh the graph after resize
    if (window.calculator && window.calculator.redrawGraph) {
      window.calculator.redrawGraph();
    }
  });

  console.log("Improved resizable panels setup complete");
}

// Enhanced resize area setup
function setupResizeArea(element, resizeCallback) {
  let isDragging = false;
  let startX = 0;

  // Mouse events
  element.addEventListener("mousedown", function (e) {
    isDragging = true;
    startX = e.clientX;
    document.body.classList.add("resizing");
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    resizeCallback(deltaX);
    startX = e.clientX;
  });

  document.addEventListener("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove("resizing");
    }
  });

  // Touch events for mobile support
  element.addEventListener("touchstart", function (e) {
    isDragging = true;
    startX = e.touches[0].clientX;
    document.body.classList.add("resizing");
    e.preventDefault();
  });

  document.addEventListener("touchmove", function (e) {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - startX;
    resizeCallback(deltaX);
    startX = e.touches[0].clientX;
  });

  document.addEventListener("touchend", function () {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove("resizing");
    }
  });
}

// Call this function instead of the old setupResizablePanels
document.addEventListener("DOMContentLoaded", function () {
  // Setup improved resizable panels
  setupImprovedResizablePanels();
});
