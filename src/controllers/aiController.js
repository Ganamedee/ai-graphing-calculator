// src/controllers/aiController.js - Matching the working PenTestAI implementation
require("dotenv").config();
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");

// Enhanced system prompt for mathematical visualizations
const systemPrompt = `You are an AI assistant specializing in creating mathematical equations for a graphing calculator that visualizes scenes.

RESPONSE FORMAT:
Always respond with a valid JSON object containing an array of equations. Each equation must have the following structure:
{
  "equations": [
    {
      "expression": "sin(x)",  // The mathematical expression to plot
      "color": "#3366FF",      // A hex color code for the line
      "fill": false            // Whether to fill the area under the curve
    }
  ]
}

GUIDELINES:
- Use standard mathematical notation that can be understood by function-plot.js library
- For simple curves, use functions like: sin(x), cos(x), tan(x), x^2, x^3, sqrt(x), etc.
- For complex objects, create multiple equations
- Choose colors that work well together and match the scene description
- Only include fill:true when appropriate for the visual (like water, ground, or filled shapes)
- Use conditional expressions when helpful (e.g., "x < 0 ? -x^2 : x^2")
- Use NaN to create bounded regions (e.g., "abs(x) < 5 ? -0.1*x^2 + 3 : NaN")
- Adjust equation parameters to fit in the default viewport range of -10 to 10
- Never include explanations in your response, only valid JSON

EXAMPLES:
1. For "mountains with a sun":
{
  "equations": [
    {"expression": "abs(x) < 5 ? -0.1*x^2 + 3 : NaN", "color": "#7F5200", "fill": true},
    {"expression": "sqrt(25 - x^2)", "color": "#FF9900", "fill": true},
    {"expression": "-sqrt(25 - x^2)", "color": "#FF9900", "fill": true}
  ]
}

2. For "ocean waves":
{
  "equations": [
    {"expression": "cos(x) * 2", "color": "#0099FF", "fill": false},
    {"expression": "x < 0 ? NaN : -5", "color": "#0055AA", "fill": true}
  ]
}

3. For "heart shape":
{
  "equations": [
    {"expression": "sqrt(1-abs(x)) * cos(pi * x)", "color": "#FF0066", "fill": true}
  ]
}

IMPORTANT: Return ONLY the JSON. Do not add explanations before or after.`;

// Define available models - exactly matching the PenTestAI implementation
const AVAILABLE_MODELS = {
  gpt4: {
    id: "gpt-4o",
    name: "GPT-4o"
  },
  deepseek: {
    id: "DeepSeek-R1", 
    name: "DeepSeek R1"
  },
  "llama-3.1": {
    id: "Meta-Llama-3.1-405B-Instruct",
    name: "Llama 3.1 (405B)"
  },
  mistral: {
    id: "Mistral-Large-2411",
    name: "Mistral Large"
  },
  phi4: {
    id: "Phi-4",
    name: "Phi-4"
  }
};

// Function to call AI API with detailed error logging
const callAI = async (message, modelChoice = "gpt4") => {
  // Log the request for debugging
  const requestLog = {
    timestamp: new Date().toISOString(),
    model: modelChoice,
    message: message,
    token: process.env.GITHUB_TOKEN ? `${process.env.GITHUB_TOKEN.substring(0, 5)}...` : "no token"
  };
  
  console.log("API Request:", JSON.stringify(requestLog, null, 2));
  
  // Create Azure client with the GitHub token
  const client = ModelClient(
    "https://models.github.ai/inference",
    new AzureKeyCredential(process.env.GITHUB_TOKEN),
    {
      timeout: 90000,
      retries: 2,
    }
  );
  
  // Get the full model ID from our model choice
  const selectedModel = AVAILABLE_MODELS[modelChoice]?.id || AVAILABLE_MODELS.gpt4.id;
  console.log(`Using model: ${selectedModel}`);
  
  try {
    // Create request body - EXACTLY matching the PenTestAI implementation
    // NOTE: No provider parameter!
    const requestBody = {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: message },
      ],
      model: selectedModel,
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
    };
    
    // Log the API endpoint we're calling
    console.log("Calling API endpoint: https://models.github.ai/inference/chat/completions");
    console.log("Full request body:", JSON.stringify(requestBody, null, 2));
    
    // Make the API call
    const response = await client.path("/chat/completions").post({
      body: requestBody
    });
    
    // Log the response status
    console.log("API Response status:", response.status);
    
    if (isUnexpected(response)) {
      console.error("Unexpected response:", JSON.stringify(response.body, null, 2));
      throw new Error(`Model Error: ${response.body.error || JSON.stringify(response.body)}`);
    }
    
    // Extract the content from the response
    const result = {
      content: response.body.choices[0].message.content,
      model: {
        requested: modelChoice,
        actual: selectedModel,
        displayName: AVAILABLE_MODELS[modelChoice]?.name || "Unknown Model",
      },
    };
    
    // Log successful response
    console.log("Response received:", JSON.stringify({
      modelUsed: result.model.displayName,
      contentLength: result.content.length,
      contentPreview: result.content.substring(0, 100) + "..."
    }, null, 2));
    
    return result;
  } catch (error) {
    // Enhanced error logging
    console.error("API Error Details:");
    console.error("- Error name:", error.name);
    console.error("- Error message:", error.message);
    console.error("- Stack trace:", error.stack);
    
    if (error.response) {
      console.error("- Response status:", error.response.status);
      console.error("- Response data:", JSON.stringify(error.response.data, null, 2));
    }
    
    // Check for specific error types
    if (error.message.includes("FUNCTION_INVOCATION_TIMEOUT")) {
      throw new Error("The model is taking too long to respond. Try a shorter query or switch to a different model.");
    }
    
    // For GitHub token related errors
    if (error.message.includes("401") || error.message.includes("403") || error.message.includes("authentication")) {
      throw new Error("Authentication failed. Please check your GitHub token.");
    }
    
    // Otherwise throw the original error
    throw error;
  }
};

// Generate equations with AI
const generateEquations = async (req, res) => {
  // Log incoming request
  console.log("Received request:", {
    method: req.method,
    path: req.path,
    body: req.body ? JSON.stringify(req.body, null, 2) : null
  });
  
  const { message, model } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }
  
  try {
    // Check if GitHub token is set
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GitHub token is not configured. Please add it to your .env file.");
    }
    
    // Call AI and get response
    const response = await callAI(message, model || "gpt4");
    
    // Return success response
    res.json({
      response: response.content,
      model: response.model
    });
  } catch (error) {
    console.error("Error generating equations:", error);
    
    // Return error response with detailed information
    res.status(500).json({
      error: error.message || "Failed to get response from AI",
      model: {
        requested: model,
        displayName: AVAILABLE_MODELS[model]?.name || "Unknown Model",
      },
    });
  }
};

// Get available models
const getModels = (req, res) => {
  res.json({
    models: Object.entries(AVAILABLE_MODELS).map(([key, value]) => ({
      id: key,
      name: value.name,
    })),
  });
};

module.exports = { generateEquations, getModels };