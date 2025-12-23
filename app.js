// Pop-up Card Designer - Core Application Logic
// Using Three.js for 3D Rendering

class PopupCardDesigner {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cardModel = null;
        this.animationId = null;
        this.isAnimating = false;
        this.mechanism = 'vfold';
        this.cardWidth = 15;
        this.cardHeight = 20;
        this.baseCardType = '300gsm';
        this.elementCardType = '220gsm';
        this.cardColor = 'white';
        this.complexity = 2;

        this.mechanismNames = {
            'vfold': 'V型摺',
            'parallel': '平行摺',
            'floating': '懸浮層',
            'pulltab': '拉動機關',
            'spinner': '旋轉機關'
        };

        this.initThreeJS();
        this.setupEventListeners();
        this.createInitialModel();
        this.animate();
    }

    initThreeJS() {
        const canvas = document.getElementById('canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f7fa);
        this.scene.fog = new THREE.Fog(0xf5f7fa, 100, 200);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 30);

        // Renderer setup
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
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createInitialModel() {
        // Remove old model
        if (this.cardModel) {
            this.scene.remove(this.cardModel);
        }

        // Create model group
        this.cardModel = new THREE.Group();
        this.scene.add(this.cardModel);

        // Create card based on mechanism
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
    }

    createVFoldCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        // Base card (left panel)
        const leftCardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        const leftCard = new THREE.Mesh(leftCardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);

        // Base card (right panel)
        const rightCard = new THREE.Mesh(leftCardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        // V-fold element (bird's beak shape)
        const vFoldGroup = new THREE.Group();
        
        // Create triangular prism for V-fold
        const triangleShape = new THREE.Shape();
        triangleShape.moveTo(0, 0);
        triangleShape.lineTo(-width / 3, height / 2);
        triangleShape.lineTo(width / 3, height / 2);
        triangleShape.lineTo(0, 0);

        const extrudeSettings = {
            depth: 1,
            bevelEnabled: false
        };

        const vFoldGeom = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);
        const vFoldMesh = new THREE.Mesh(vFoldGeom, material);
        vFoldMesh.position.z = 0.5;
        vFoldMesh.castShadow = true;
        vFoldGroup.add(vFoldMesh);

        // Add small decorative element on top
        const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16);
        const sphere = new THREE.Mesh(sphereGeom, this.getElementMaterial());
        sphere.position.set(0, height / 2 + 1, 0.5);
        sphere.castShadow = true;
        vFoldGroup.add(sphere);

        this.cardModel.add(vFoldGroup);
        this.vFoldGroup = vFoldGroup;
    }

    createParallelFoldCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        // Base cards
        const leftCardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        const leftCard = new THREE.Mesh(leftCardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);

        const rightCard = new THREE.Mesh(leftCardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        // Create stacked boxes for parallel fold effect
        const boxHeight = height / 3;
        const elementMaterial = this.getElementMaterial();

        for (let i = 0; i < 3; i++) {
            const boxGeom = new THREE.BoxGeometry(width * 0.8, boxHeight * 0.8, 0.08);
            const box = new THREE.Mesh(boxGeom, elementMaterial);
            box.position.y = -height / 3 + (i * boxHeight / 2);
            box.position.z = i * 1.5;
            box.castShadow = true;
            this.cardModel.add(box);
        }
    }

    createFloatingLayersCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        // Base cards
        const cardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const baseMaterial = this.getCardMaterial();
        
        const leftCard = new THREE.Mesh(cardGeom, baseMaterial);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);

        const rightCard = new THREE.Mesh(cardGeom, baseMaterial);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        // Side support bars
        const barGeom = new THREE.BoxGeometry(0.3, height * 1.2, 1);
        const barMaterial = this.getElementMaterial();
        
        const leftBar = new THREE.Mesh(barGeom, barMaterial);
        leftBar.position.set(-width / 2.5, 0, 1);
        leftBar.castShadow = true;
        this.cardModel.add(leftBar);

        const rightBar = new THREE.Mesh(barGeom, barMaterial);
        rightBar.position.set(width / 2.5, 0, 1);
        rightBar.castShadow = true;
        this.cardModel.add(rightBar);

        // Floating layers
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
        const height = this.cardHeight / 2;

        // Base cards
        const cardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        
        const leftCard = new THREE.Mesh(cardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);

        const rightCard = new THREE.Mesh(cardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        // Main mechanism - moving element
        const mainGeom = new THREE.BoxGeometry(width * 0.6, height * 0.5, 0.08);
        const mainMaterial = this.getElementMaterial();
        this.pullTabElement = new THREE.Mesh(mainGeom, mainMaterial);
        this.pullTabElement.position.z = 1;
        this.pullTabElement.castShadow = true;
        this.cardModel.add(this.pullTabElement);

        // Pull tab handle
        const tabGeom = new THREE.BoxGeometry(width * 0.3, 0.5, 0.08);
        const tab = new THREE.Mesh(tabGeom, mainMaterial);
        tab.position.set(width * 0.4, -height * 0.3, 1);
        tab.castShadow = true;
        this.cardModel.add(tab);
    }

    createSpinnerCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        // Base cards
        const cardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        
        const leftCard = new THREE.Mesh(cardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);

        const rightCard = new THREE.Mesh(cardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        // Pivot point
        const pivotGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const pivotMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const pivot = new THREE.Mesh(pivotGeom, pivotMaterial);
        pivot.position.z = 1;
        pivot.castShadow = true;
        this.cardModel.add(pivot);

        // Spinning element (butterfly-like)
        const spinnerGroup = new THREE.Group();
        const wingGeom = new THREE.PlaneGeometry(2, 3);
        const wingMaterial = this.getElementMaterial();
        
        const wing1 = new THREE.Mesh(wingGeom, wingMaterial);
        wing1.position.set(1.5, 0, 1.2);
        spinnerGroup.add(wing1);

        const wing2 = new THREE.Mesh(wingGeom, wingMaterial);
        wing2.position.set(-1.5, 0, 1.2);
        spinnerGroup.add(wing2);

        this.spinnerGroup = spinnerGroup;
        this.cardModel.add(spinnerGroup);
    }

    getCardMaterial() {
        const colorMap = {
            'white': 0xffffff,
            'cream': 0xffe8b6,
            'pink': 0xffd4d4,
            'blue': 0xd4f1ff,
            'purple': 0xe8d4ff,
            'green': 0xd4ffd4
        };

        return new THREE.MeshStandardMaterial({
            color: colorMap[this.cardColor] || 0xffffff,
            metalness: 0.1,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
    }

    getElementMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0xf5a962,
            metalness: 0.2,
            roughness: 0.6,
            side: THREE.DoubleSide
        });
    }

    setupEventListeners() {
        // Mechanism selection
        document.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.option-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.mechanism = item.dataset.mechanism;
                this.updateMechanismInfo();
                this.createInitialModel();
            });
        });

        // Color selection
        document.querySelectorAll('.color-option').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.cardColor = item.dataset.color;
                this.createInitialModel();
            });
        });

        // Card dimensions
        document.getElementById('cardWidth').addEventListener('change', (e) => {
            this.cardWidth = parseFloat(e.target.value);
            this.updateCardInfo();
            this.createInitialModel();
        });

        document.getElementById('cardHeight').addEventListener('change', (e) => {
            this.cardHeight = parseFloat(e.target.value);
            this.updateCardInfo();
            this.createInitialModel();
        });

        // Paper types
        document.getElementById('baseCardType').addEventListener('change', (e) => {
            this.baseCardType = e.target.value;
            this.updateCardInfo();
        });

        document.getElementById('elementCardType').addEventListener('change', (e) => {
            this.elementCardType = e.target.value;
            this.updateCardInfo();
        });

        // Complexity slider
        document.getElementById('complexity').addEventListener('input', (e) => {
            this.complexity = parseInt(e.target.value);
            document.getElementById('complexityValue').textContent = this.complexity;
        });

        // Rotation controls
        document.getElementById('rotateX').addEventListener('input', (e) => {
            const angleX = parseFloat(e.target.value) * Math.PI / 180;
            this.cardModel.rotation.x = angleX;
        });

        document.getElementById('rotateY').addEventListener('input', (e) => {
            const angleY = parseFloat(e.target.value) * Math.PI / 180;
            this.cardModel.rotation.y = angleY;
        });

        // Scale control
        document.getElementById('scale').addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            this.cardModel.scale.set(scale, scale, scale);
        });

        // Animation controls
        document.getElementById('playAnimation').addEventListener('click', () => {
            this.isAnimating = !this.isAnimating;
            document.getElementById('playAnimation').textContent = this.isAnimating ? '⏸ 停止' : '▶ 動畫';
        });

        document.getElementById('resetView').addEventListener('click', () => {
            document.getElementById('rotateX').value = 0;
            document.getElementById('rotateY').value = 0;
            document.getElementById('scale').value = 1;
            this.cardModel.rotation.set(0, 0, 0);
            this.cardModel.scale.set(1, 1, 1);
        });

        document.getElementById('toggleWireframe').addEventListener('click', () => {
            this.toggleWireframe();
        });

        // Create button
        document.getElementById('createBtn').addEventListener('click', () => {
            this.createInitialModel();
            this.showSuccessMessage('模型已建立！');
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            location.reload();
        });

        // Export buttons
        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportImage').addEventListener('click', () => {
            this.exportAsImage();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportAsJSON();
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    updateCardInfo() {
        document.getElementById('infoWidth').textContent = this.cardWidth.toFixed(1);
        document.getElementById('infoHeight').textContent = this.cardHeight.toFixed(1);
        document.getElementById('infoBase').textContent = this.baseCardType.toUpperCase();
        document.getElementById('infoElement').textContent = this.elementCardType.toUpperCase();

        const area = this.cardWidth * this.cardHeight;
        document.getElementById('statArea').textContent = area.toFixed(0);

        const depth = Math.max(5, 8 + this.complexity * 2);
        document.getElementById('statDepth').textContent = depth.toFixed(1);
    }

    updateMechanismInfo() {
        document.getElementById('infoMechanism').textContent = this.mechanismNames[this.mechanism];
        this.updateMaterialRecommendation();
    }

    updateMaterialRecommendation() {
        const recommendations = {
            'vfold': '使用300 GSM的卡紙作為基底，確保足夠硬度支撐立體結構。元件應選擇220 GSM，保持靈活性同時避免軟塌。摺線應與紙張的絲流平行。',
            'parallel': '建議使用最硬的300-350 GSM作為基底，因為多層堆疊會增加壓力。元件層建議200 GSM，確保層與層之間的清晰分離。',
            'floating': '這種結構需要精確的支撐條設計。基底採用300 GSM，側支撐條用220 GSM。懸浮層建議使用180-200 GSM，保持輕盈感。',
            'pulltab': '基底需要300 GSM提供穩定支撐。移動元件採用220 GSM。軌道設計必須精確，避免機關被拉脫或卡住。',
            'spinner': '基底300 GSM提供重量中心穩定性。旋轉元件建議使用190-210 GSM，使其能順暢旋轉。樞紐點需要特殊加固。'
        };

        document.getElementById('materialRec').textContent = recommendations[this.mechanism] || '根據結構複雜度選擇適當紙張厚度。';
    }

    toggleWireframe() {
        this.cardModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.wireframe = !child.material.wireframe;
            }
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Auto-animation for different mechanisms
        if (this.isAnimating) {
            const time = Date.now() * 0.001;

            switch (this.mechanism) {
                case 'vfold':
                    if (this.vFoldGroup) {
                        this.vFoldGroup.rotation.z = Math.sin(time) * 0.3;
                    }
                    break;
                case 'pulltab':
                    if (this.pullTabElement) {
                        this.pullTabElement.position.x = Math.sin(time) * 3;
                    }
                    break;
                case 'spinner':
                    if (this.spinnerGroup) {
                        this.spinnerGroup.rotation.z = time * 2;
                    }
                    break;
                case 'floating':
                    this.cardModel.children.forEach((child, i) => {
                        if (child instanceof THREE.Mesh && i > 2) {
                            child.position.z = i * 2.5 + 2 + Math.sin(time + i) * 0.5;
                        }
                    });
                    break;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    exportAsImage() {
        this.renderer.render(this.scene, this.camera);
        const link = document.createElement('a');
        link.href = this.renderer.domElement.toDataURL('image/png');
        link.download = `popup-card-${Date.now()}.png`;
        link.click();
        this.showSuccessMessage('3D預覽已匯出為PNG');
    }

    exportAsJSON() {
        const data = {
            projectName: document.getElementById('projectName').value || '未命名',
            mechanism: this.mechanism,
            cardWidth: this.cardWidth,
            cardHeight: this.cardHeight,
            baseCardType: this.baseCardType,
            elementCardType: this.elementCardType,
            cardColor: this.cardColor,
            complexity: this.complexity,
            timestamp: new Date().toISOString()
        };

        const link = document.createElement('a');
        link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        link.download = `popup-card-${Date.now()}.json`;
        link.click();
        this.showSuccessMessage('設計數據已匯出為JSON');
    }

    exportToPDF() {
        alert('PDF匯出功能需要在Illustrator或Inkscape中進行進一步編輯。\n\n建議步驟：\n1. 在此工具中設計您的卡片結構\n2. 將設計導出為JSON\n3. 在向量設計軟體中使用紅色線表示切割，藍色線表示摺痕\n4. 導出為PDF');
    }

    showSuccessMessage(message) {
        const box = document.createElement('div');
        box.className = 'success-box';
        box.textContent = message;
        box.style.position = 'fixed';
        box.style.top = '20px';
        box.style.right = '20px';
        box.style.zIndex = '10000';
        box.style.maxWidth = '300px';
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 3000);
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PopupCardDesigner();
    console.log('Pop-up Card Designer initialized');
});
