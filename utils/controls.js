import { Matrix4 } from '../lib/matrix4.js';

export class CameraControls {
  /**
   * @param {HTMLCanvasElement} canvas 
   */
  constructor(canvas) {
    this.canvas = canvas;
    
    // Camera state
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.rotationX = 0;
    this.rotationY = 0;
    this.zoomLevel = 5;

    // Constants
    this.ROTATION_SPEED = 0.005;
    this.ZOOM_SPEED = 0.001;
    this.MIN_ZOOM = 2;
    this.MAX_ZOOM = 20;
    this.MAX_ROTATION_X = Math.PI / 2.2;

    // Bind event handlers
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleWheel = this._handleWheel.bind(this);
    this._handleDoubleClick = this._handleDoubleClick.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this._handleMouseDown);
    this.canvas.addEventListener('mousemove', this._handleMouseMove);
    this.canvas.addEventListener('mouseup', this._handleMouseUp);
    this.canvas.addEventListener('mouseleave', this._handleMouseUp);
    this.canvas.addEventListener('wheel', this._handleWheel);
    this.canvas.addEventListener('dblclick', this._handleDoubleClick);

    // Touch events
    this.canvas.addEventListener('touchstart', this._handleTouchStart);
    this.canvas.addEventListener('touchmove', this._handleTouchMove);
    this.canvas.addEventListener('touchend', this._handleTouchEnd);
  }

  dispose() {
    // Mouse events
    this.canvas.removeEventListener('mousedown', this._handleMouseDown);
    this.canvas.removeEventListener('mousemove', this._handleMouseMove);
    this.canvas.removeEventListener('mouseup', this._handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this._handleMouseUp);
    this.canvas.removeEventListener('wheel', this._handleWheel);
    this.canvas.removeEventListener('dblclick', this._handleDoubleClick);

    // Touch events
    this.canvas.removeEventListener('touchstart', this._handleTouchStart);
    this.canvas.removeEventListener('touchmove', this._handleTouchMove);
    this.canvas.removeEventListener('touchend', this._handleTouchEnd);
  }

  /**
   * @param {MouseEvent} event 
   */
  _handleMouseDown(event) {
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  /**
   * @param {MouseEvent} event 
   */
  _handleMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;

    this.rotationY += deltaX * this.ROTATION_SPEED;
    this.rotationX += deltaY * this.ROTATION_SPEED;

    this.rotationX = Math.max(
      -this.MAX_ROTATION_X,
      Math.min(this.MAX_ROTATION_X, this.rotationX)
    );

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  _handleMouseUp() {
    this.isDragging = false;
  }

  /**
   * @param {WheelEvent} event 
   */
  _handleWheel(event) {
    event.preventDefault();
    this.zoomLevel += event.deltaY * this.ZOOM_SPEED;
    this.zoomLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoomLevel));
  }

  _handleDoubleClick() {
    this.reset();
  }

  /**
   * @param {TouchEvent} event 
   */
  _handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = event.touches[0].clientX;
      this.lastMouseY = event.touches[0].clientY;
    }
  }

  /**
   * @param {TouchEvent} event 
   */
  _handleTouchMove(event) {
    event.preventDefault();
    if (!this.isDragging || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.lastMouseX;
    const deltaY = touch.clientY - this.lastMouseY;

    this.rotationY += deltaX * this.ROTATION_SPEED;
    this.rotationX += deltaY * this.ROTATION_SPEED;

    this.rotationX = Math.max(
      -this.MAX_ROTATION_X,
      Math.min(this.MAX_ROTATION_X, this.rotationX)
    );

    this.lastMouseX = touch.clientX;
    this.lastMouseY = touch.clientY;
  }

  _handleTouchEnd() {
    this.isDragging = false;
  }

  reset() {
    this.rotationX = 0;
    this.rotationY = 0;
    this.zoomLevel = 5;
  }

  /**
   * @returns {Object}
   */
  getState() {
    return {
      rotationX: this.rotationX,
      rotationY: this.rotationY,
      zoomLevel: this.zoomLevel
    };
  }

  /**
   * @returns {Float32Array} 
   */
  updateModelViewMatrix() {
    const modelViewMatrix = Matrix4.create();
    
    Matrix4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -this.zoomLevel]);
    
    Matrix4.rotateX(modelViewMatrix, modelViewMatrix, this.rotationX);
    Matrix4.rotateY(modelViewMatrix, modelViewMatrix, this.rotationY);

    return modelViewMatrix;
  }
}