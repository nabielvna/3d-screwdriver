export const vertexShaderSource = `
  // Input attributes from buffers
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  
  // Transformation matrices
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix;
  
  // Output varying variables for fragment shader
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  
  void main() {
    // Transform vertex position into view space
    vec4 position = uModelViewMatrix * vec4(aPosition, 1.0);
    
    // Output final position
    gl_Position = uProjectionMatrix * position;
    
    // Transform normal into view space
    vNormal = (uNormalMatrix * vec4(aNormal, 0.0)).xyz;
    
    // Pass position data to fragment shader
    vPosition = position.xyz;
    vViewPosition = -position.xyz;
  }
`;

export const fragmentShaderSource = `
  precision highp float;

  // Input varying variables from vertex shader
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  // Light properties
  uniform vec3 uLightPosition;
  uniform vec3 uLightColor;
  uniform float uLightIntensity;

  // Material properties
  uniform vec3 uAmbientColor;
  uniform vec3 uDiffuseColor;
  uniform vec3 uSpecularColor;
  uniform float uShininess;
  uniform float uOpacity;

  void main() {
    // Normalize vectors
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    
    // Calculate halfway vector for specular lighting
    vec3 halfwayDir = normalize(lightDir + viewDir);
    
    // Ambient component
    vec3 ambient = uAmbientColor * 0.2;
    
    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uDiffuseColor * uLightColor * uLightIntensity;
    
    // Specular component
    float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
    vec3 specular = spec * uSpecularColor * uLightColor;
    
    // Combine components for final color
    vec3 result = ambient + diffuse + specular;
    
    // Output final color with opacity
    gl_FragColor = vec4(result, uOpacity);
  }
`;

export const defaultMaterial = {
  ambient: [0.2, 0.2, 0.2],
  diffuse: [0.8, 0.8, 0.8],
  specular: [0.5, 0.5, 0.5],
  shininess: 32.0,
  opacity: 1.0
};

export const defaultLight = {
  position: [5.0, 5.0, 5.0],
  color: [1.0, 1.0, 1.0],
  intensity: 1.0
};