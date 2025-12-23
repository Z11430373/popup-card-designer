// Pop-up Card Designer - Professional CAD Interface
// Advanced features with professional UI

class PopupCardDesigner {
    constructor() {
        // 3D Scene
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cardModel = null;
        this.animationId = null;

        // State
        this.mechanism = 'vfold';
        this.cardWidth = 15;
        this.cardHeight = 20;
        this.baseCardType = '300';
        this.elementCardType = '220';
        this.joinType = 'glue';

        // Mouse/Camera
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.modelRotation = { x: 0, y: 0 };
        this.cameraDistance = 30;

        // Card Animation
        this.cardOpenAngle = 0;
        this.isAnimating = false;

        // Paper layers
        this.paperLayers = [];
        this.paperLayerCount = 0;
        this.paperColors = ['#ffffff', '#ffe8b6', '#ffd4d4', '#d4f1ff', '#e8d4ff', '#d4ffd4', '#ffffcc', '#ffcccc'];

        // Audio
        this.soundEnabled = true;
        this.audioContext = null;
        this.initAudio();

        // Load saved config
        this.loadConfiguration();

        // Initialize
        this.initThreeJS();
        this.setupEventListeners();
        this.setupMouseControls();
        this.createInitialModel();
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

        if (type === 'flip') {
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'add') {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    saveConfiguration() {
        const config = {
            mechanism: this.mechanism,
            cardWidth: this.cardWidth,
            cardHeight: this.cardHeight,
            baseCardType: this.baseCardType,
            elementCardType: this.elementCardType,
            joinType: this.joinType,
            paperLayers: this.paperLayerCount
        };
        localStorage.setItem('popupCardConfig', JSON.stringify(config));
    }

    loadConfiguration() {
        const saved = localStorage.getItem('popupCardConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.mechanism = config.mechanism || 'vfold';
                this.cardWidth = config.cardWidth || 15;
                this.cardHeight = config.cardHeight || 20;
                this.baseCardType = config.baseCardType || '300';
                this.elementCardType = config.elementCardType || '220';
                this.joinType = config.joinType || 'glue';
                this.paperLayerCount = config.paperLayers || 1;
            } catch (e) {
                console.log('Could not load configuration');
            }
        } else {
            this.paperLayerCount = 1;
        }
    }

    initThreeJS() {
        const canvas = document.getElementById('canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2a);

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 30);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

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

            this.modelRotation.y += deltaX * 0.01;
            this.modelRotation.x += deltaY * 0.01;
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
            this.cameraDistance = Math.max(15, Math.min(60, this.cameraDistance));
            this.camera.position.z = this.cameraDistance;
            const scaleValue = (30 / this.cameraDistance * 100).toFixed(0);
            document.getElementById('scaleValue').textContent = scaleValue + '%';
            document.getElementById('scale').value = (30 / this.cameraDistance).toFixed(2);
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

        // Properties inputs
        document.getElementById('propWidth').addEventListener('change', (e) => {
            this.cardWidth = parseFloat(e.target.value);
            document.getElementById('cardWidth').value = this.cardWidth;
            this.createInitialModel();
            this.updateStatusBar();
            this.saveConfiguration();
        });

        document.getElementById('propHeight').addEventListener('change', (e) => {
            this.cardHeight = parseFloat(e.target.value);
            document.getElementById('cardHeight').value = this.cardHeight;
            this.createInitialModel();
            this.updateStatusBar();
            this.saveConfiguration();
        });

        document.getElementById('mechanism').addEventListener('change', (e) => {
            this.mechanism = e.target.value;
            this.createInitialModel();
            this.saveConfiguration();
        });

        document.getElementById('baseCard').addEventListener('change', (e) => {
            this.baseCardType = e.target.value;
            this.saveConfiguration();
        });

        document.getElementById('elementCard').addEventListener('change', (e) => {
            this.elementCardType = e.target.value;
            this.saveConfiguration();
        });

        document.getElementById('joinType').addEventListener('change', (e) => {
            this.joinType = e.target.value;
            this.saveConfiguration();
        });

        // Toolbar inputs
        document.getElementById('cardWidth').addEventListener('change', (e) => {
            this.cardWidth = parseFloat(e.target.value);
            document.getElementById('propWidth').value = this.cardWidth;
            this.createInitialModel();
            this.updateStatusBar();
            this.saveConfiguration();
        });

        document.getElementById('cardHeight').addEventListener('change', (e) => {
            this.cardHeight = parseFloat(e.target.value);
            document.getElementById('propHeight').value = this.cardHeight;
            this.createInitialModel();
            this.updateStatusBar();
            this.saveConfiguration();
        });

        document.getElementById('scale').addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            this.cameraDistance = 30 / scale;
            this.camera.position.z = this.cameraDistance;
            const scaleValue = (scale * 100).toFixed(0);
            document.getElementById('scaleValue').textContent = scaleValue + '%';
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });

        document.getElementById('addLayerBtn').addEventListener('click', () => {
            this.addPaperLayer();
        });
    }

    addPaperLayer() {
        if (!this.cardModel) return;

        this.paperLayerCount++;
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        const colorIndex = (this.paperLayerCount - 1) % this.paperColors.length;
        const finalColor = this.paperColors[colorIndex];

        const paperGeom = new THREE.BoxGeometry(width * 1.1, height * 1.1, 0.08);
        const paperMaterial = new THREE.MeshStandardMaterial({
            color: finalColor,
            metalness: 0.08,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const paper = new THREE.Mesh(paperGeom, paperMaterial);
        paper.position.z = -2 - this.paperLayerCount * 0.3;
        paper.castShadow = true;
        paper.userData.color = finalColor;
        paper.userData.index = this.paperLayerCount - 1;

        this.cardModel.add(paper);
        this.paperLayers.push(paper);

        // Animation
        const targetZ = paper.position.z;
        const startZ = 5;
        paper.position.z = startZ;

        let startTime = Date.now();
        const animatePaper = () => {
            const elapsed = (Date.now() - startTime) / 300;
            if (elapsed < 1) {
                paper.position.z = startZ + (targetZ - startZ) * elapsed;
                paper.rotation.x = elapsed * Math.PI * 0.5;
                paper.position.y = Math.sin(elapsed * Math.PI) * 1;
                requestAnimationFrame(animatePaper);
            } else {
                paper.position.z = targetZ;
                paper.rotation.x = 0;
                paper.position.y = 0;
            }
        };
        animatePaper();

        this.playSound('add');
        this.updateLayerPanel();
        this.updateStatusBar();
        this.saveConfiguration();
    }

    updateLayerPanel() {
        const layerPanel = document.getElementById('layerPanel');
        layerPanel.innerHTML = '';

        this.paperLayers.forEach((paper, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <div class="layer-color" style="background-color: ${paper.userData.color};"></div>
                <div class="layer-name">Layer ${index + 1}</div>
                <div class="layer-controls">
                    <button class="layer-btn" data-index="${index}" title="Delete">×</button>
                </div>
            `;

            const deleteBtn = layerItem.querySelector('.layer-btn');
            deleteBtn.addEventListener('click', () => {
                this.deletePaperLayer(index);
            });

            layerPanel.appendChild(layerItem);
        });
    }

    deletePaperLayer(index) {
        if (this.paperLayers.length <= 1) return;

        const paper = this.paperLayers[index];
        let startTime = Date.now();
        
        const animateDelete = () => {
            const elapsed = (Date.now() - startTime) / 200;
            if (elapsed < 1) {
                paper.scale.set(1 - elapsed, 1 - elapsed, 1 - elapsed);
                paper.position.z -= elapsed * 2;
                requestAnimationFrame(animateDelete);
            } else {
                this.cardModel.remove(paper);
                this.paperLayers.splice(index, 1);
                this.paperLayerCount--;
                this.updateLayerPanel();
                this.updateStatusBar();
                this.saveConfiguration();
                this.playSound('delete');
            }
        };
        animateDelete();
    }

    createInitialModel() {
        if (this.cardModel) {
            this.scene.remove(this.cardModel);
        }

        this.cardModel = new THREE.Group();
        this.scene.add(this.cardModel);
        this.paperLayers = [];

        // Create paper layers
        if (this.paperLayerCount === 0) {
            this.paperLayerCount = 1;
        }

        for (let i = 0; i < this.paperLayerCount; i++) {
            const width = this.cardWidth / 2;
            const height = this.cardHeight / 2;
            const colorIndex = i % this.paperColors.length;

            const paperGeom = new THREE.BoxGeometry(width * 1.1, height * 1.1, 0.08);
            const paperMaterial = new THREE.MeshStandardMaterial({
                color: this.paperColors[colorIndex],
                metalness: 0.08,
                roughness: 0.8,
                side: THREE.DoubleSide
            });
            const paper = new THREE.Mesh(paperGeom, paperMaterial);
            paper.position.z = -2 - i * 0.3;
            paper.castShadow = true;
            paper.userData.color = this.paperColors[colorIndex];
            paper.userData.index = i;

            this.cardModel.add(paper);
            this.paperLayers.push(paper);
        }

        // Create card structure based on mechanism
        switch (this.mechanism) {
            case 'vfold':
                this.createVFoldCard();
                break;
            case 'parallel':
                this.createParallelFoldCard();
                break;
            case 'floating':
                this.createFloatingLayersCard();
                break;
            case 'pulltab':
                this.createPullTabCard();
                break;
            case 'spinner':
                this.createSpinnerCard();
                break;
        }

        this.cardModel.rotation.x = this.modelRotation.x;
        this.cardModel.rotation.y = this.modelRotation.y;
        this.updateLayerPanel();
    }

    createVFoldCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        const material = new THREE.MeshStandardMaterial({
            color: 0xf5a962,
            metalness: 0.2,
            roughness: 0.6,
            side: THREE.DoubleSide
        });

        // V-fold triangle
        const triangleShape = new THREE.Shape();
        triangleShape.moveTo(0, 0);
        triangleShape.lineTo(-width / 3, height / 2);
        triangleShape.lineTo(width / 3, height / 2);
        triangleShape.lineTo(0, 0);

        const extrudeSettings = { depth: 1, bevelEnabled: false };
        const vFoldGeom = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);
        const vFoldMesh = new THREE.Mesh(vFoldGeom, material);
        vFoldMesh.position.z = 0.5;
        vFoldMesh.castShadow = true;
        this.cardModel.add(vFoldMesh);

        // Decorative sphere
        const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16);
        const sphere = new THREE.Mesh(sphereGeom, material);
        sphere.position.set(0, height / 2 + 1, 0.5);
        sphere.castShadow = true;
        this.cardModel.add(sphere);
    }

    createParallelFoldCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;
        const material = new THREE.MeshStandardMaterial({ color: 0xf5a962, metalness: 0.2, roughness: 0.6 });

        for (let i = 0; i < 3; i++) {
            const boxGeom = new THREE.BoxGeometry(width * 0.8, height * 0.6, 0.08);
            const box = new THREE.Mesh(boxGeom, material);
            box.position.y = -height / 3 + (i * height / 2);
            box.position.z = i * 1.5;
            box.castShadow = true;
            this.cardModel.add(box);
        }
    }

    createFloatingLayersCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        for (let i = 0; i < 4; i++) {
            const layerGeom = new THREE.BoxGeometry(width * 0.7, height * 0.7, 0.1);
            const layerMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff - (i * 0x222222),
                metalness: 0.3,
                roughness: 0.4
            });
            const layer = new THREE.Mesh(layerGeom, layerMaterial);
            layer.position.z = i * 2.5 + 2;
            layer.castShadow = true;
            this.cardModel.add(layer);
        }
    }

    createPullTabCard() {
        const width = this.cardWidth / 2;
        const material = new THREE.MeshStandardMaterial({ color: 0xf5a962, metalness: 0.2, roughness: 0.6 });

        const mainGeom = new THREE.BoxGeometry(width * 0.6, 0.5, 0.08);
        const main = new THREE.Mesh(mainGeom, material);
        main.position.z = 1;
        main.castShadow = true;
        this.cardModel.add(main);
    }

    createSpinnerCard() {
        const material = new THREE.MeshStandardMaterial({ color: 0xf5a962, metalness: 0.2, roughness: 0.6 });

        const wingGeom = new THREE.PlaneGeometry(2, 3);
        const wing1 = new THREE.Mesh(wingGeom, material);
        wing1.position.set(1.5, 0, 1.2);
        this.cardModel.add(wing1);

        const wing2 = new THREE.Mesh(wingGeom, material);
        wing2.position.set(-1.5, 0, 1.2);
        this.cardModel.add(wing2);
    }

    updateStatusBar() {
        document.getElementById('posX').textContent = '0.0';
        document.getElementById('posY').textContent = '0.0';
        document.getElementById('sizeW').textContent = this.cardWidth.toFixed(1);
        document.getElementById('sizeH').textContent = this.cardHeight.toFixed(1);
        document.getElementById('layerCount').textContent = this.paperLayerCount;
        document.getElementById('dimensionDisplay').textContent = `${this.cardWidth.toFixed(1)} × ${this.cardHeight.toFixed(1)} cm`;
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
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

document.addEventListener('DOMContentLoaded', () => {
    const app = new PopupCardDesigner();
    console.log('Pop-up Card CAD initialized with professional interface');
});
