import { Matrix4 } from '../lib/matrix4.js';

export class Renderer {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLProgram} program
     */
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        
        this.gl.useProgram(this.program);
        this._initializeState();
        this.locations = this._getLocations();
        this.projectionMatrix = Matrix4.create();
        this._updateProjectionMatrix();
        this._handleResize();
    }

    /**
     * @private
     */
    _initializeState() {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.051, 0.071, 0.149, 1.0);
    }

    /**
     * @private
     * @returns {Object}
     */
    _getLocations() {
        const gl = this.gl;
        
        return {
            attributes: {
                position: gl.getAttribLocation(this.program, 'aPosition'),
                normal: gl.getAttribLocation(this.program, 'aNormal')
            },
            uniforms: {
                modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
                projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                normalMatrix: gl.getUniformLocation(this.program, 'uNormalMatrix'),
                lightPosition: gl.getUniformLocation(this.program, 'uLightPosition'),
                lightColor: gl.getUniformLocation(this.program, 'uLightColor'),
                lightIntensity: gl.getUniformLocation(this.program, 'uLightIntensity'),
                ambientColor: gl.getUniformLocation(this.program, 'uAmbientColor'),
                diffuseColor: gl.getUniformLocation(this.program, 'uDiffuseColor'),
                specularColor: gl.getUniformLocation(this.program, 'uSpecularColor'),
                shininess: gl.getUniformLocation(this.program, 'uShininess'),
                opacity: gl.getUniformLocation(this.program, 'uOpacity')
            }
        };
    }

    /**
     * @private
     */
    _updateProjectionMatrix() {
        const canvas = this.gl.canvas;
        const aspect = canvas.width / canvas.height;
        Matrix4.perspective(
            this.projectionMatrix,
            Math.PI / 4,
            aspect,
            0.1,
            100.0
        );
    }

    /**
     * @private
     * @param {Object} buffers
     */
    _setupAttributes(buffers) {
        const gl = this.gl;
        const attrs = this.locations.attributes;

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(attrs.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attrs.position);

        // Normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(attrs.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attrs.normal);
    }

    /**
     * @private
     * @param {Float32Array} modelViewMatrix
     */
    _updateMatrices(modelViewMatrix) {
        const gl = this.gl;
        const uniforms = this.locations.uniforms;

        gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, modelViewMatrix);

        // Update projection matrix
        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, this.projectionMatrix);

        // Calculate and update normal matrix
        const normalMatrix = Matrix4.create();
        Matrix4.invert(normalMatrix, modelViewMatrix);
        Matrix4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(uniforms.normalMatrix, false, normalMatrix);
    }

    /**
     * @private
     * @param {Object} material
     */
    _updateMaterial(material) {
        const gl = this.gl;
        const uniforms = this.locations.uniforms;

        gl.uniform3fv(uniforms.ambientColor, material.ambient || [0.2, 0.2, 0.2]);
        gl.uniform3fv(uniforms.diffuseColor, material.diffuse || [0.8, 0.8, 0.8]);
        gl.uniform3fv(uniforms.specularColor, material.specular || [0.5, 0.5, 0.5]);
        gl.uniform1f(uniforms.shininess, material.shininess || 32.0);
        gl.uniform1f(uniforms.opacity, material.opacity || 1.0);
    }

    /**
     * @private
     */
    _updateLighting() {
        const gl = this.gl;
        const uniforms = this.locations.uniforms;

        gl.uniform3fv(uniforms.lightPosition, [5.0, 5.0, 5.0]);
        gl.uniform3fv(uniforms.lightColor, [1.0, 1.0, 1.0]);
        gl.uniform1f(uniforms.lightIntensity, 1.0);
    }

    _handleResize() {
        const gl = this.gl;
        const canvas = gl.canvas;
        
        const displayWidth = Math.floor(canvas.clientWidth);
        const displayHeight = Math.floor(canvas.clientHeight);
        
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        const width = Math.floor(displayWidth * dpr);
        const height = Math.floor(displayHeight * dpr);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
            this._updateProjectionMatrix();
        }
    }

    /**
     * @param {Object} modelData
     * @param {Float32Array} modelViewMatrix
     */
    render(modelData, modelViewMatrix) {
        const gl = this.gl;

        gl.useProgram(this.program);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._updateMatrices(modelViewMatrix);
        this._updateLighting();

        this._setupAttributes(modelData.buffers);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelData.buffers.index);

        // Render each material group
        for (const [materialName, group] of Object.entries(modelData.materialGroups)) {
            // Update material properties
            const material = modelData.materials[materialName] || {
                ambient: [0.2, 0.2, 0.2],
                diffuse: [0.8, 0.8, 0.8],
                specular: [0.5, 0.5, 0.5],
                shininess: 32.0,
                opacity: 1.0
            };
            
            this._updateMaterial(material);

            // Draw elements
            gl.drawElements(
                gl.TRIANGLES,
                group.indexCount,
                gl.UNSIGNED_SHORT,
                group.startIndex * 2
            );
        }
    }

    handleResize() {
        this._handleResize();
    }

    dispose() {
        const gl = this.gl;

        // Reset state
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.useProgram(null);

        // Delete program
        gl.deleteProgram(this.program);
    }
}