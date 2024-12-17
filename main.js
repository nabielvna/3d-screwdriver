/**
 * Main application entry point for 3D model viewer
 * Orchestrates all components and handles the main render loop
 */

import { initWebGL, createShaderProgram, createBuffers } from './utils/webgl.js';
import { vertexShaderSource, fragmentShaderSource } from './lib/shaders.js';
import { loadOBJ } from './utils/loaders.js';
import { CameraControls } from './utils/controls.js';
import { Renderer } from './renderer/renderer.js';

class ModelViewer {
  /**
   * Initialize the model viewer application
   * @param {string} canvasId - ID of the canvas element
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }

    this.initialize();
  }

  /**
   * Initialize WebGL and all components
   */
  async initialize() {
    try {
      // Initialize WebGL
      this.gl = initWebGL(this.canvas);
      if (!this.gl) {
        throw new Error('WebGL initialization failed');
      }

      // Create and compile shader program
      this.program = createShaderProgram(this.gl, vertexShaderSource, fragmentShaderSource);
      if (!this.program) {
        throw new Error('Shader program creation failed');
      }

      // Set up renderer
      this.renderer = new Renderer(this.gl, this.program);

      // Set up camera controls
      this.controls = new CameraControls(this.canvas);

      // Load default model
      await this.loadModel('assets/Screwdriver.obj', 'assets/Screwdriver.mtl');

      // Set up event listeners
      this.setupEventListeners();

      // Start render loop
      this.startRenderLoop();

    } catch (error) {
      console.error('Initialization failed:', error);
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.renderer.handleResize();
    });

    // File upload handling
    const fileInput = document.getElementById('model-upload');
    if (fileInput) {
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          this.handleModelUpload(file);
        }
      });
    }

    // Add drag and drop support
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.canvas.classList.add('dragover');
    });

    this.canvas.addEventListener('dragleave', () => {
      this.canvas.classList.remove('dragover');
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.canvas.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleModelUpload(file);
      }
    });
  }

  /**
   * Handle model file upload
   * @param {File} file - Uploaded file
   */
  async handleModelUpload(file) {
    try {
      const url = URL.createObjectURL(file);
      await this.loadModel(url);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error loading uploaded model:', error);
      this.showErrorMessage('Failed to load uploaded model');
    }
  }

  /**
   * Load a 3D model
   * @param {string} objUrl - URL of OBJ file
   * @param {string} [mtlUrl] - Optional URL of MTL file
   */
  async loadModel(objUrl, mtlUrl = null) {
    try {
      // Show loading indicator
      this.showLoadingMessage();

      // Load the model
      const modelData = await loadOBJ(objUrl, mtlUrl);

      // Create WebGL buffers
      this.modelBuffers = createBuffers(this.gl, modelData);

      // Store model data
      this.model = {
        buffers: this.modelBuffers,
        materials: modelData.materials,
        materialGroups: modelData.materialGroups
      };

      // Hide loading indicator
      this.hideLoadingMessage();

    } catch (error) {
      console.error('Error loading model:', error);
      this.hideLoadingMessage();
      this.showErrorMessage('Failed to load model');
    }
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    const render = () => {
      if (this.model) {
        const modelViewMatrix = this.controls.updateModelViewMatrix();
        this.renderer.render(this.model, modelViewMatrix);
      }
      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * Show loading message
   */
  showLoadingMessage() {
    const loading = document.getElementById('loading-message');
    if (loading) {
      loading.style.display = 'block';
    }
  }

  /**
   * Hide loading message
   */
  hideLoadingMessage() {
    const loading = document.getElementById('loading-message');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showErrorMessage(message) {
    const error = document.getElementById('error-message');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    // Clean up buffers
    if (this.modelBuffers) {
      const gl = this.gl;
      Object.values(this.modelBuffers).forEach(buffer => {
        gl.deleteBuffer(buffer);
      });
    }
  }
}

// Start the application when the page loads
window.addEventListener('load', () => {
  try {
    window.modelViewer = new ModelViewer('webglCanvas');
  } catch (error) {
    console.error('Failed to start application:', error);
  }
});