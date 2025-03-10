# AI-Powered Graphing Calculator

An interactive web application that combines a powerful graphing calculator with AI assistance to visualize mathematical equations.

## Features

- Interactive graphing calculator similar to Desmos
- AI-powered scene generation to create equations from natural language descriptions
- Support for multiple AI models
- Manual equation input with custom colors
- Zoom and pan controls for graph navigation

## Setup

1. Clone this repository
2. Create a .env file with your GitHub API token:
   `
   GITHUB_TOKEN=your_github_token_here
   `
3. Install dependencies:
   `
   npm install
   `
4. Start the server:
   `
   npm start
   `
5. Open your browser and navigate to http://localhost:3000

## Usage

### Manual Equation Input
- Enter equations in the right panel
- Choose a color for each equation
- Click "Add" to visualize the equation

### AI Scene Generation
1. Select an AI model from the dropdown
2. Enter a description of the scene you want to visualize
3. Click "Generate" to have the AI create equations that represent the scene
4. The generated equations will be automatically added to the graph

## Technologies Used

- Node.js and Express for the backend
- Vanilla JavaScript for the frontend
- Function-plot.js for graphing functionality
- Azure AI inference API for AI integration

## Supported AI Models

- DeepSeek-R1
- DeepSeek-V3
- Meta-Llama-3.1-405B-Instruct
- Mistral-Large-2411
- GPT-4o
