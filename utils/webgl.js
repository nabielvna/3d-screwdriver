/**
 * @param {HTMLCanvasElement} canvas
 * @returns {WebGLRenderingContext|null}
 */
export function initWebGL(canvas) {
    const contextAttributes = {
      alpha: false,
      antialias: true,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      stencil: false
    };
  
    let gl = canvas.getContext("webgl", contextAttributes) ||
            canvas.getContext("experimental-webgl", contextAttributes);
  
    if (!gl) {
      console.error("WebGL not supported");
      return null;
    }
  
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
    return gl;
  }
  
  /**
   * @param {WebGLRenderingContext} gl
   * @param {string} vsSource
   * @param {string} fsSource
   * @returns {WebGLProgram|null}
   */
  export function createShaderProgram(gl, vsSource, fsSource) {
    function compileShader(gl, source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
  
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
          `Shader compilation error: ${gl.getShaderInfoLog(shader)}`,
          `Shader type: ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"}`,
          `Source:\n${source}`
        );
        gl.deleteShader(shader);
        return null;
      }
  
      return shader;
    }
  
    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  
    if (!vertexShader || !fragmentShader) {
      return null;
    }
  
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
  
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader program linking failed:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
  
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  
    return program;
  }
  
  /**
   * @param {WebGLRenderingContext} gl 
   * @param {Object} meshData 
   * @returns {Object}
   */
  export function createBuffers(gl, meshData) {
    const buffers = {};
  
    if (meshData.positions) {
      buffers.position = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.positions), gl.STATIC_DRAW);
    }
  
    if (meshData.normals) {
      buffers.normal = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.normals), gl.STATIC_DRAW);
    }
  
    if (meshData.indices) {
      buffers.index = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.indices), gl.STATIC_DRAW);
    }
  
    return buffers;
  }
  
  /**
   * @param {WebGLRenderingContext} gl
   * @param {HTMLImageElement} image
   * @returns {WebGLTexture}
   */
  export function createTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
    return texture;
  }
  
  /**
   * @param {WebGLRenderingContext} gl
   * @param {HTMLCanvasElement} canvas
   */
  export function setupViewport(gl, canvas) {
    function resizeCanvas() {
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
  }
  
  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} program
   * @param {string[]} attributeNames
   * @param {string[]} uniformNames
   * @returns {Object}
   */
  export function getProgramLocations(gl, program, attributeNames, uniformNames) {
    const locations = {
      attributes: {},
      uniforms: {}
    };
  
    attributeNames.forEach(name => {
      locations.attributes[name] = gl.getAttribLocation(program, name);
    });
  
    uniformNames.forEach(name => {
      locations.uniforms[name] = gl.getUniformLocation(program, name);
    });
  
    return locations;
  }