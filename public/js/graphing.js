// Graphing functionality
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
    this.plotInstance = functionPlot({
      target: `#${this.containerId}`,
      width: document.getElementById(this.containerId).clientWidth,
      height: document.getElementById(this.containerId).clientHeight,
      grid: true,
      xAxis: { domain: this.xRange },
      yAxis: { domain: this.yRange },
      disableZoom: false,
      data: []
    });

    // Make the graph responsive
    window.addEventListener('resize', () => {
      if (this.plotInstance) {
        this.plotInstance.width = document.getElementById(this.containerId).clientWidth;
        this.plotInstance.height = document.getElementById(this.containerId).clientHeight;
        this.plotInstance.draw();
      }
    });
  }

  addEquation(equation, color = '#3366FF', fill = false) {
    try {
      // Create a unique ID for the equation
      const id = Date.now().toString();
      
      // Parse equation to determine if it's parametric
      const isParametric = equation.includes('x(t)') || equation.includes('y(t)');
      
      let graphData;
      
      if (isParametric) {
        // Handle parametric equations
        const xFunc = equation.match(/x\(t\)\s*=\s*([^,;]+)/)?.[1];
        const yFunc = equation.match(/y\(t\)\s*=\s*([^,;]+)/)?.[1];
        
        if (!xFunc || !yFunc) {
          throw new Error('Invalid parametric equation format. Use x(t) = ... and y(t) = ...');
        }
        
        graphData = {
          parametric: true,
          x: xFunc,
          y: yFunc,
          range: [0, 2 * Math.PI],
          fnType: 'parametric',
          graphType: 'polyline',
          color: color
        };
      } else {
        // Handle standard equations
        // Check if the equation is in the form "y = ..."
        if (equation.startsWith('y=') || equation.startsWith('y =')) {
          equation = equation.replace(/^y\s*=\s*/, '');
        }
        
        graphData = {
          fn: equation,
          color: color,
          graphType: 'polyline'
        };
        
        // Add filling if requested
        if (fill) {
          graphData.closed = true;
          graphData.filled = true;
        }
      }
      
      // Save the equation with metadata
      this.equations.push({
        id,
        text: equation,
        color,
        fill,
        data: graphData
      });
      
      // Update the graph
      this.redrawGraph();
      
      return id;
    } catch (error) {
      console.error('Error adding equation:', error);
      throw error;
    }
  }

  removeEquation(id) {
    this.equations = this.equations.filter(eq => eq.id !== id);
    this.redrawGraph();
  }

  redrawGraph() {
    if (this.plotInstance) {
      this.plotInstance.options.data = this.equations.map(eq => eq.data);
      this.plotInstance.draw();
    }
  }

  zoomIn() {
    const xCenter = (this.xRange[0] + this.xRange[1]) / 2;
    const yCenter = (this.yRange[0] + this.yRange[1]) / 2;
    const xScale = 0.8;
    const yScale = 0.8;
    
    this.xRange = [
      xCenter - (xCenter - this.xRange[0]) * xScale,
      xCenter + (this.xRange[1] - xCenter) * xScale
    ];
    
    this.yRange = [
      yCenter - (yCenter - this.yRange[0]) * yScale,
      yCenter + (this.yRange[1] - yCenter) * yScale
    ];
    
    this.updateViewport();
  }

  zoomOut() {
    const xCenter = (this.xRange[0] + this.xRange[1]) / 2;
    const yCenter = (this.yRange[0] + this.yRange[1]) / 2;
    const xScale = 1.2;
    const yScale = 1.2;
    
    this.xRange = [
      xCenter - (xCenter - this.xRange[0]) * xScale,
      xCenter + (this.xRange[1] - xCenter) * xScale
    ];
    
    this.yRange = [
      yCenter - (yCenter - this.yRange[0]) * yScale,
      yCenter + (this.yRange[1] - yCenter) * yScale
    ];
    
    this.updateViewport();
  }

  resetView() {
    this.xRange = [-10, 10];
    this.yRange = [-10, 10];
    this.updateViewport();
  }

  updateViewport() {
    if (this.plotInstance) {
      this.plotInstance.options.xAxis.domain = this.xRange;
      this.plotInstance.options.yAxis.domain = this.yRange;
      this.plotInstance.draw();
    }
  }

  clearAllEquations() {
    this.equations = [];
    this.redrawGraph();
  }

  // Parse and add multiple equations from AI response
  addEquationsFromJSON(jsonData) {
    try {
      // First clear existing equations if needed
      this.clearAllEquations();
      
      const equations = jsonData.equations || [];
      
      equations.forEach(eq => {
        this.addEquation(eq.expression, eq.color, eq.fill);
      });
      
      return true;
    } catch (error) {
      console.error('Error adding equations from JSON:', error);
      return false;
    }
  }
}