// src/controllers/aiController.js - Using the correct OpenAI client approach
require("dotenv").config();
const { OpenAI } = require("openai");

// Updated system prompt with correct conditional expression syntax for function-plot
const systemPrompt = `You are an AI assistant specializing in creating stunning mathematical equations for a graphing calculator that visualizes scenes with exceptional visual quality.

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

SIMPLIFY YOUR EQUATIONS:
- Use simple mathematical expressions without conditional statements
- Do NOT use ternary operators (? :) or conditional expressions
- Do NOT use abs() function if possible
- Instead of complex conditionals for bounded regions, use simple expressions
- For bounded regions, I will handle the domain limitations for you

GUIDELINES FOR EXCEPTIONAL VISUAL QUALITY:
- Create HIGHLY DETAILED scenes by using MANY equations (at least 8-15 for complex scenes)
- Layer multiple shapes to create depth and complexity
- Use standard mathematical notation: sin(x), cos(x), tan(x), x^2, x^3, sqrt(x), etc.
- Choose colors that work harmoniously together and match the scene description
- Create proper layering by ordering equations from background to foreground
- Only include fill:true when appropriate for the visual (like water, ground, or filled shapes)
- Pay attention to perspective and proportion
- Adjust equation parameters to fit in the default viewport range of -10 to 10
- Never include explanations in your response, only valid JSON

EXAMPLES OF CORRECT SIMPLE EXPRESSIONS:
1. For "mountains with a sun and lake":
{
  "equations": [
    {"expression": "-7.5", "color": "#7FB3D5", "fill": true},
    {"expression": "-6 + 0.05*sin(3*x)", "color": "#3498DB", "fill": true},
    {"expression": "-4", "color": "#1B4F72", "fill": true},
    {"expression": "-0.3*x^2 - 1", "color": "#7D3C98", "fill": true},
    {"expression": "-0.5*x^2", "color": "#A569BD", "fill": true},
    {"expression": "-0.2*x^2 - 2", "color": "#5B2C6F", "fill": true},
    {"expression": "-10", "color": "#784212", "fill": true},
    {"expression": "sqrt(16 - (x-6)^2)", "color": "#F1C40F", "fill": true},
    {"expression": "-sqrt(16 - (x-6)^2)", "color": "#F1C40F", "fill": true}
  ]
}

2. For "ocean waves with a boat and sunset":
{
  "equations": [
    {"expression": "5 + sin(x)", "color": "#FF7F50", "fill": true},
    {"expression": "3", "color": "#4682B4", "fill": true},
    {"expression": "2 + 0.5*sin(x + 1)", "color": "#1E90FF", "fill": true},
    {"expression": "1 + 0.3*sin(2*x)", "color": "#0000CD", "fill": true},
    {"expression": "0.5*sin(3*x)", "color": "#191970", "fill": true},
    {"expression": "-1 + 0.2*sin(2*x - 1)", "color": "#000080", "fill": true},
    {"expression": "-2", "color": "#00008B", "fill": true},
    {"expression": "-0.5*x^2 - 1", "color": "#8B4513", "fill": true},
    {"expression": "-0.5*x^2 - 0.2", "color": "#A0522D", "fill": true}
  ]
}

KEEP YOUR EXPRESSIONS SIMPLE WITHOUT CONDITIONALS OR COMPLEX OPERATORS.
RETURN ONLY THE JSON. DO NOT ADD EXPLANATIONS BEFORE OR AFTER.`;

// Define available models with correct IDs
const AVAILABLE_MODELS = {
  gpt4: {
    id: "gpt-4o",
    name: "GPT-4o",
  },
  deepseek: {
    id: "DeepSeek-R1",
    name: "DeepSeek R1",
  },
  "llama-3.1": {
    id: "Meta-Llama-3.1-405B-Instruct",
    name: "Llama 3.1 (405B)",
  },
  mistral: {
    id: "Mistral-Large-2411",
    name: "Mistral Large",
  },
  phi4: {
    id: "Phi-4",
    name: "Phi-4",
  },
};

// Function to call AI API using the OpenAI client
const callAI = async (message, modelChoice = "gpt4") => {
  console.log(`[Debug] Starting API call with model choice: ${modelChoice}`);

  // Initialize the OpenAI client with correct baseURL
  const client = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
  });

  const selectedModel =
    AVAILABLE_MODELS[modelChoice]?.id || AVAILABLE_MODELS.gpt4.id;
  console.log(`Using model: ${selectedModel}`);

  try {
    console.log("[Debug] Request structure:", {
      model: selectedModel,
      tokensProvided: process.env.GITHUB_TOKEN ? "Yes" : "No",
    });

    // Use the new client.chat.completions.create method
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: selectedModel,
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
    });

    console.log(`[Debug] Successfully received response`);

    return {
      content: response.choices[0].message.content,
      model: {
        requested: modelChoice,
        actual: selectedModel,
        displayName: AVAILABLE_MODELS[modelChoice]?.name || "Unknown Model",
      },
    };
  } catch (error) {
    console.error("[Debug] API Error:", error.message);

    if (error.message.includes("timeout")) {
      throw new Error(
        "The model is taking too long to respond. Try a shorter query or switch to a different model."
      );
    }
    throw error;
  }
};

// Generate equations with AI
const generateEquations = async (req, res) => {
  console.log("[Debug] Received API request:", {
    path: req.path,
    method: req.method,
  });

  const { message, model } = req.body;

  console.log("[Debug] Request parameters:", {
    messageLength: message ? message.length : 0,
    model,
  });

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const response = await callAI(message, model);
    res.json({
      response: response.content,
      model: response.model,
    });
  } catch (error) {
    console.error("Error generating equations:", error);
    const errorMessage = error.message || "Failed to get response from AI";
    res.status(500).json({
      error: errorMessage,
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
