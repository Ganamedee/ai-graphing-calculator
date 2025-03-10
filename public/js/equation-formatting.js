// Improved equation formatting with better conditional rendering
function formatEquation(equationText) {
  try {
    // Convert to proper LaTeX format
    let latexEquation = equationText;

    // Handle conditional expressions better
    if (equationText.includes("?") && equationText.includes(":")) {
      // Extract the parts of a ternary operator
      const matches = equationText.match(/([^?]+)\?([^:]+):(.+)/) || [];

      if (matches.length >= 4) {
        const condition = matches[1].trim();
        const truePart = matches[2].trim();
        const falsePart = matches[3].trim();

        // Check if false part is just NaN (used for bounded regions)
        if (falsePart === "NaN") {
          // For bounded regions, we can simplify
          // Replace "x < 5 ? f(x) : NaN" with "f(x) for x < 5"
          if (
            condition.includes("<") ||
            condition.includes(">") ||
            condition.includes("=")
          ) {
            latexEquation = `${truePart} \\text{ for } ${condition}`;
          } else {
            // For complex conditions
            latexEquation = `${truePart} \\text{ when bounded by } ${condition}`;
          }
        } else {
          // For a full conditional, use cases but replace "otherwise" with a clearer description
          latexEquation = `\\begin{cases} 
            ${truePart} & \\text{when } ${condition} \\\\
            ${falsePart} & \\text{when not } ${condition.replace(
            /&&/g,
            "\\text{ and }"
          )}
          \\end{cases}`;
        }
      }
    } else {
      // For non-conditional expressions, just do regular replacements
      latexEquation = latexEquation
        // Handle square roots
        .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
        // Handle powers/exponents
        .replace(/\^(\d+)/g, "^{$1}")
        .replace(/\^([a-zA-Z])/g, "^{$1}")
        // Handle fractions like "1/2"
        .replace(/(\d+)\/(\d+)/g, "\\frac{$1}{$2}")
        // Handle trig functions
        .replace(/sin\(/g, "\\sin(")
        .replace(/cos\(/g, "\\cos(")
        .replace(/tan\(/g, "\\tan(")
        // Handle logs
        .replace(/log\(/g, "\\log(")
        .replace(/ln\(/g, "\\ln(")
        // Handle absolute value
        .replace(/abs\(([^)]+)\)/g, "|$1|");
    }

    // Wrap for KaTeX display
    if (!latexEquation.startsWith("y =") && !latexEquation.startsWith("y=")) {
      latexEquation = "y = " + latexEquation;
    }

    return latexEquation;
  } catch (error) {
    console.error("Error formatting equation:", error);
    return equationText;
  }
}

// Function to render equation in the list (unchanged)
function renderEquation(containerElement, equation) {
  try {
    if (!containerElement) return;

    // Clear existing content
    containerElement.innerHTML = "";

    // Create formatted display element
    const displayElement = document.createElement("div");
    displayElement.className = "katex-equation";

    // Add the raw text as a data attribute and title for reference
    displayElement.setAttribute("data-raw", equation);
    displayElement.title = equation;

    // Try to format and render with KaTeX
    try {
      const formattedEquation = formatEquation(equation);
      katex.render(formattedEquation, displayElement, {
        throwOnError: false,
        displayMode: false,
        output: "html",
        trust: true,
      });
    } catch (katexError) {
      // Fallback to plain text if KaTeX fails
      console.warn("KaTeX rendering failed:", katexError);
      displayElement.textContent = equation;
    }

    // Add to container
    containerElement.appendChild(displayElement);
  } catch (error) {
    console.error("Error rendering equation:", error);
    containerElement.textContent = equation; // Fallback
  }
}
