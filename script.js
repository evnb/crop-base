class PixelPerfectEditor {
    constructor() {
        // DOM Elements
        this.imageInput = document.getElementById('imageInput');
        this.uploadButton = document.getElementById('uploadButton');
        this.imageCanvas = document.getElementById('imageCanvas');
        this.cropBox = document.getElementById('cropBox');
        this.ctx = this.imageCanvas.getContext('2d');
        
        // Zoom controls
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        
        // Position display elements
        this.cropXDisplay = document.getElementById('cropX');
        this.cropYDisplay = document.getElementById('cropY');
        this.cropWidthDisplay = document.getElementById('cropWidth');
        this.cropHeightDisplay = document.getElementById('cropHeight');
        
        // State
        this.image = null;
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.cropBoxPos = { x: 0, y: 0, width: 0, height: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Upload handling
        this.uploadButton.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.zoom(1.25));
        this.zoomOutBtn.addEventListener('click', () => this.zoom(0.8));

        // Canvas interaction events
        this.imageCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.imageCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.imageCanvas.addEventListener('mouseup', () => this.handleCanvasMouseUp());
        this.imageCanvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const image = await this.loadImage(file);
            this.image = image;
            this.resetView();
            this.initializeCanvas();
            this.render();
            this.cropBox.style.display = 'block';
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    resetView() {
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.updateZoomDisplay();
    }

    initializeCanvas() {
        // Set canvas size to match image dimensions
        this.imageCanvas.width = this.image.width;
        this.imageCanvas.height = this.image.height;
        
        // Initialize crop box to center of image
        const defaultCropSize = Math.min(this.image.width, this.image.height) / 2;
        this.cropBoxPos = {
            x: (this.image.width - defaultCropSize) / 2,
            y: (this.image.height - defaultCropSize) / 2,
            width: defaultCropSize,
            height: defaultCropSize
        };
        
        this.updateCropBoxDisplay();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        
        // Draw image with current transform
        this.ctx.save();
        this.ctx.translate(this.panOffset.x, this.panOffset.y);
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        this.ctx.imageSmoothingEnabled = false; // Ensure pixel-perfect rendering
        this.ctx.drawImage(this.image, 0, 0);
        this.ctx.restore();
        
        this.updateCropBoxDisplay();
    }

    zoom(factor) {
        const oldZoom = this.zoomLevel;
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.1, Math.min(10, this.zoomLevel)); // Limit zoom range
        
        // Adjust pan offset to keep the center point fixed
        const centerX = this.imageCanvas.width / 2;
        const centerY = this.imageCanvas.height / 2;
        this.panOffset.x = centerX - (centerX - this.panOffset.x) * (this.zoomLevel / oldZoom);
        this.panOffset.y = centerY - (centerY - this.panOffset.y) * (this.zoomLevel / oldZoom);
        
        this.updateZoomDisplay();
        this.render();
    }

    updateZoomDisplay() {
        this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    updateCropBoxDisplay() {
        // Update position displays
        this.cropXDisplay.textContent = Math.round(this.cropBoxPos.x);
        this.cropYDisplay.textContent = Math.round(this.cropBoxPos.y);
        this.cropWidthDisplay.textContent = Math.round(this.cropBoxPos.width);
        this.cropHeightDisplay.textContent = Math.round(this.cropBoxPos.height);
        
        // Update crop box visual position
        const scale = this.zoomLevel;
        this.cropBox.style.left = `${this.cropBoxPos.x * scale + this.panOffset.x}px`;
        this.cropBox.style.top = `${this.cropBoxPos.y * scale + this.panOffset.y}px`;
        this.cropBox.style.width = `${this.cropBoxPos.width * scale}px`;
        this.cropBox.style.height = `${this.cropBoxPos.height * scale}px`;
    }

    handleCanvasMouseDown(e) {
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX - this.panOffset.x,
            y: e.clientY - this.panOffset.y
        };
    }

    handleCanvasMouseMove(e) {
        if (!this.isDragging) return;
        
        this.panOffset.x = e.clientX - this.dragStart.x;
        this.panOffset.y = e.clientY - this.dragStart.y;
        this.render();
    }

    handleCanvasMouseUp() {
        this.isDragging = false;
    }

    handleCanvasWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    }
}

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new PixelPerfectEditor();
});