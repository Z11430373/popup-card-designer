// Pop-up Card Designer - Complete 3D Pop-up Card Editor
// Interactive 3D design tool for creating pop-up greeting cards

class PopupCardDesigner {
    constructor() {
        // 3D Scene
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cardModel = null;
        this.animationId = null;
        this.leftCard = null;
        this.rightCard = null;

        // State
        this.cardWidth = 15;
        this.cardHeight = 20;
        this.cardColor = 'white';
        this.baseCardType = '300';
        this.joinType = 'glue';
        this.mechanism = 'empty'; // Start with empty card

        // Mouse/Camera Control
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.modelRotation = { x: 0.3, y: 0.5 }; // Default angle for better view
        this.cameraDistance = 40;

        // Card Animation
        this.cardOpenAngle = 0;
        this.targetCardAngle = 0;
        this.isCardOpening = false;
        this.cardOpenSpeed = 0.1;

        // Elements/Layers
        this.popupElements = []; // 3D pop-up elements
        this.paperLayers = [];
        this.paperLayerCount = 1;
        this.paperColors = ['#ffffff', '#ffe8b6', '#ffd4d4', '#d4f1ff', '#e8d4ff', '#d4ffd4', '#ffffcc', '#ffcccc'];
        this.elementShapes = ['heart', 'star', 'flower', 'box', 'cone', 'sphere'];
        this.elementColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088'];

        // Audio
        this.soundEnabled = true;
        this.audioContext = null;
        this.initAudio();

        // Load configuration
        this.loadConfiguration();

        // Initialize
        this.initThreeJS();
        this.setupEventListeners();
        this.setupMouseControls();
        this.createEmptyCard();
        this.updateStatusBar();
        this.animate();
    }

    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            this.soundEnabled = false;
        }
    }

    playSound(type = 'flip') {
        if (!this.soundEnabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const soundConfigs = {
            flip: { freq1: 400, freq2: 600, duration: 0.15, gain: 0.2 },
            add: { freq1: 600, freq2: 800, duration: 0.2, gain: 0.2 },
            delete: { freq1: 500, freq2: 200, duration: 0.15, gain: 0.2 },
            success: { freq1: 800, freq2: 1000, duration: 0.3, gain: 0.15 }
        };

        const config = soundConfigs[type] || soundConfigs.flip;
        osc.frequency.setValueAtTime(config.freq1, now);
        osc.frequency.exponentialRampToValueAtTime(config.freq2, now + config.duration);
        gain.gain.setValueAtTime(config.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
        osc.start(now);
        osc.stop(now + config.duration);
    }

    saveConfiguration() {
        const config = {
            cardWidth: this.cardWidth,
            cardHeight: this.cardHeight,
            cardColor: this.cardColor,
            baseCardType: this.baseCardType,
            joinType: this.joinType,
            mechanism: this.mechanism,
            elements: this.popupElements.map(el => ({
                shape: el.userData.shape,
                color: el.userData.color,
                position: [el.position.x, el.position.y, el.position.z],
                scale: el.scale.x
            }))
        };
        localStorage.setItem('popupCardDesign', JSON.stringify(config));
    }

    loadConfiguration() {
        const saved = localStorage.getItem('popupCardDesign');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.cardWidth = config.cardWidth || 15;
                this.cardHeight = config.cardHeight || 20;
                this.cardColor = config.cardColor || 'white';
                this.baseCardType = config.baseCardType || '300';
                this.joinType = config.joinType || 'glue';
                this.mechanism = config.mechanism || 'empty';
            } catch (e) {
                console.log('Could not load configuration');
            }
        }
    }

    initThreeJS() {
        const canvas = document.getElementById('canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2a);
        this.scene.fog = new THREE.Fog(0x1a1a2a, 100, 200);

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 5, this.cameraDistance);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;

        // Lighting - professional setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(15, 20, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        this.scene.add(directionalLight);

        // Back light for depth
        const backLight = new THREE.DirectionalLight(0x4488ff, 0.4);
        backLight.position.set(-15, 10, -20);
        this.scene.add(backLight);

        // Ground plane for shadows
        const groundGeom = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -15;
        ground.receiveShadow = true;
        this.scene.add(ground);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupMouseControls() {
        const canvas = document.getElementById('canvas');

        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            // Left-right drag: flip card
            const flipDelta = deltaX * 0.02;
            const newAngle = Math.max(-Math.PI, Math.min(Math.PI, this.cardOpenAngle + flipDelta));
            
            if (Math.abs(newAngle - this.cardOpenAngle) > 0.05) {
                this.playSound('flip');
                this.cardOpenAngle = newAngle;
                if (this.leftCard) {
                    this.leftCard.rotation.y = -this.cardOpenAngle;
                }
            }

            // Up-down drag: rotate view
            this.modelRotation.x -= deltaY * 0.01;
            this.modelRotation.y += deltaX * 0.005;
            this.modelRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.modelRotation.x));

            if (this.cardModel) {
                this.cardModel.rotation.x = this.modelRotation.x;
                this.cardModel.rotation.y = this.modelRotation.y;
            }

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1.1 : 0.9;
            this.cameraDistance *= delta;
            this.cameraDistance = Math.max(20, Math.min(80, this.cameraDistance));
            this.camera.position.z = this.cameraDistance;
            const scaleValue = (20 / (this.cameraDistance - 20) * 100).toFixed(0);
            document.getElementById('scaleValue').textContent = scaleValue + '%';
        }, { passive: false });
    }

    setupEventListeners() {
        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.tab).classList.add('active');
            });
        });

        // Card properties
        document.getElementById('propWidth').addEventListener('change', (e) => {
            this.cardWidth = parseFloat(e.target.value);
            this.createEmptyCard();
            this.updateStatusBar();
            this.saveConfiguration();
        });

        document.getElementById('propHeight').addEventListener('change', (e) => {
            this.cardHeight = parseFloat(e.target.value);
            this.createEmptyCard();
            this.updateStatusBar();
            this.saveConfiguration();
        });

        // Add element buttons
        document.getElementById('addHeartBtn')?.addEventListener('click', () => this.addElement('heart'));
        document.getElementById('addStarBtn')?.addEventListener('click', () => this.addElement('star'));
        document.getElementById('addBoxBtn')?.addEventListener('click', () => this.addElement('box'));
        document.getElementById('addSphereBtn')?.addEventListener('click', () => this.addElement('sphere'));
        document.getElementById('addConeBtn')?.addEventListener('click', () => this.addElement('cone'));

        // Sound toggle
        document.getElementById('soundToggle')?.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });

        // Color pickers
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = btn.dataset.color || '#ff0000';
                input.addEventListener('change', (e) => {
                    btn.style.background = e.target.value;
                    btn.dataset.color = e.target.value;
                });
                input.click();
            });
        });
    }

    createEmptyCard() {
        if (this.cardModel) {
            this.scene.remove(this.cardModel);
        }

        this.cardModel = new THREE.Group();
        this.scene.add(this.cardModel);
        this.popupElements = [];

        const width = this.cardWidth;
        const height = this.cardHeight;
        const cardMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.7,
            side: THREE.DoubleSide
        });

        // Left card (flippable)
        const leftCardGeom = new THREE.BoxGeometry(width, height, 0.2);
        this.leftCard = new THREE.Mesh(leftCardGeom, cardMat);
        this.leftCard.position.set(-width / 2, 0, 0);
        this.leftCard.castShadow = true;
        this.leftCard.receiveShadow = true;
        this.leftCard.rotation.order = 'YXZ';
        this.cardModel.add(this.leftCard);

        // Right card (fixed)
        const rightCardGeom = new THREE.BoxGeometry(width, height, 0.2);
        this.rightCard = new THREE.Mesh(rightCardGeom, cardMat);
        this.rightCard.position.set(width / 2, 0, 0);
        this.rightCard.castShadow = true;
        this.rightCard.receiveShadow = true;
        this.cardModel.add(this.rightCard);

        // Center spine (fold line)
        const spineGeom = new THREE.BoxGeometry(0.1, height, 0.2);
        const spineMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.05,
            roughness: 0.8
        });
        const spine = new THREE.Mesh(spineGeom, spineMat);
        spine.position.set(0, 0, 0.1);
        this.cardModel.add(spine);

        this.cardModel.rotation.x = this.modelRotation.x;
        this.cardModel.rotation.y = this.modelRotation.y;
    }

    addElement(shape) {
        const width = this.cardWidth;
        const height = this.cardHeight;
        let geometry;
        let color = this.elementColors[Math.floor(Math.random() * this.elementColors.length)];

        // Create shape geometry
        switch (shape) {
            case 'heart':
                geometry = this.createHeartGeometry();
                break;
            case 'star':
                geometry = this.createStarGeometry();
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(1.2, 32, 32);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(1.5, 3, 32);
                break;
            default:
                geometry = new THREE.SphereGeometry(1, 16, 16);
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.5,
            emissive: color,
            emissiveIntensity: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.shape = shape;
        mesh.userData.color = color;

        // Random position on the right side
        const x = (Math.random() - 0.5) * width * 0.6;
        const y = (Math.random() - 0.5) * height * 0.6;
        const z = 3 + Math.random() * 4;
        mesh.position.set(x, y, z);

        this.cardModel.add(mesh);
        this.popupElements.push(mesh);

        this.playSound('add');
        this.updateStatusBar();
        this.updateElementsList();
        this.saveConfiguration();
    }

    createHeartGeometry() {
        const shape = new THREE.Shape();
        const x = 0, y = 0;
        
        shape.moveTo(x + 5, y + 5);
        shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x + 0, y);
        shape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        shape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
        shape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        shape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        return new THREE.ShapeGeometry(shape);
    }

    createStarGeometry() {
        const points = [];
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? 2 : 1;
            const angle = (i * Math.PI) / 5;
            points.push(
                new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
            );
        }
        const shape = new THREE.Shape();
        shape.setFromPoints(points);
        return new THREE.ShapeGeometry(shape);
    }

    updateElementsList() {
        const elementsList = document.getElementById('elementsList');
        if (!elementsList) return;

        elementsList.innerHTML = '';
        this.popupElements.forEach((el, index) => {
            const item = document.createElement('div');
            item.className = 'layer-item';
            item.innerHTML = `
                <div class="layer-color" style="background-color: ${el.userData.color};"></div>
                <div class="layer-name">${el.userData.shape.charAt(0).toUpperCase() + el.userData.shape.slice(1)} ${index + 1}</div>
                <div class="layer-controls">
                    <button class="layer-btn" title="Delete">×</button>
                </div>
            `;

            item.querySelector('.layer-btn').addEventListener('click', () => {
                this.cardModel.remove(el);
                this.popupElements.splice(index, 1);
                this.updateElementsList();
                this.updateStatusBar();
                this.saveConfiguration();
            });

            elementsList.appendChild(item);
        });
    }

    updateStatusBar() {
        document.getElementById('posX').textContent = '0.0';
        document.getElementById('posY').textContent = '0.0';
        document.getElementById('sizeW').textContent = this.cardWidth.toFixed(1);
        document.getElementById('sizeH').textContent = this.cardHeight.toFixed(1);
        document.getElementById('elementCount').textContent = this.popupElements.length;
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Smooth card opening animation
        if (this.isCardOpening) {
            const diff = this.targetCardAngle - this.cardOpenAngle;
            if (Math.abs(diff) > 0.01) {
                this.cardOpenAngle += diff * this.cardOpenSpeed;
                if (this.leftCard) {
                    this.leftCard.rotation.y = -this.cardOpenAngle;
                }
            } else {
                this.cardOpenAngle = this.targetCardAngle;
                this.isCardOpening = false;
            }
        }

        // Subtle element animation
        this.popupElements.forEach((el, index) => {
            const time = Date.now() * 0.001;
            el.rotation.x += 0.005;
            el.rotation.z += 0.003;
            el.position.y += Math.sin(time + index) * 0.001;
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const canvas = document.getElementById('canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new PopupCardDesigner();
    console.log('🎨 Pop-up Card Designer Ready!');
});
