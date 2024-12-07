let scene, camera, renderer, model, gridHelper, axesHelper, controls;
let labelSprites = [];
let autoRotate = false;
let autoRotateSpeed = { x: 0, y: 0, z: 0 };
let environmentMap;

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1128);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 15, 25);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    loadEnvironmentMap();
    setupLighting();
    setupHelpers();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
}

function loadEnvironmentMap() {
    const loader = new THREE.TextureLoader();
    loader.load('assets/env.jpg', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        environmentMap = texture;
    });
}

function setupLighting() {
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.9);
    mainLight.position.set(10, 7, 1);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const rimLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight1.position.set(10, 10, 21);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight2.position.set(10, 10, -19);
    scene.add(rimLight2);
}

function setupHelpers() {
    gridHelper = new THREE.GridHelper(20, 20, 0xC0C0C0, 0x7694B4);
    scene.add(gridHelper);

    axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    addLabelToAxis("X", new THREE.Vector3(5, 0, 0), 0xff0000);
    addLabelToAxis("Y", new THREE.Vector3(0, 5, 0), 0x00ff00);
    addLabelToAxis("Z", new THREE.Vector3(0, 0, 5), 0x0000ff);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('assets/screwdriver.glb', (gltf) => {
        model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                    child.material.envMap = environmentMap;
                    child.material.envMapIntensity = 1.0;
                    child.material.needsUpdate = true;
                }
            }
        });
        model.scale.set(1, 1, 1);
        scene.add(model);
    }, 
    (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
    (error) => { console.error('Model loading error:', error); });
}

function addLabelToAxis(labelText, position, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    context.font = 'bold 50px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.imageSmoothingEnabled = false;
    context.shadowColor = 'rgba(0,0,0,0.5)';
    context.shadowBlur = 5;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.fillStyle = 'white';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(labelText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({ map: texture, color, transparent: true, opacity: 0.9 });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(2, 1, 1);
    scene.add(sprite);

    labelSprites.push(sprite);
}

function setupPanelToggle() {
    const toggleButton = document.getElementById('togglePanel');
    const controlPanel = document.getElementById('controlPanel');

    toggleButton.addEventListener('click', () => {
        controlPanel.classList.toggle('hidden');
        toggleButton.textContent = controlPanel.classList.contains('hidden') ? 'Show Panel' : 'Hide Panel';
    });
}

function setupControls() {
    document.getElementById('gridToggle').addEventListener('click', () => {
        gridHelper.visible = !gridHelper.visible;
        document.getElementById('gridToggle').textContent = gridHelper.visible ? 'Hide Grid' : 'Show Grid';
    });

    document.getElementById('axesToggle').addEventListener('click', () => {
        const axesVisible = axesHelper.visible;
        toggleAxesVisibility(!axesVisible);
        document.getElementById('axesToggle').textContent = axesVisible ? 'Show Axes' : 'Hide Axes';
    });

    ['rotateX', 'rotateY', 'rotateZ'].forEach(axis => {
        document.getElementById(axis).addEventListener('input', (e) => {
            if (model) {
                model.rotation[axis.slice(-1).toLowerCase()] = THREE.MathUtils.degToRad(e.target.value);
            }
        });
    });

    document.getElementById('scale').addEventListener('input', (e) => {
        if (model) {
            const scaleValue = parseFloat(e.target.value);
            model.scale.set(scaleValue, scaleValue, scaleValue);
        }
    });

    document.getElementById('autoRotateToggle').addEventListener('click', () => {
        autoRotate = !autoRotate;
        document.getElementById('autoRotateToggle').textContent = autoRotate ? 'Disable Auto-Rotate' : 'Enable Auto-Rotate';
    });

    ['rotateXCheckbox', 'rotateYCheckbox', 'rotateZCheckbox'].forEach((id, index) => {
        document.getElementById(id).addEventListener('change', (e) => {
            autoRotateSpeed[['x', 'y', 'z'][index]] = e.target.checked ? 0.01 : 0;
        });
    });

    // Camera presets
    setupCameraPresets();
}

function setupCameraPresets() {
    document.getElementById('presetTop').addEventListener('click', () => setCameraPosition(0, 20, 0));
    document.getElementById('presetBottom').addEventListener('click', () => setCameraPosition(0, -20, 0));
    document.getElementById('presetFront').addEventListener('click', () => setCameraPosition(0, 0, 20));
    document.getElementById('presetCorner').addEventListener('click', () => setCameraPosition(15, 15, 15));
}

function setCameraPosition(x, y, z) {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
}

function toggleAxesVisibility(visible) {
    axesHelper.visible = visible;
    labelSprites.forEach(sprite => sprite.visible = visible);
}

function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && model) {
        model.rotation.x += autoRotateSpeed.x;
        model.rotation.y += autoRotateSpeed.y;
        model.rotation.z += autoRotateSpeed.z;
        model.rotation.x %= (Math.PI * 2);
        model.rotation.y %= (Math.PI * 2);
        model.rotation.z %= (Math.PI * 2);

        updateRotationSliders();
    }

    controls.update();
    renderer.render(scene, camera);
}

function updateRotationSliders() {
    if (model) {
        document.getElementById('rotateX').value = THREE.MathUtils.radToDeg(model.rotation.x);
        document.getElementById('rotateY').value = THREE.MathUtils.radToDeg(model.rotation.y);
        document.getElementById('rotateZ').value = THREE.MathUtils.radToDeg(model.rotation.z);
    }
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);

initScene();
loadModel();
setupPanelToggle();
setupControls();
animate();
