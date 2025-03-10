// Add keyboard shortcut handling to the scene prompt textarea
function setupKeyboardShortcuts() {
  const scenePrompt = document.getElementById("scene-prompt");
  const generateBtn = document.getElementById("generate-btn");

  if (!scenePrompt || !generateBtn) {
    console.error("Scene prompt or generate button elements not found");
    return;
  }

  scenePrompt.addEventListener("keydown", function (event) {
    // Check if Enter was pressed without Shift
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent default enter behavior

      // Only trigger generation if there's content
      if (scenePrompt.value.trim()) {
        // Simulate button click
        generateBtn.click();
      }
    }
    // Allow Shift+Enter to create a new line (default behavior, no need to handle)
  });

  console.log("Keyboard shortcuts setup complete");
}

// Add this function to the app initialization
document.addEventListener("DOMContentLoaded", function () {
  // Existing initialization code...

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
});
