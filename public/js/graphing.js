// File: public/js/graphing.js
// Simplified GraphingCalculator class that works with function-plot.js
class GraphingCalculator {
  constructor(containerId) {
    this.containerId = containerId;
    this.equations = [];
    this.plotInstance = null;
    this.xRange = [-10, 10];
    this.yRange = [-10, 10];
    this.initGraph();
  }

  initGraph() {
    try {
      console.log("Initializing graph in container:", this.containerId);
      const containerElement = document.getElementById(this.containerId);
      if (!containerElement) {
        console.error(`Container element ${this.containerId} not found`);
        return;
      }

      // Create the function-plot instance with proper settings
      this.plotInstance = functionPlot({
        target: `#${this.containerId}`,
        width: containerElement.clientWidth,
        height: containerElement.clientHeight,
        grid: true,
        xAxis: {
          domain: this.xRange,
          label: "x",
        },
        yAxis: {
          domain: this.yRange,
          label: "y",
        },
        // CRITICAL: Enable built-in zooming/panning
        disableZoom: false,
        data: [],
        // Add custom grid settings for better visibility
        grid: {
          verticalLines: true,
          horizontalLines: true,
          width: 1.5, // Thicker grid lines
        },
      });

      // Setup window resize handler
      window.addEventListener("resize", () => {
        if (this.plotInstance) {
          const container = document.getElementById(this.containerId);
          if (container) {
            this.plotInstance.width = container.clientWidth;
            this.plotInstance.height = container.clientHeight;
            this.plotInstance.draw();
          }
        }
      });

      // Hook up the zoom buttons manually
      this.attachZoomControls();

      console.log("Graph initialized successfully");
    } catch (error) {
      console.error("Error initializing graph:", error);
    }
  }

  attachZoomControls() {
    // Get the control buttons
    const zoomInBtn = document.getElementById("zoom-in");
    const zoomOutBtn = document.getElementById("zoom-out");
    const resetViewBtn = document.getElementById("reset-view");

    // Add click handlers directly that don't interfere with mouse events
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", (e) => {
        console.log("Zoom in clicked");
        this.zoomIn();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", (e) => {
        console.log("Zoom out clicked");
        this.zoomOut();
      });
    }

    if (resetViewBtn) {
      resetViewBtn.addEventListener("click", (e) => {
        console.log("Reset view clicked");
        this.resetView();
      });
    }

    console.log("Zoom controls attached");
  }

  // Updated addEquation method with thickness parameter
  addEquation(
    equation,
    color = "#3366FF",
    fill = false,
    fixedToViewport = true,
    thickness = 2 // Default thickness
  ) {
    try {
      // Create a unique ID for the equation
      const id = Date.now().toString();

      console.log(
        `Adding equation: ${equation}, color: ${color}, fill: ${fill}, fixedToViewport: ${fixedToViewport}, thickness: ${thickness}`
      );

      // Parse equation to determine if it's parametric
      const isParametric =
        equation.includes("x(t)") || equation.includes("y(t)");

      let graphData;

      if (isParametric) {
        // Handle parametric equations
        const xFunc = equation.match(/x\(t\)\s*=\s*([^,;]+)/)?.[1];
        const yFunc = equation.match(/y\(t\)\s*=\s*([^,;]+)/)?.[1];

        if (!xFunc || !yFunc) {
          throw new Error(
            "Invalid parametric equation format. Use x(t) = ... and y(t) = ..."
          );
        }

        graphData = {
          parametric: true,
          x: xFunc,
          y: yFunc,
          range: [0, 2 * Math.PI],
          fnType: "parametric",
          graphType: "polyline",
          color: color,
          width: thickness, // Add thickness to the graph data
        };
      } else {
        // Handle standard equations
        // Check if the equation is in the form "y = ..."
        if (equation.startsWith("y=") || equation.startsWith("y =")) {
          equation = equation.replace(/^y\s*=\s*/, "");
        }

        // SIMPLIFY: Just remove all conditionals to test basic functionality
        let cleanEquation = equation;

        // If this is a conditional expression, extract just the "true" part
        if (equation.includes("?") && equation.includes(":")) {
          const parts = equation.split("?");
          if (parts.length > 1) {
            const truePart = parts[1].split(":")[0];
            cleanEquation = truePart.trim();
            console.log("Extracted from conditional:", cleanEquation);
          }
        }

        // Simple pre-processing - mostly just clean up spaces
        cleanEquation = cleanEquation.replace(/\s+/g, " ").trim();

        // For filled shapes, use domain restrictions instead of conditionals
        const range = fixedToViewport ? this.xRange : [-10, 10];

        graphData = {
          fn: cleanEquation,
          color: color,
          graphType: "polyline",
          width: thickness, // Add thickness to the graph data
        };

        // Use explicit range for all filled equations
        if (fill) {
          graphData.closed = true;
          graphData.filled = true;
          graphData.xDomain = range; // This is function-plot's way of limiting domain
        }
      }

      // Save the equation with metadata
      const equationData = {
        id,
        text: equation, // Save the original equation text for editing
        color,
        fill,
        thickness, // Store thickness with the equation
        fixedToViewport, // Flag to track if equation should be fixed to viewport
        data: graphData,
      };

      this.equations.push(equationData);

      // Update the graph
      this.redrawGraph();

      return id;
    } catch (error) {
      console.error("Error adding equation:", error);
      throw error;
    }
  }

  // Updated to preserve fixedToViewport setting and include thickness
  updateEquation(id, newEquation, newColor, newFill, newThickness) {
    try {
      const index = this.equations.findIndex((eq) => eq.id === id);
      if (index === -1) {
        throw new Error(`Equation with id ${id} not found`);
      }

      // Get the original fixedToViewport setting
      const fixedToViewport = this.equations[index].fixedToViewport || false;

      // Use provided thickness or fallback to the original value
      const thickness =
        newThickness !== undefined
          ? newThickness
          : this.equations[index].thickness || 2;

      // Remove the existing equation
      this.equations.splice(index, 1);

      // Add the updated equation with the same fixedToViewport setting and thickness
      const newId = this.addEquation(
        newEquation,
        newColor,
        newFill,
        fixedToViewport,
        thickness
      );

      // Return the new ID
      return newId;
    } catch (error) {
      console.error("Error updating equation:", error);
      throw error;
    }
  }

  removeEquation(id) {
    this.equations = this.equations.filter((eq) => eq.id !== id);
    this.redrawGraph();
  }

  redrawGraph() {
    if (this.plotInstance) {
      try {
        // Get the current data from equations
        const data = this.equations.map((eq) => {
          // Clone the data to avoid reference issues
          return { ...eq.data };
        });

        // Update the plot instance data
        this.plotInstance.options.data = data;

        // Force a redraw
        this.plotInstance.draw();

        console.log("Graph redrawn with", data.length, "equations");
      } catch (error) {
        console.error("Error redrawing graph:", error);
      }
    } else {
      console.error("Plot instance not initialized");
    }
  }

  // Enhanced clearAllEquations method to fix residual elements issue
  clearAllEquations() {
    // Ensure we completely clear all equations
    this.equations = [];

    // Reset the plot instance completely
    if (this.plotInstance) {
      // Clear the plot data
      this.plotInstance.options.data = [];

      // Get the container element
      const container = document.getElementById(this.containerId);
      if (container) {
        // Force a complete redraw with empty data
        try {
          // Complete reset of the plotting instance
          this.plotInstance = functionPlot({
            target: `#${this.containerId}`,
            width: container.clientWidth,
            height: container.clientHeight,
            grid: true,
            xAxis: {
              domain: this.xRange,
              label: "x",
            },
            yAxis: {
              domain: this.yRange,
              label: "y",
            },
            disableZoom: false,
            data: [],
            grid: {
              verticalLines: true,
              horizontalLines: true,
              width: 1.5, // Thicker grid lines
            },
          });
        } catch (error) {
          console.error("Error resetting plot instance:", error);
          // Fallback to just clearing data and redrawing
          this.plotInstance.options.data = [];
          this.plotInstance.draw();
        }
      }
    }

    console.log("All equations cleared");
  }

  // Updated zoom controls with direct viewport manipulation
  zoomIn() {
    try {
      // Get the current center
      const xCenter = (this.xRange[0] + this.xRange[1]) / 2;
      const yCenter = (this.yRange[0] + this.yRange[1]) / 2;

      // Calculate new range (zoom factor of 0.7)
      const xScale = 0.7;
      const yScale = 0.7;

      // Apply zoom centered at current center
      this.xRange = [
        xCenter - (xCenter - this.xRange[0]) * xScale,
        xCenter + (this.xRange[1] - xCenter) * xScale,
      ];

      this.yRange = [
        yCenter - (yCenter - this.yRange[0]) * yScale,
        yCenter + (this.yRange[1] - yCenter) * yScale,
      ];

      console.log("Zoomed in to:", this.xRange, this.yRange);

      // Update the viewport directly
      if (this.plotInstance) {
        // This fixes the direct manipulation of the viewport
        this.plotInstance.meta.xDomain = this.xRange;
        this.plotInstance.meta.yDomain = this.yRange;
        this.plotInstance.options.xAxis.domain = this.xRange;
        this.plotInstance.options.yAxis.domain = this.yRange;

        // Update bounded equations
        this.updateBoundedEquations();

        // Force a complete redraw
        this.plotInstance.draw();
      }
    } catch (error) {
      console.error("Error zooming in:", error);
    }
  }

  zoomOut() {
    try {
      // Get the current center
      const xCenter = (this.xRange[0] + this.xRange[1]) / 2;
      const yCenter = (this.yRange[0] + this.yRange[1]) / 2;

      // Calculate new range (zoom factor of 1.4)
      const xScale = 1.4;
      const yScale = 1.4;

      // Apply zoom centered at current center
      this.xRange = [
        xCenter - (xCenter - this.xRange[0]) * xScale,
        xCenter + (this.xRange[1] - xCenter) * xScale,
      ];

      this.yRange = [
        yCenter - (yCenter - this.yRange[0]) * yScale,
        yCenter + (this.yRange[1] - yCenter) * yScale,
      ];

      console.log("Zoomed out to:", this.xRange, this.yRange);

      // Update the viewport directly
      if (this.plotInstance) {
        // This fixes the direct manipulation of the viewport
        this.plotInstance.meta.xDomain = this.xRange;
        this.plotInstance.meta.yDomain = this.yRange;
        this.plotInstance.options.xAxis.domain = this.xRange;
        this.plotInstance.options.yAxis.domain = this.yRange;

        // Update bounded equations
        this.updateBoundedEquations();

        // Force a complete redraw
        this.plotInstance.draw();
      }
    } catch (error) {
      console.error("Error zooming out:", error);
    }
  }

  resetView() {
    try {
      // Reset to default range
      this.xRange = [-10, 10];
      this.yRange = [-10, 10];

      console.log("View reset to default");

      // Update the viewport directly
      if (this.plotInstance) {
        // This fixes the direct manipulation of the viewport
        this.plotInstance.meta.xDomain = this.xRange;
        this.plotInstance.meta.yDomain = this.yRange;
        this.plotInstance.options.xAxis.domain = this.xRange;
        this.plotInstance.options.yAxis.domain = this.yRange;

        // Update bounded equations
        this.updateBoundedEquations();

        // Force a complete redraw
        this.plotInstance.draw();
      }
    } catch (error) {
      console.error("Error resetting view:", error);
    }
  }

  // Updated to respect fixedToViewport setting with explicit domain instead of conditionals
  updateBoundedEquations() {
    let needsRedraw = false;

    // Loop through all equations and update any that need viewport-dependent bounds
    for (let i = 0; i < this.equations.length; i++) {
      const eq = this.equations[i];

      // Only update equations that are filled and fixed to viewport
      if (eq.fill && eq.fixedToViewport) {
        // Instead of conditional expressions, use explicit domain limits
        eq.data.xDomain = this.xRange;

        needsRedraw = true;
      }
    }

    // If we updated any equations, redraw the graph
    if (needsRedraw) {
      this.redrawGraph();
    }
  }

  getEquation(id) {
    return this.equations.find((eq) => eq.id === id);
  }
}
