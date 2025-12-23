// Pop-up Card Designer - Advanced Features
// With paper color customization, sound effects, layer management, and auto-save

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
        this.joinType = 'glue';
        this.cardColor = 'white';
        this.complexity = 2;

        // 滑鼠控制變數
        this.isDragging = false;
        this.isFlipping = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.modelRotation = { x: 0, y: 0 };
        this.cameraDistance = 30;
        this.flipStartX = 0;

        // 卡片開闔動畫變數
        this.cardOpenAngle = 0;
        this.isCardOpening = false;
        this.targetCardAngle = 0;
        this.animationProgress = 0;

        // 紙張管理變數
        this.paperLayers = []; // 存儲所有紙張層次
        this.paperLayerCount = 0;
        this.paperColors = ['#ffffff', '#ffe8b6', '#ffd4d4', '#d4f1ff', '#e8d4ff', '#d4ffd4', '#ffffcc', '#ffcccc'];
        this.selectedPaperIndex = -1; // 選中的紙張層索引
        this.paperAnimationTime = 0;
        this.showPaperAnimation = false;

        // 音效配置
        this.soundEnabled = true;
        this.audioContext = null;
        this.initAudio();

        // 自動保存配置
        this.loadConfiguration();

        this.mechanismNames = {
            'vfold': 'V型摺',
            'parallel': '平行摺',
            'floating': '懸浮層',
            'pulltab': '拉動機關',
            'spinner': '旋轉機關'
        };

        this.joinTypeNames = {
            'glue': '白膠',
            'doubletape': '雙面膠',
            'slotjoin': '插接式',
            'foldpin': '摺痕銷釘'
        };

        this.structureHints = {
            'vfold': '🔆 V型摺：最基礎，適合人物、樹木、簡單建築',
            'parallel': '🔆 平行摺：創造層次感，適合建築美景',
            'floating': '🔆 懸浮層：最高級，較載最複雜，適合結成陣效',
            'pulltab': '🔆 拉動機關：加入互動性，適合摘探推痕',
            'spinner': '🔆 旋轉機關：需要精確設計鉸點，效果最佳'
        };

        this.initThreeJS();
        this.setupEventListeners();
        this.setupMouseControls();
        this.createInitialModel();
        this.updateLayerPanel();
        this.animate();
    }

    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.log('Audio context not supported');
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
            // 翻頁音效：短促的上升音調
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'add') {
            // 新增紙張：清脆的上升音調
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'delete') {
            // 刪除紙張：短促的下降音調
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
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
            cardColor: this.cardColor,
            complexity: this.complexity,
            paperLayers: this.paperLayers.map(layer => ({
                color: layer.userData.color,
                size: layer.userData.size
            })),
            projectName: document.getElementById('projectName').value
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
                this.baseCardType = config.baseCardType || '300gsm';
                this.elementCardType = config.elementCardType || '220gsm';
                this.joinType = config.joinType || 'glue';
                this.cardColor = config.cardColor || 'white';
                this.complexity = config.complexity || 2;
                this.paperLayerCount = config.paperLayers ? config.paperLayers.length : 1;
                
                if (config.projectName) {
                    document.getElementById('projectName').value = config.projectName;
                }
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
        this.scene.background = new THREE.Color(0xf5f7fa);
        this.scene.fog = new THREE.Fog(0xf5f7fa, 100, 200);

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 30);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

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

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupMouseControls() {
        const canvas = document.getElementById('canvas');

        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.isFlipping = true;
            this.flipStartX = e.clientX;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;
            const totalFlipDelta = e.clientX - this.flipStartX;

            if (Math.abs(totalFlipDelta) > 10) {
                const flipAngle = (totalFlipDelta / this.renderer.domElement.clientWidth) * Math.PI;
                const newAngle = Math.max(0, Math.min(Math.PI, flipAngle));
                
                // 偵測翻頁動作並播放音效
                if (Math.abs(newAngle - this.cardOpenAngle) > 0.05) {
                    this.playSound('flip');
                }
                
                this.cardOpenAngle = newAngle;
                
                if (this.leftCard) {
                    this.leftCard.rotation.y = -this.cardOpenAngle;
                }
            }

            if (Math.abs(totalFlipDelta) <= 10) {
                this.modelRotation.y += deltaX * 0.01;
                this.modelRotation.x += deltaY * 0.01;

                this.modelRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.modelRotation.x));

                if (this.cardModel) {
                    this.cardModel.rotation.x = this.modelRotation.x;
                    this.cardModel.rotation.y = this.modelRotation.y;
                }

                document.getElementById('rotateX').value = (this.modelRotation.x * 180 / Math.PI).toFixed(0);
                document.getElementById('rotateY').value = (this.modelRotation.y * 180 / Math.PI).toFixed(0);
            }

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isFlipping = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isFlipping = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1.1 : 0.9;
            this.cameraDistance *= delta;
            this.cameraDistance = Math.max(15, Math.min(60, this.cameraDistance));
            this.camera.position.z = this.cameraDistance;
            const scaleValue = 30 / this.cameraDistance;
            document.getElementById('scale').value = scaleValue.toFixed(2);
        }, { passive: false });
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
                this.saveConfiguration();
            });
        });

        // Color selection
        document.querySelectorAll('.color-option').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.cardColor = item.dataset.color;
                this.createInitialModel();
                this.saveConfiguration();
            });
        });

        // Card dimensions
        document.getElementById('cardWidth').addEventListener('change', (e) => {
            this.cardWidth = parseFloat(e.target.value);
            this.updateCardInfo();
            this.createInitialModel();
            this.saveConfiguration();
        });

        document.getElementById('cardHeight').addEventListener('change', (e) => {
            this.cardHeight = parseFloat(e.target.value);
            this.updateCardInfo();
            this.createInitialModel();
            this.saveConfiguration();
        });

        // Paper types
        document.getElementById('baseCardType').addEventListener('change', (e) => {
            this.baseCardType = e.target.value;
            this.updateCardInfo();
            this.saveConfiguration();
        });

        document.getElementById('elementCardType').addEventListener('change', (e) => {
            this.elementCardType = e.target.value;
            this.updateCardInfo();
            this.saveConfiguration();
        });

        // Join type
        document.getElementById('joinType').addEventListener('change', (e) => {
            this.joinType = e.target.value;
            this.updateCardInfo();
            this.saveConfiguration();
        });

        // Complexity slider
        document.getElementById('complexity').addEventListener('input', (e) => {
            this.complexity = parseInt(e.target.value);
            document.getElementById('complexityValue').textContent = this.complexity;
            this.updateCardInfo();
            this.saveConfiguration();
        });

        // Rotation controls
        document.getElementById('rotateX').addEventListener('input', (e) => {
            const angleX = parseFloat(e.target.value) * Math.PI / 180;
            this.modelRotation.x = angleX;
            this.cardModel.rotation.x = angleX;
        });

        document.getElementById('rotateY').addEventListener('input', (e) => {
            const angleY = parseFloat(e.target.value) * Math.PI / 180;
            this.modelRotation.y = angleY;
            this.cardModel.rotation.y = angleY;
        });

        // Scale control
        document.getElementById('scale').addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            this.cameraDistance = 30 / scale;
            this.camera.position.z = this.cameraDistance;
        });

        // Animation controls
        document.getElementById('playAnimation').addEventListener('click', () => {
            this.isAnimating = !this.isAnimating;
            document.getElementById('playAnimation').textContent = this.isAnimating ? '⏸ 停止' : '▶ 動畫';
        });

        // Open/Close card button
        const openCloseBtn = document.getElementById('openCloseCard');
        if (openCloseBtn) {
            openCloseBtn.addEventListener('click', () => {
                this.toggleCardAnimation();
            });
        }

        // Add paper layer button
        const addPaperBtn = document.getElementById('addPaperLayer');
        if (addPaperBtn) {
            addPaperBtn.addEventListener('click', () => {
                this.addPaperLayer();
            });
        }

        // Paper animation button
        const paperAnimBtn = document.getElementById('showPaperAnimation');
        if (paperAnimBtn) {
            paperAnimBtn.addEventListener('click', () => {
                this.showPaperAnimation = !this.showPaperAnimation;
                if (this.showPaperAnimation) {
                    this.paperAnimationTime = 0;
                    paperAnimBtn.textContent = '🎬 停止紙張演示';
                } else {
                    paperAnimBtn.textContent = '🎬 紙張層數動畫';
                }
            });
        }

        // Sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
            });
        }

        document.getElementById('resetView').addEventListener('click', () => {
            document.getElementById('rotateX').value = 0;
            document.getElementById('rotateY').value = 0;
            document.getElementById('scale').value = 1;
            this.modelRotation = { x: 0, y: 0 };
            this.cameraDistance = 30;
            this.camera.position.z = 30;
            this.cardModel.rotation.set(0, 0, 0);
            this.cardOpenAngle = 0;
            if (this.leftCard) {
                this.leftCard.rotation.y = 0;
            }
        });

        document.getElementById('toggleWireframe').addEventListener('click', () => {
            this.toggleWireframe();
        });

        // Create button
        document.getElementById('createBtn').addEventListener('click', () => {
            this.createInitialModel();
            this.showSuccessMessage('模型已更新！');
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('確定要重置所有設置？')) {
                localStorage.removeItem('popupCardConfig');
                location.reload();
            }
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

    addPaperLayer(color = null) {
        if (!this.cardModel) return;

        this.paperLayerCount++;
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        const colorIndex = (this.paperLayerCount - 1) % this.paperColors.length;
        const finalColor = color || this.paperColors[colorIndex];

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
        paper.userData.size = { width: width * 1.1, height: height * 1.1 };
        paper.userData.index = this.paperLayerCount - 1;
        
        this.cardModel.add(paper);
        this.paperLayers.push(paper);

        // 動畫效果
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
        this.saveConfiguration();
        this.showSuccessMessage(`已新增第 ${this.paperLayerCount} 層紙張！`);
    }

    deletePaperLayer(index) {
        if (index < 0 || index >= this.paperLayers.length) return;
        if (this.paperLayers.length <= 1) {
            this.showWarning('至少需要保留 1 層紙張！');
            return;
        }

        const paper = this.paperLayers[index];
        
        // 刪除動畫
        let startTime = Date.now();
        const animateDelete = () => {
            const elapsed = (Date.now() - startTime) / 200;
            if (elapsed < 1) {
                paper.scale.set(1 - elapsed, 1 - elapsed, 1 - elapsed);
                paper.position.z -= elapsed * 2;
                paper.rotation.x -= elapsed * Math.PI * 0.3;
                requestAnimationFrame(animateDelete);
            } else {
                this.cardModel.remove(paper);
                this.paperLayers.splice(index, 1);
                this.paperLayerCount--;
                this.updateLayerPanel();
                this.saveConfiguration();
                this.playSound('delete');
                this.showSuccessMessage('紙張已刪除！');
            }
        };
        animateDelete();
    }

    updateLayerPanel() {
        const layerPanel = document.getElementById('layerPanel');
        if (!layerPanel) return;

        layerPanel.innerHTML = '';
        
        if (this.paperLayers.length === 0) {
            layerPanel.innerHTML = '<div style="padding: 10px; color: #999; text-align: center; font-size: 0.85em;">未新增紙張</div>';
            return;
        }

        this.paperLayers.forEach((paper, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <div class="layer-color" style="background-color: ${paper.userData.color};"></div>
                <div class="layer-info">
                    <div class="layer-name">第 ${index + 1} 層</div>
                    <div class="layer-color-hex">${paper.userData.color}</div>
                </div>
                <div class="layer-controls">
                    <button class="layer-btn layer-color-btn" data-index="${index}" title="更改顏色">🎨</button>
                    <button class="layer-btn layer-delete-btn" data-index="${index}" title="刪除">🗑️</button>
                </div>
            `;

            const colorBtn = layerItem.querySelector('.layer-color-btn');
            const deleteBtn = layerItem.querySelector('.layer-delete-btn');

            colorBtn.addEventListener('click', () => {
                this.showColorPicker(index);
            });

            deleteBtn.addEventListener('click', () => {
                this.deletePaperLayer(index);
            });

            layerPanel.appendChild(layerItem);
        });

        document.getElementById('paperCount').textContent = this.paperLayerCount;
    }

    showColorPicker(layerIndex) {
        const paper = this.paperLayers[layerIndex];
        const input = document.createElement('input');
        input.type = 'color';
        input.value = paper.userData.color;
        
        input.addEventListener('change', (e) => {
            const newColor = e.target.value;
            paper.userData.color = newColor;
            
            // 更新材質顏色
            paper.material.color.setStyle(newColor);
            
            this.updateLayerPanel();
            this.saveConfiguration();
            this.showSuccessMessage(`第 ${layerIndex + 1} 層顏色已更改！`);
        });
        
        input.click();
    }

    createInitialModel() {
        if (this.cardModel) {
            this.scene.remove(this.cardModel);
        }

        this.cardModel = new THREE.Group();
        this.scene.add(this.cardModel);
        
        this.paperLayers = [];

        // 重新創建預設紙張
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
            paper.userData.size = { width: width * 1.1, height: height * 1.1 };
            paper.userData.index = i;
            
            this.cardModel.add(paper);
            this.paperLayers.push(paper);
        }

        // 創建卡片結構
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

        const leftCardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        const leftCard = new THREE.Mesh(leftCardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);
        this.leftCard = leftCard;

        const rightCard = new THREE.Mesh(leftCardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        const vFoldGroup = new THREE.Group();
        
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
        vFoldGroup.add(vFoldMesh);

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

        const leftCardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        const leftCard = new THREE.Mesh(leftCardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);
        this.leftCard = leftCard;

        const rightCard = new THREE.Mesh(leftCardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

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

        const cardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const baseMaterial = this.getCardMaterial();
        
        const leftCard = new THREE.Mesh(cardGeom, baseMaterial);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);
        this.leftCard = leftCard;

        const rightCard = new THREE.Mesh(cardGeom, baseMaterial);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

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

        const cardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        
        const leftCard = new THREE.Mesh(cardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);
        this.leftCard = leftCard;

        const rightCard = new THREE.Mesh(cardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        const mainGeom = new THREE.BoxGeometry(width * 0.6, height * 0.5, 0.08);
        const mainMaterial = this.getElementMaterial();
        this.pullTabElement = new THREE.Mesh(mainGeom, mainMaterial);
        this.pullTabElement.position.z = 1;
        this.pullTabElement.castShadow = true;
        this.cardModel.add(this.pullTabElement);

        const tabGeom = new THREE.BoxGeometry(width * 0.3, 0.5, 0.08);
        const tab = new THREE.Mesh(tabGeom, mainMaterial);
        tab.position.set(width * 0.4, -height * 0.3, 1);
        tab.castShadow = true;
        this.cardModel.add(tab);
    }

    createSpinnerCard() {
        const width = this.cardWidth / 2;
        const height = this.cardHeight / 2;

        const cardGeom = new THREE.BoxGeometry(width, height, 0.1);
        const material = this.getCardMaterial();
        
        const leftCard = new THREE.Mesh(cardGeom, material);
        leftCard.position.set(-width / 2, 0, 0);
        leftCard.castShadow = true;
        this.cardModel.add(leftCard);
        this.leftCard = leftCard;

        const rightCard = new THREE.Mesh(cardGeom, material);
        rightCard.position.set(width / 2, 0, 0);
        rightCard.castShadow = true;
        this.cardModel.add(rightCard);

        const pivotGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const pivotMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const pivot = new THREE.Mesh(pivotGeom, pivotMaterial);
        pivot.position.z = 1;
        pivot.castShadow = true;
        this.cardModel.add(pivot);

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

    toggleCardAnimation() {
        if (this.cardOpenAngle >= Math.PI * 0.99) {
            this.targetCardAngle = 0;
        } else {
            this.targetCardAngle = Math.PI;
        }
        this.isCardOpening = true;
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

    updateCardInfo() {
        document.getElementById('infoWidth').textContent = this.cardWidth.toFixed(1);
        document.getElementById('infoHeight').textContent = this.cardHeight.toFixed(1);
        document.getElementById('infoBase').textContent = this.baseCardType.toUpperCase();
        document.getElementById('infoElement').textContent = this.elementCardType.toUpperCase();
        document.getElementById('infoJoin').textContent = this.joinTypeNames[this.joinType];

        const area = this.cardWidth * this.cardHeight;
        document.getElementById('statArea').textContent = area.toFixed(0);

        const depth = Math.max(5, 8 + this.complexity * 2);
        document.getElementById('statDepth').textContent = depth.toFixed(1);
    }

    updateMechanismInfo() {
        document.getElementById('infoMechanism').textContent = this.mechanismNames[this.mechanism];
        document.getElementById('structureHint').textContent = this.structureHints[this.mechanism];
        this.updateMaterialRecommendation();
    }

    updateMaterialRecommendation() {
        const recommendations = {
            'vfold': '使用300 GSM的卡紙作為基底，確保足夠硬度支撐立體結構。元件應選擇220 GSM，保持靈活性同時避免軟塌。摺線應與紙張絲流平行。',
            'parallel': '建議使用最硬的300-350 GSM作為基底，因為多層堆疊會增加壓力。元件層建議200 GSM，確保層與層之間的清晰分離。',
            'floating': '這種結構需要精確的支撐條設計。基底採用300 GSM，側支撐條用220 GSM。懸浮層建議使用180-200 GSM，保持輕盈感。',
            'pulltab': '基底需要300 GSM提供穩定支撐。移動元件採用220 GSM。軌道設計必須精確，避免機關被拉脫或卡住。',
            'spinner': '基底300 GSM提供重量中心穩定性。旋轉元件建議使用190-210 GSM，使其能順暢旋轉。鉸紐點需要特殊加固。'
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

        // 紙張層數動畫演示
        if (this.showPaperAnimation) {
            this.paperAnimationTime += 0.016; // 約60fps
            if (this.paperAnimationTime > 8) {
                this.paperAnimationTime = 0;
            }

            this.paperLayers.forEach((paper, i) => {
                const delay = i * 0.3;
                const animProgress = Math.max(0, Math.min(1, (this.paperAnimationTime - delay) / 1.5));
                
                if (animProgress >= 0 && animProgress <= 1) {
                    paper.rotation.x = animProgress * Math.PI * 0.5;
                    paper.position.z = -2 - i * 0.3 + animProgress * 3;
                    paper.position.y = Math.sin(animProgress * Math.PI) * 1.5;
                }
            });
        }

        // 卡片開闔動畫
        if (this.isCardOpening) {
            const diff = this.targetCardAngle - this.cardOpenAngle;
            if (Math.abs(diff) > 0.01) {
                this.cardOpenAngle += diff * 0.1;
                if (this.leftCard) {
                    this.leftCard.rotation.y = -this.cardOpenAngle;
                }
            } else {
                this.cardOpenAngle = this.targetCardAngle;
                this.isCardOpening = false;
            }
        }

        // 自動動畫
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
            joinType: this.joinType,
            cardColor: this.cardColor,
            complexity: this.complexity,
            paperLayers: this.paperLayers.map(p => ({
                color: p.userData.color,
                size: p.userData.size
            })),
            timestamp: new Date().toISOString()
        };

        const link = document.createElement('a');
        link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        link.download = `popup-card-${Date.now()}.json`;
        link.click();
        this.showSuccessMessage('設計數據已匯出為JSON');
    }

    exportToPDF() {
        alert('PDF匯出功能需要在Illustrator或Inkscape中進行進一步編輯。\n\n建議步驟：\n1. 在此工具中設計您的卡片結構\n2. 將設計匯出為JSON\n3. 在向量設計軟體中使用紅色線表示切割，藍色線表示摺痕\n4. 匯出為PDF');
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

    showWarning(message) {
        const box = document.createElement('div');
        box.className = 'warning-box';
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

document.addEventListener('DOMContentLoaded', () => {
    const app = new PopupCardDesigner();
    console.log('Pop-up Card Designer initialized with advanced features');
});
