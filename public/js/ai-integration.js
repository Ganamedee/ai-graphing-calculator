// public/js/ai-integration.js
// AI Integration functionality
class AIAssistant {
  constructor() {
    this.models = [];
    this.selectedModel = null;
    this.chatMessages = [];
  }

  async initialize() {
    try {
      // Fetch available models from the API - CRITICAL: Use the same endpoint as the working app
      console.log('Fetching available AI models...');
      const response = await fetch('/api/models');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Models fetched:', data);
      
      this.models = data.models || [];
      
      if (this.models.length > 0) {
        // Default to gpt4 as it's more reliable
        this.selectedModel = "gpt4";
        console.log('Default model selected:', this.selectedModel);
      } else {
        console.warn('No models available from API');
      }
      
      // Populate model selector
      this.populateModelSelector();
      
      return true;
    } catch (error) {
      console.error('Error initializing AI assistant:', error);
      this.addMessage('ai', `Error initializing: ${error.message}`);
      return false;
    }
  }

  populateModelSelector() {
    const selector = document.getElementById('model-select');
    if (!selector) {
      console.error('Model selector element not found');
      return;
    }
    
    // Clear existing options
    selector.innerHTML = '';
    
    // Add options for each model
    if (this.models.length === 0) {
      // Add a placeholder option if no models are available
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No models available';
      option.disabled = true;
      selector.appendChild(option);
      console.warn('No models available to populate selector');
    } else {
      console.log('Populating model selector with', this.models.length, 'models');
      this.models.forEach(model => {
        const option = document.createElement('option');
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
    selector.addEventListener('change', (e) => {
      this.selectedModel = e.target.value;
      console.log('Model changed to:', this.selectedModel);
    });
  }

  async generateEquations(prompt) {
    try {
      console.log('Generating equations for prompt:', prompt);
      
      // Check if we have a model selected
      if (!this.selectedModel && this.models.length > 0) {
        this.selectedModel = "gpt4";
        console.log('No model was selected, using default:', this.selectedModel);
      }
      
      if (!this.selectedModel) {
        throw new Error('No AI model available');
      }
      
      // Add user message to chat
      this.addMessage('user', prompt);
      
      // Show loading state
      const loadingId = this.addMessage('ai', 'Generating equations...');
      
      // CRITICAL CHANGE: Use the exact same endpoint as the working app
      console.log('Sending request to API with model:', this.selectedModel);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // CRITICAL: Match the parameter names used in the working app
          message: prompt,
          model: this.selectedModel
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API returned error status:', response.status, errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received response from API:', data);
      
      // Check if we have an error in the response
      if (data.error) {
        console.error('Error in API response:', data.error);
        throw new Error(data.error);
      }
      
      // Update AI message with the response
      // CRITICAL: Match the response structure from the working app
      this.updateMessage(loadingId, 'ai', data.response, data.model?.displayName);
      
      return data.response;
    } catch (error) {
      console.error('Error generating equations:', error);
      throw error;
    }
  }

  // Rest of the methods remain unchanged
  addMessage(role, content, modelName = null) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) {
      console.error('Chat messages container not found');
      return;
    }
    
    // Create a unique ID for the message
    const id = Date.now().toString();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.id = `message-${id}`;
    messageElement.className = `message ${role}-message`;
    
    // Add header if needed
    if (role === 'ai' && modelName) {
      const headerElement = document.createElement('div');
      headerElement.className = 'message-header';
      headerElement.textContent = modelName;
      messageElement.appendChild(headerElement);
    }
    
    // Add content
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
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
      modelName
    });
    
    return id;
  }

  updateMessage(id, role, content, modelName = null) {
    const messageElement = document.getElementById(`message-${id}`);
    if (!messageElement) {
      console.error('Message element not found:', id);
      return;
    }
    
    // Update element classes
    messageElement.className = `message ${role}-message`;
    
    // Clear existing content
    messageElement.innerHTML = '';
    
    // Add header if needed
    if (role === 'ai' && modelName) {
      const headerElement = document.createElement('div');
      headerElement.className = 'message-header';
      headerElement.textContent = modelName;
      messageElement.appendChild(headerElement);
    }
    
    // Add content
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = content;
    messageElement.appendChild(contentElement);
    
    // Update stored message
    const messageIndex = this.chatMessages.findIndex(msg => msg.id === id);
    if (messageIndex !== -1) {
      this.chatMessages[messageIndex] = {
        id,
        role,
        content,
        modelName
      };
    }
  }

  parseAIResponse(responseText) {
    try {
      console.log('Parsing AI response');
      
      // First try to parse as JSON directly
      try {
        const parsed = JSON.parse(responseText);
        console.log('Successfully parsed response as JSON:', parsed);
        return parsed;
      } catch (e) {
        console.log('Direct JSON parse failed, trying to extract JSON from text');
        
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON from text:', extracted);
          return extracted;
        }
        
        console.log('No JSON found in response, creating fallback structure');
        
        // If no JSON is found, create a basic structure
        // Split the response by lines and treat each line as a separate equation
        const lines = responseText.trim().split('\n');
        const equations = lines.map((line, index) => {
          return {
            expression: line.trim(),
            color: this.getRandomColor(index),
            fill: false
          };
        });
        
        const fallback = { equations };
        console.log('Created fallback structure:', fallback);
        return fallback;
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Create a really simple fallback with a sine wave
      const fallback = {
        equations: [
          {
            expression: "sin(x)",
            color: "#3366FF",
            fill: false
          }
        ]
      };
      
      console.log('Using emergency fallback structure');
      return fallback;
    }
  }
  
  // Helper to generate colors for multiple equations
  getRandomColor(index) {
    // Predefined colors for first few equations
    const colors = ['#3366FF', '#FF6633', '#33CC33', '#CC33CC', '#FFCC00'];
    
    if (index < colors.length) {
      return colors[index];
    }
    
    // Generate random colors for additional equations
    const hue = (index * 137) % 360; // Golden angle to get good distribution
    return `hsl(${hue}, 70%, 60%)`;
  }
}