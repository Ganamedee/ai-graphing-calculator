// Main application initialization
document.addEventListener("DOMContentLoaded", async () => {
  console.log("App initializing with fixes for viewport binding...");

  // Check if required libraries are loaded
  if (typeof functionPlot === "undefined") {
    console.error("Error: function-plot library not loaded!");
    return;
  }

  if (typeof katex === "undefined") {
    console.error("Error: KaTeX library not loaded!");
    // Continue anyway, we'll fall back to plain text
  }

  // Make updateEquationsList available globally
  window.updateEquationsList = function (equations) {
    const equationsList = document.getElementById("equations-list");
    if (!equationsList) {
      console.error("Equations list element not found");
      return;
    }

    equationsList.innerHTML = "";

    equations.forEach((eq) => {
      addEquationToList(eq.id, eq.text, eq.color, eq.fill);
    });
  };

  // Initialize graphing calculator and make it globally accessible
  try {
    console.log("Initializing calculator...");
    window.calculator = new GraphingCalculator("graph-container");
    const calculator = window.calculator;

    // Initialize AI assistant
    console.log("Initializing AI assistant...");
    window.assistant = new AIAssistant();
    const assistant = window.assistant;
    const initialized = await assistant.initialize();

    if (!initialized) {
      console.error("Failed to initialize AI assistant");
    }

    // Add equation manually - always set fixedToViewport to true for manual equations
    const addEquationBtn = document.getElementById("add-equation-btn");
    if (addEquationBtn) {
      addEquationBtn.addEventListener("click", () => {
        const equationInput = document.getElementById("equation-input");
        const colorInput = document.getElementById("equation-color");
        const fillCheckbox = document.getElementById("equation-fill");

        if (equationInput.value.trim()) {
          try {
            // Set fixedToViewport to true for manually added equations
            const id = calculator.addEquation(
              equationInput.value,
              colorInput.value,
              fillCheckbox.checked,
              true // fixedToViewport = true
            );
            addEquationToList(
              id,
              equationInput.value,
              colorInput.value,
              fillCheckbox.checked
            );
            equationInput.value = "";
          } catch (error) {
            alert("Invalid equation: " + error.message);
          }
        }
      });
    } else {
      console.error("Add equation button not found");
    }

    // Allow pressing Enter in equation input
    const equationInput = document.getElementById("equation-input");
    if (equationInput) {
      equationInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          addEquationBtn.click();
        }
      });
    }

    // Generate equations with AI - now with button
    const generateBtn = document.getElementById("generate-btn");
    if (generateBtn) {
      generateBtn.addEventListener("click", async () => {
        const promptInput = document.getElementById("scene-prompt");
        const prompt = promptInput.value.trim();

        if (prompt) {
          try {
            // Disable the button while generating
            generateBtn.disabled = true;
            generateBtn.textContent = "Generating...";

            // Get AI response - this will now add a button instead of auto-applying
            await assistant.generateEquations(prompt);

            // Re-enable the button
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Visualization";
          } catch (error) {
            console.error("Error during AI generation:", error);

            // Re-enable the button
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Visualization";
          }
        }
      });
    } else {
      console.error("Generate button not found");
    }

    // Function to add an equation to the list
    function addEquationToList(id, text, color, fill = false) {
      const equationsList = document.getElementById("equations-list");
      if (!equationsList) {
        console.error("Equations list element not found");
        return;
      }

      const equationItem = document.createElement("div");
      equationItem.className = "equation-item";
      equationItem.dataset.id = id;

      const equationText = document.createElement("div");
      equationText.className = "equation-text";

      // Render the equation with KaTeX if available
      if (typeof renderEquation === "function") {
        renderEquation(equationText, text);
      } else {
        equationText.textContent = text;
      }

      const controlsContainer = document.createElement("div");
      controlsContainer.className = "equation-controls";

      const equationColor = document.createElement("div");
      equationColor.className = "equation-color";
      equationColor.style.backgroundColor = color;

      const editBtn = document.createElement("button");
      editBtn.className = "equation-edit";
      editBtn.innerHTML = "✎";
      editBtn.title = "Edit equation";
      editBtn.addEventListener("click", () => {
        // Enter edit mode
        enterEditMode(equationItem, id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "equation-delete";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Delete equation";
      deleteBtn.addEventListener("click", () => {
        calculator.removeEquation(id);
        equationItem.remove();
      });

      controlsContainer.appendChild(editBtn);
      controlsContainer.appendChild(equationColor);
      controlsContainer.appendChild(deleteBtn);

      equationItem.appendChild(equationText);
      equationItem.appendChild(controlsContainer);

      equationsList.appendChild(equationItem);
    }

    // Function to enter edit mode for an equation
    function enterEditMode(equationItem, equationId) {
      const equation = calculator.getEquation(equationId);
      if (!equation) {
        console.error(`Equation with id ${equationId} not found`);
        return;
      }

      // Save original content to restore if cancelled
      const originalContent = equationItem.innerHTML;

      // Add edit mode class
      equationItem.classList.add("edit-mode");

      // Create edit form
      const editForm = document.createElement("div");
      editForm.className = "equation-edit-form";

      // Create input for equation text
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "equation-edit-input";
      editInput.value = equation.text;

      // Create color picker
      const editControlsDiv = document.createElement("div");
      editControlsDiv.className = "equation-edit-controls";

      const colorPickerLabel = document.createElement("label");
      colorPickerLabel.textContent = "Color:";

      const colorPicker = document.createElement("input");
      colorPicker.type = "color";
      colorPicker.className = "equation-edit-color";
      colorPicker.value = equation.color;

      // Create fill checkbox
      const fillDiv = document.createElement("div");
      fillDiv.className = "equation-edit-fill";

      const fillCheckbox = document.createElement("input");
      fillCheckbox.type = "checkbox";
      fillCheckbox.id = `edit-fill-${equationId}`;
      fillCheckbox.checked = equation.fill;

      const fillLabel = document.createElement("label");
      fillLabel.htmlFor = `edit-fill-${equationId}`;
      fillLabel.textContent = "Fill";

      fillDiv.appendChild(fillCheckbox);
      fillDiv.appendChild(fillLabel);

      editControlsDiv.appendChild(colorPickerLabel);
      editControlsDiv.appendChild(colorPicker);
      editControlsDiv.appendChild(fillDiv);

      // Create buttons
      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "equation-edit-buttons";

      const saveButton = document.createElement("button");
      saveButton.className = "equation-save-btn";
      saveButton.textContent = "Save";

      const cancelButton = document.createElement("button");
      cancelButton.className = "equation-cancel-btn";
      cancelButton.textContent = "Cancel";

      buttonsDiv.appendChild(saveButton);
      buttonsDiv.appendChild(cancelButton);

      // Add everything to the form
      editForm.appendChild(editInput);
      editForm.appendChild(editControlsDiv);
      editForm.appendChild(buttonsDiv);

      // Clear the equation item and add the form
      equationItem.innerHTML = "";
      equationItem.appendChild(editForm);

      // Focus the input
      editInput.focus();

      // Add event listeners for save and cancel
      saveButton.addEventListener("click", () => {
        saveEquationEdit(
          equationItem,
          equationId,
          editInput.value,
          colorPicker.value,
          fillCheckbox.checked
        );
      });

      cancelButton.addEventListener("click", () => {
        // Restore original content
        equationItem.classList.remove("edit-mode");
        equationItem.innerHTML = originalContent;

        // Reattach event listeners
        const newEditBtn = equationItem.querySelector(".equation-edit");
        const newDeleteBtn = equationItem.querySelector(".equation-delete");

        if (newEditBtn) {
          newEditBtn.addEventListener("click", () => {
            enterEditMode(equationItem, equationId);
          });
        }

        if (newDeleteBtn) {
          newDeleteBtn.addEventListener("click", () => {
            calculator.removeEquation(equationId);
            equationItem.remove();
          });
        }
      });
    }

    // Function to save equation edit
    function saveEquationEdit(
      equationItem,
      oldEquationId,
      newText,
      newColor,
      newFill
    ) {
      try {
        // Update the equation in the calculator - preserves fixedToViewport setting
        const newId = calculator.updateEquation(
          oldEquationId,
          newText,
          newColor,
          newFill
        );

        // Update the data-id attribute
        equationItem.dataset.id = newId;

        // Remove edit mode
        equationItem.classList.remove("edit-mode");

        // Update the display
        const equationText = document.createElement("div");
        equationText.className = "equation-text";

        // Render with KaTeX if available
        if (typeof renderEquation === "function") {
          renderEquation(equationText, newText);
        } else {
          equationText.textContent = newText;
        }

        const controlsContainer = document.createElement("div");
        controlsContainer.className = "equation-controls";

        const equationColor = document.createElement("div");
        equationColor.className = "equation-color";
        equationColor.style.backgroundColor = newColor;

        const editBtn = document.createElement("button");
        editBtn.className = "equation-edit";
        editBtn.innerHTML = "✎";
        editBtn.title = "Edit equation";
        editBtn.addEventListener("click", () => {
          enterEditMode(equationItem, newId);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "equation-delete";
        deleteBtn.innerHTML = "×";
        deleteBtn.title = "Delete equation";
        deleteBtn.addEventListener("click", () => {
          calculator.removeEquation(newId);
          equationItem.remove();
        });

        controlsContainer.appendChild(editBtn);
        controlsContainer.appendChild(equationColor);
        controlsContainer.appendChild(deleteBtn);

        equationItem.innerHTML = "";
        equationItem.appendChild(equationText);
        equationItem.appendChild(controlsContainer);
      } catch (error) {
        alert("Error updating equation: " + error.message);
        console.error("Error updating equation:", error);
      }
    }

    // Add some example equations - manually added so fixed to viewport
    console.log("Adding example equations...");
    setTimeout(() => {
      try {
        calculator.addEquation("sin(x)", "#4361EE", false, true);
        calculator.addEquation("x^2", "#FF6B6B", false, true);
        updateEquationsList(calculator.equations);
      } catch (error) {
        console.error("Error adding example equations:", error);
      }
    }, 1000);

    // Initialize keyboard shortcuts if script is loaded
    if (typeof setupKeyboardShortcuts === "function") {
      setupKeyboardShortcuts();
    }

    // Initialize resizable panels if script is loaded
    if (typeof setupImprovedResizablePanels === "function") {
      setupImprovedResizablePanels();
    }
  } catch (error) {
    console.error("Error initializing application:", error);
  }
});
