// test-token.js
// A simple script to test if your GitHub token works with the AI API
// Save this to a file and run with: node test-token.js
require('dotenv').config();
const { default: ModelClient } = require('@azure-rest/ai-inference');
const { AzureKeyCredential } = require('@azure/core-auth');
const { isUnexpected } = require('@azure-rest/ai-inference');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Simple request to test token validity
async function testToken() {
  console.log(`${colors.blue}Testing GitHub AI Token...${colors.reset}`);
  
  // Verify token exists
  if (!process.env.GITHUB_TOKEN) {
    console.error(`${colors.red}Error: No GITHUB_TOKEN found in .env file${colors.reset}`);
    return false;
  }
  
  const token = process.env.GITHUB_TOKEN;
  console.log(`${colors.yellow}Token (first 5 chars): ${token.substring(0, 5)}...${colors.reset}`);
  
  // Create client
  const client = ModelClient(
    "https://models.github.ai/inference",
    new AzureKeyCredential(token),
    {
      timeout: 30000,
      retries: 1,
    }
  );
  
  try {
    // Testing with DeepSeek model as it may have fewer restrictions
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          { role: "user", content: "Hello, can you hear me?" },
        ],
        model: "DeepSeek-R1",
        temperature: 0.7,
        max_tokens: 100,
        top_p: 1,
      },
    });
    
    if (isUnexpected(response)) {
      console.error(`${colors.red}API Error: ${response.body.error || "Unknown error"}${colors.reset}`);
      return false;
    }
    
    const content = response.body.choices[0].message.content;
    console.log(`${colors.green}Success! Response received:${colors.reset}`);
    console.log(`${colors.blue}${content}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error testing token:${colors.reset}`);
    console.error(error.message);
    
    if (error.message.includes("401") || error.message.includes("403")) {
      console.error(`${colors.red}Authentication failed. The token appears to be invalid or expired.${colors.reset}`);
    } else if (error.message.includes("FUNCTION_INVOCATION_TIMEOUT")) {
      console.error(`${colors.yellow}Request timed out. The API might be slow or overloaded.${colors.reset}`);
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error(`${colors.red}Connection error. Check your internet connection or if the API endpoint is correct.${colors.reset}`);
    }
    
    return false;
  }
}

// Run the test
(async () => {
  const result = await testToken();
  if (result) {
    console.log(`${colors.green}✓ Token is valid and working correctly!${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Token test failed. See errors above.${colors.reset}`);
  }
})();