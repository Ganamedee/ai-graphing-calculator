// Complete fixed AI message handling with button for adding equations
class AIAssistant {
  constructor() {
    this.models = [];
    this.selectedModel = null;
    this.chatMessages = [];
    this.loadingMessageId = null; // Track loading message ID
    this.lastParsedEquations = null; // Store last parsed equations from AI
  }

  async initialize() {
    try {
      // Fetch available models from the API
      console.log("Fetching available AI models...");
      const response = await fetch("/api/models");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Models fetched:", data);

      this.models = data.models || [];

      if (this.models.length > 0) {
        // Default to gpt4 as it's more reliable
        this.selectedModel = "gpt4";
        console.log("Default model selected:", this.selectedModel);
      } else {
        console.warn("No models available from API");
      }

      // Populate model selector
      this.populateModelSelector();

      return true;
    } catch (error) {
      console.error("Error initializing AI assistant:", error);
      this.addMessage("ai", `Error initializing: ${error.message}`);
      return false;
    }
  }

  populateModelSelector() {
    const selector = document.getElementById("model-select");
    if (!selector) {
      console.error("Model selector element not found");
      return;
    }

    // Clear existing options
    selector.innerHTML = "";

    // Add options for each model
    if (this.models.length === 0) {
      // Add a placeholder option if no models are available
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No models available";
      option.disabled = true;
      selector.appendChild(option);
      console.warn("No models available to populate selector");
    } else {
      console.log(
        "Populating model selector with",
        this.models.length,
        "models"
      );
      this.models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model.id;
        option.textContent = model.name;
        selector.appendChild(option);
      });
    }

    // Set selected model
    if (this.selectedModel) {
      selector.value = this.selectedModel;
    }

    // Set change event handler
    selector.addEventListener("change", (e) => {
      this.selectedModel = e.target.value;
      console.log("Model changed to:", this.selectedModel);
    });
  }

  async generateEquations(prompt) {
    try {
      console.log("Generating equations for prompt:", prompt);

      // Check if we have a model selected
      if (!this.selectedModel && this.models.length > 0) {
        this.selectedModel = "gpt4";
        console.log(
          "No model was selected, using default:",
          this.selectedModel
        );
      }

      if (!this.selectedModel) {
        throw new Error("No AI model available");
      }

      // Add user message to chat
      this.addMessage("user", prompt);

      // Show loading state and store the ID
      this.loadingMessageId = this.addMessage("ai", "Generating equations...");

      console.log("Sending request to API with model:", this.selectedModel);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          model: this.selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API returned error status:", response.status, errorData);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Received response from API:", data);

      // Check if we have an error in the response
      if (data.error) {
        console.error("Error in API response:", data.error);
        throw new Error(data.error);
      }

      // Parse the response
      this.lastParsedEquations = this.parseAIResponse(data.response);
      console.log("Parsed equations:", this.lastParsedEquations);

      // Update AI message with just the response (don't add any text about buttons)
      if (this.loadingMessageId) {
        this.updateMessage(
          this.loadingMessageId,
          "ai",
          data.response,
          data.model?.displayName
        );

        // Explicitly get the message element
        const messageElement = document.getElementById(
          `message-${this.loadingMessageId}`
        );
        if (messageElement) {
          console.log("Found message element, adding button");
          this.addButtonDirectly(messageElement);
        } else {
          console.error("Could not find message element");
        }

        // Reset loading message ID
        this.loadingMessageId = null;
      } else {
        // Fallback if for some reason we lost track of the loading message
        const messageId = this.addMessage(
          "ai",
          data.response,
          data.model?.displayName
        );

        // Explicitly get the message element
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          this.addButtonDirectly(messageElement);
        }
      }

      return data.response;
    } catch (error) {
      console.error("Error generating equations:", error);

      // If there's a loading message, update it with the error
      if (this.loadingMessageId) {
        this.updateMessage(
          this.loadingMessageId,
          "ai",
          `Error: ${error.message}`
        );
        this.loadingMessageId = null;
      } else {
        this.addMessage("ai", `Error: ${error.message}`);
      }

      throw error;
    }
  }

  // Fixed and improved formatExpression function
  formatExpression(expression) {
    if (!expression) return expression;

    try {
      // First fix spaces in operators to prevent breaking them
      let fixed = expression
        // Fix operator spacing carefully - remove spaces inside operators
        .replace(/>\s*=/g, ">=") // Remove any spaces in >=
        .replace(/<\s*=/g, "<=") // Remove any spaces in <=
        .replace(/=\s*</g, "=<") // Fix if someone writes => as =<
        .replace(/=\s*>/g, "=>") // Fix if someone writes =< as =>

        // Handle abs functions properly
        .replace(/\(abs\(/g, "abs(")
        .replace(/abs\s*\(/g, "abs("); // Ensure no space after abs

      // Now check if this is a conditional expression
      if (fixed.includes("?") && fixed.includes(":")) {
        // Replace (condition) ? expr : NaN with the correct format for function-plot
        fixed = fixed
          // Remove outer parentheses in conditions
          .replace(/^\((.*?)\)\s*\?/g, "$1 ?")
          .replace(/\)\s*\?/g, " ?") // Remove parentheses before ?

          // Fix spacing around operators but not inside them
          .replace(/\s*&&\s*/g, " && ") // Add spaces around &&

          // Add spaces after operators if missing
          .replace(/>=/g, ">= ") // Add space after >=
          .replace(/<=/g, "<= ") // Add space after <=
          .replace(/([^<>])>([^=\s])/g, "$1> $2") // Add space after standalone >
          .replace(/([^<>])<([^=\s])/g, "$1< $2") // Add space after standalone <

          // Fix double spaces that might have been created
          .replace(/\s{2,}/g, " ");
      }

      // Just to be extra safe, clean up operators one more time
      return fixed
        .replace(/>\s*=/g, ">=")
        .replace(/<\s*=/g, "<=")
        .replace(/abs\s*\(/g, "abs(");
    } catch (err) {
      console.error("Error formatting expression:", err);
      return expression; // Return original if anything goes wrong
    }
  }

  // New method to add button directly to the message element
  addButtonDirectly(messageElement) {
    if (!messageElement) {
      console.error("Message element not provided");
      return;
    }

    console.log("Adding button directly to message element");

    // Create button container with clear styling
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "message-button-container";
    buttonContainer.style.marginTop = "15px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";

    // Create Apply button with very clear styling
    const applyButton = document.createElement("button");
    applyButton.textContent = "Add Equations to Graph";
    applyButton.className = "apply-equations-btn";
    applyButton.style.padding = "10px 20px";
    applyButton.style.backgroundColor = "#4361EE"; // Bright blue
    applyButton.style.color = "white";
    applyButton.style.border = "none";
    applyButton.style.borderRadius = "6px";
    applyButton.style.cursor = "pointer";
    applyButton.style.fontWeight = "bold";
    applyButton.style.fontSize = "14px";
    applyButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    applyButton.style.transition = "all 0.2s";

    // Add hover effects
    applyButton.addEventListener("mouseover", () => {
      applyButton.style.backgroundColor = "#3050E0";
      applyButton.style.transform = "translateY(-2px)";
      applyButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    });

    applyButton.addEventListener("mouseout", () => {
      applyButton.style.backgroundColor = "#4361EE";
      applyButton.style.transform = "translateY(0)";
      applyButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    });

    // Add click handler
    applyButton.addEventListener("click", () => {
      console.log("Add equations button clicked");
      if (this.lastParsedEquations && window.calculator) {
        console.log("Applying equations to graph:", this.lastParsedEquations);
        // Call the method to add equations but set fixedToViewport to false
        this.applyEquationsToGraph(this.lastParsedEquations);

        // Change button text and disable it
        applyButton.textContent = "✅ Added to Graph";
        applyButton.style.backgroundColor = "#43A047"; // Green
        applyButton.disabled = true;
        applyButton.style.cursor = "default";
        applyButton.style.transform = "none";
        applyButton.style.boxShadow = "none";
      } else {
        console.error("No equations to add or calculator not available");
        applyButton.textContent = "Error: Could not add equations";
        applyButton.style.backgroundColor = "#E53935"; // Red
      }
    });

    // Add button to container, then to message
    buttonContainer.appendChild(applyButton);
    messageElement.appendChild(buttonContainer);

    console.log("Button added to message");
  }

  // Updated applyEquationsToGraph method
  // Updated applyEquationsToGraph method to use simpler approach without conditionals
  // Updated applyEquationsToGraph method
  applyEquationsToGraph(equationsData) {
    if (!window.calculator) {
      console.error("Calculator not available");
      return false;
    }

    try {
      // Clear existing equations
      window.calculator.clearAllEquations();

      const equations = equationsData.equations || [];

      if (equations.length === 0) {
        console.warn("No equations found to apply");
        return false;
      }

      // Process each equation
      equations.forEach((eq, index) => {
        if (!eq.expression) {
          console.warn(`Equation ${index} missing expression`, eq);
          return;
        }

        try {
          // Simplify: Just extract the base expression without conditionals
          let expression = eq.expression;

          // If this contains a conditional, extract just the true part
          if (expression.includes("?") && expression.includes(":")) {
            const parts = expression.split("?");
            if (parts.length > 1) {
              const truePart = parts[1].split(":")[0];
              expression = truePart.trim();
              console.log(
                `Extracted core expression from equation ${index}:`,
                expression
              );
            }
          }

          // Clean up any excess spaces
          expression = expression.replace(/\s+/g, " ").trim();

          // For absolute value, ensure abs( has no space
          expression = expression.replace(/abs\s+\(/g, "abs(");

          // Add equation - use fixedToViewport=false for AI equations
          // Use a default thickness based on the equation's role
          let thickness = 2; // Default thickness

          // Make background elements thinner, foreground elements thicker
          if (index < equations.length / 3) {
            thickness = 1.5; // Thinner for background elements
          } else if (index > (equations.length * 2) / 3) {
            thickness = 3; // Thicker for foreground elements
          }

          window.calculator.addEquation(
            expression,
            eq.color,
            eq.fill,
            false,
            thickness
          );
        } catch (eqError) {
          console.error(`Error adding equation ${index}:`, eqError);
        }
      });

      // Update the equations list in the UI
      if (typeof updateEquationsList === "function") {
        updateEquationsList(window.calculator.equations);
      } else if (window.updateEquationsList) {
        window.updateEquationsList(window.calculator.equations);
      }

      return true;
    } catch (error) {
      console.error("Error applying equations to graph:", error);
      return false;
    }
  }

  addMessage(role, content, modelName = null) {
    const chatContainer = document.getElementById("chat-messages");
    if (!chatContainer) {
      console.error("Chat messages container not found");
      return null;
    }

    // Create a unique ID for the message
    const id = Date.now().toString();

    // Create message element
    const messageElement = document.createElement("div");
    messageElement.id = `message-${id}`;
    messageElement.className = `message ${role}-message`;

    // Add header if needed
    if (role === "ai" && modelName) {
      const headerElement = document.createElement("div");
      headerElement.className = "message-header";
      headerElement.textContent = modelName;
      messageElement.appendChild(headerElement);
    }

    // Add content
    const contentElement = document.createElement("div");
    contentElement.className = "message-content";
    contentElement.textContent = content;
    messageElement.appendChild(contentElement);

    // Add to DOM
    chatContainer.appendChild(messageElement);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Store message
    this.chatMessages.push({
      id,
      role,
      content,
      modelName,
    });

    return id;
  }

  updateMessage(id, role, content, modelName = null) {
    const messageElement = document.getElementById(`message-${id}`);
    if (!messageElement) {
      console.error("Message element not found:", id);
      return;
    }

    // Update element classes
    messageElement.className = `message ${role}-message`;

    // Clear existing content
    messageElement.innerHTML = "";

    // Add header if needed
    if (role === "ai" && modelName) {
      const headerElement = document.createElement("div");
      headerElement.className = "message-header";
      headerElement.textContent = modelName;
      messageElement.appendChild(headerElement);
    }

    // Add content
    const contentElement = document.createElement("div");
    contentElement.className = "message-content";
    contentElement.textContent = content;
    messageElement.appendChild(contentElement);

    // Update stored message
    const messageIndex = this.chatMessages.findIndex((msg) => msg.id === id);
    if (messageIndex !== -1) {
      this.chatMessages[messageIndex] = {
        id,
        role,
        content,
        modelName,
      };
    }
  }

  parseAIResponse(responseText) {
    try {
      console.log("Parsing AI response");

      // First try to parse as JSON directly
      try {
        const parsed = JSON.parse(responseText);
        console.log("Successfully parsed response as JSON:", parsed);

        // Make sure we fix any expressions in the parsed data
        if (parsed.equations && Array.isArray(parsed.equations)) {
          // Fix common syntax issues before returning
          parsed.equations = parsed.equations.map((eq) => {
            if (eq.expression) {
              // Fix spaces within operators which is a common issue
              const fixedExpression = eq.expression
                // Fix >= and <= operators to ensure no spaces
                .replace(/>\s*=/g, ">=")
                .replace(/<\s*=/g, "<=")
                // Make sure there's no spaces in abs( function
                .replace(/abs\s*\(/g, "abs(")
                // Make sure parentheses are removed after abs
                .replace(/\(abs\(/g, "abs(");

              return {
                ...eq,
                expression: fixedExpression,
              };
            }
            return eq;
          });
        }

        return parsed;
      } catch (e) {
        console.log(
          "Direct JSON parse failed, trying to extract JSON from text"
        );

        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log("Successfully extracted JSON from text:", extracted);

            // Apply the same fixes to the extracted JSON
            if (extracted.equations && Array.isArray(extracted.equations)) {
              extracted.equations = extracted.equations.map((eq) => {
                if (eq.expression) {
                  // Fix spaces within operators
                  const fixedExpression = eq.expression
                    .replace(/>\s*=/g, ">=")
                    .replace(/<\s*=/g, "<=")
                    .replace(/abs\s*\(/g, "abs(")
                    .replace(/\(abs\(/g, "abs(");

                  return {
                    ...eq,
                    expression: fixedExpression,
                  };
                }
                return eq;
              });
            }

            return extracted;
          } catch (jsonError) {
            console.error("Error parsing extracted JSON:", jsonError);
          }
        }

        console.log("No JSON found in response, creating fallback structure");

        // If no JSON is found, create a basic structure
        // Split the response by lines and treat each line as a separate equation
        const lines = responseText.trim().split("\n");
        const equations = lines.map((line, index) => {
          return {
            expression: line.trim(),
            color: this.getRandomColor(index),
            fill: false,
          };
        });

        const fallback = { equations };
        console.log("Created fallback structure:", fallback);
        return fallback;
      }
    } catch (error) {
      console.error("Error parsing AI response:", error);

      // Create a really simple fallback with a sine wave
      const fallback = {
        equations: [
          {
            expression: "sin(x)",
            color: "#3366FF",
            fill: false,
          },
        ],
      };

      console.log("Using emergency fallback structure");
      return fallback;
    }
  }

  // Helper to generate colors for multiple equations
  getRandomColor(index) {
    // Predefined colors for first few equations
    const colors = ["#3366FF", "#FF6633", "#33CC33", "#CC33CC", "#FFCC00"];

    if (index < colors.length) {
      return colors[index];
    }

    // Generate random colors for additional equations
    const hue = (index * 137) % 360; // Golden angle to get good distribution
    return `hsl(${hue}, 70%, 60%)`;
  }
}
