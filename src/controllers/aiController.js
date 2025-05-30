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

// Remove AVAILABLE_MODELS and model selection logic
// Only use the NVIDIA NIM model: meta/llama-4-maverick-17b-128e-instruct

const callAI = async (message) => {
  console.log(`[Debug] Starting API call with NVIDIA NIM model`);

  const client = new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_NIM_API_KEY,
  });

  const selectedModel = "meta/llama-4-maverick-17b-128e-instruct";
  console.log(`Using model: ${selectedModel}`);

  try {
    console.log("[Debug] Request structure:", {
      model: selectedModel,
      tokensProvided: process.env.NVIDIA_NIM_API_KEY ? "Yes" : "No",
    });

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
      content: response.choices[0].delta?.content || response.choices[0].message?.content,
      model: {
        requested: selectedModel,
        actual: selectedModel,
        displayName: "Llama-4 Maverick 17B",
      },
    };
  } catch (error) {
    console.error("[Debug] API Error:", error.message);

    if (error.message.includes("timeout")) {
      throw new Error(
        "The model is taking too long to respond. Try a shorter query."
      );
    }
    throw error;
  }
};

// Update generateEquations to not expect a model parameter
const generateEquations = async (req, res) => {
  console.log("[Debug] Received API request:", {
    path: req.path,
    method: req.method,
  });

  const { message } = req.body;

  console.log("[Debug] Request parameters:", {
    messageLength: message ? message.length : 0,
  });

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const response = await callAI(message);
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
        requested: "meta/llama-4-maverick-17b-128e-instruct",
        displayName: "Llama-4 Maverick 17B",
      },
    });
  }
};

module.exports = { generateEquations };
