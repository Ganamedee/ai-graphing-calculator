// Make sure we wait for the page to load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App initializing...');
  
  // Check if function-plot is loaded
  if (typeof functionPlot === 'undefined') {
    console.error('Error: function-plot library not loaded!');
    return;
  }
  
  // Initialize graphing calculator
  try {
    console.log('Initializing calculator...');
    const calculator = new GraphingCalculator('graph-container');
    
    // Initialize AI assistant
    console.log('Initializing AI assistant...');
    const assistant = new AIAssistant();
    const initialized = await assistant.initialize();
    
    if (!initialized) {
      console.error('Failed to initialize AI assistant');
    }
    
    // Graph control buttons
    document.getElementById('zoom-in').addEventListener('click', () => calculator.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => calculator.zoomOut());
    document.getElementById('reset-view').addEventListener('click', () => calculator.resetView());
    
    // Add equation manually
    document.getElementById('add-equation-btn').addEventListener('click', () => {
      const equationInput = document.getElementById('equation-input');
      const colorInput = document.getElementById('equation-color');
      
      if (equationInput.value.trim()) {
        try {
          const id = calculator.addEquation(equationInput.value, colorInput.value);
          addEquationToList(id, equationInput.value, colorInput.value);
          equationInput.value = '';
        } catch (error) {
          alert('Invalid equation: ' + error.message);
        }
      }
    });
    
    // Generate equations with AI
    document.getElementById('generate-btn').addEventListener('click', async () => {
      const promptInput = document.getElementById('scene-prompt');
      const prompt = promptInput.value.trim();
      
      if (prompt) {
        try {
          // Get AI response
          const aiResponse = await assistant.generateEquations(prompt);
          
          // Try to parse the response
          const equationsData = assistant.parseAIResponse(aiResponse);
          
          // Add equations to the graph
          const added = calculator.addEquationsFromJSON(equationsData);
          
          // Update the equations list
          if (added) {
            updateEquationsList(calculator.equations);
          }
        } catch (error) {
          console.error('Error during AI generation:', error);
          assistant.addMessage('ai', 'Error: ' + error.message);
        }
      }
    });
    
    // Function to add an equation to the list
    function addEquationToList(id, text, color) {
      const equationsList = document.getElementById('equations-list');
      
      const equationItem = document.createElement('div');
      equationItem.className = 'equation-item';
      equationItem.dataset.id = id;
      
      const equationText = document.createElement('div');
      equationText.className = 'equation-text';
      equationText.textContent = text;
      
      const equationColor = document.createElement('div');
      equationColor.className = 'equation-color';
      equationColor.style.backgroundColor = color;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'equation-delete';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        calculator.removeEquation(id);
        equationItem.remove();
      });
      
      equationItem.appendChild(equationText);
      equationItem.appendChild(equationColor);
      equationItem.appendChild(deleteBtn);
      
      equationsList.appendChild(equationItem);
    }
    
    // Function to update the entire equations list
    function updateEquationsList(equations) {
      const equationsList = document.getElementById('equations-list');
      equationsList.innerHTML = '';
      
      equations.forEach(eq => {
        addEquationToList(eq.id, eq.text, eq.color);
      });
    }
    
    // Add some example equations
    console.log('Adding example equations...');
    setTimeout(() => {
      try {
        calculator.addEquation('sin(x)', '#3366FF');
        calculator.addEquation('x^2', '#FF6633');
        updateEquationsList(calculator.equations);
      } catch (error) {
        console.error('Error adding example equations:', error);
      }
    }, 1000);
  
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});