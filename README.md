# GraphAI: AI-Powered Graphing Calculator

GraphAI transforms the way you interact with mathematical graphs. This web-based calculator not only lets you plot equations manually but also uses Artificial Intelligence to translate your natural language descriptions of scenes into visual mathematical art.

**Live Demo:** [https://aigraphing.vercel.app](https://aigraphing.vercel.app)

## What it Does

GraphAI bridges the gap between creative descriptions and mathematical visualization. While you can manually input standard mathematical functions (like `y = x^2` or `y = sin(x)`) just like a regular graphing calculator, its unique feature is the AI Scene Generator. Simply type a description of a scene (e.g., "mountains and a sunset", "abstract geometric pattern") into the AI chat panel, select a model, and the AI will attempt to generate a set of equations that visually represent your prompt on the graph canvas.

## Key Features

*   **Interactive Graphing:** Plot standard mathematical functions using `function-plot.js`. Zoom, pan, and reset the view.
*   **AI Scene Generation:** Describe visuals in plain English and let the AI generate the corresponding equations.
*   **Multiple AI Models:** Choose from various models like GPT-4o, Llama 3.1, Phi-4, and DeepSeek (via GitHub/Azure AI Inference API).
*   **Equation Management:** Manually add equations with custom colors and line thickness, toggle area fill, view equations formatted with KaTeX, and edit/delete existing equations.
*   **AI Chat Interface:** Interact with the AI, view prompts and responses.
*   **Resizable Panels:** Adjust the width of the AI Chat, Graph, and Equation panels for optimal viewing.
*   **Keyboard Shortcuts:** Use Enter in the AI prompt to generate visualizations quickly.

## How it Works

*   **Backend:** A Node.js server using Express handles requests to the AI API.
*   **AI Integration:** Uses the OpenAI SDK (configured for the Azure AI endpoint) to communicate with selected language models, guided by a specialized system prompt to generate JSON-formatted equations.
*   **Graphing Engine:** The `function-plot.js` library renders the mathematical functions on an HTML canvas.
*   **Equation Formatting:** KaTeX library displays mathematical notation clearly in the equation list.
*   **Frontend:** The user interface is built with HTML, CSS, and vanilla JavaScript, managing user input, API calls, and graph updates.