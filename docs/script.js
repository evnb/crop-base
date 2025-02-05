"use strict";
var DragMode;
(function (DragMode) {
    DragMode[DragMode["None"] = 0] = "None";
    DragMode[DragMode["Move"] = 1] = "Move";
    DragMode[DragMode["ResizeN"] = 2] = "ResizeN";
    DragMode[DragMode["ResizeS"] = 3] = "ResizeS";
    DragMode[DragMode["ResizeE"] = 4] = "ResizeE";
    DragMode[DragMode["ResizeW"] = 5] = "ResizeW";
    DragMode[DragMode["ResizeNW"] = 6] = "ResizeNW";
    DragMode[DragMode["ResizeNE"] = 7] = "ResizeNE";
    DragMode[DragMode["ResizeSW"] = 8] = "ResizeSW";
    DragMode[DragMode["ResizeSE"] = 9] = "ResizeSE";
})(DragMode || (DragMode = {}));
/**
 * PixelPerfectEditor - A class that handles pixel-perfect image editing operations
 * Features:
 * - Precise pixel coordinate tracking during zoom and pan
 * - Nearest neighbor scaling for crisp image display
 * - Crop box with exact pixel position maintenance
 * - Smooth pan and zoom controls
 */
class PixelPerfectEditor {
    constructor() {
        this.image = null;
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.cropBoxPos = { x: 0, y: 0, width: 0, height: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.isDraggingCropBox = false;
        this.isDraggingCanvas = false;
        this.dragStartCropBox = { x: 0, y: 0 };
        this.dragStartCanvasOffset = { x: 0, y: 0 };
        this.currentDragMode = DragMode.None;
        this.RESIZE_HANDLE_SIZE = 10; // Size of the edge/corner hit area in pixels
        this.originalState = null;
        this.isPreviewMode = false;
        this.imageWidth = 0;
        this.imageHeight = 0;
        // DOM Elements
        const imageInput = document.getElementById('imageInput');
        const uploadButton = document.getElementById('uploadButton');
        const imageCanvas = document.getElementById('imageCanvas');
        const cropBox = document.getElementById('cropBox');
        const ctx = imageCanvas.getContext('2d');
        // Validate required elements
        if (!imageInput || !(imageInput instanceof HTMLInputElement)) {
            throw new Error('Image input element not found');
        }
        if (!uploadButton || !(uploadButton instanceof HTMLButtonElement)) {
            throw new Error('Upload button element not found');
        }
        if (!imageCanvas) {
            throw new Error('Canvas element not found');
        }
        if (!cropBox || !(cropBox instanceof HTMLDivElement)) {
            throw new Error('Crop box element not found');
        }
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        this.imageInput = imageInput;
        this.uploadButton = uploadButton;
        this.imageCanvas = imageCanvas;
        this.cropBox = cropBox;
        this.ctx = ctx;
        // Zoom controls
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const zoomToFitBtn = document.getElementById('zoomToFit');
        const zoomToCropBtn = document.getElementById('zoomToCrop');
        const zoomLevelInput = document.getElementById('zoomLevel');
        if (!zoomInBtn || !(zoomInBtn instanceof HTMLButtonElement)) {
            throw new Error('Zoom in button not found');
        }
        if (!zoomOutBtn || !(zoomOutBtn instanceof HTMLButtonElement)) {
            throw new Error('Zoom out button not found');
        }
        if (!zoomToFitBtn || !(zoomToFitBtn instanceof HTMLButtonElement)) {
            throw new Error('Zoom to fit button not found');
        }
        if (!zoomToCropBtn || !(zoomToCropBtn instanceof HTMLButtonElement)) {
            throw new Error('Zoom to crop button not found');
        }
        if (!zoomLevelInput || !(zoomLevelInput instanceof HTMLInputElement)) {
            throw new Error('Zoom level input not found');
        }
        this.zoomInBtn = zoomInBtn;
        this.zoomOutBtn = zoomOutBtn;
        this.zoomToFitBtn = zoomToFitBtn;
        this.zoomToCropBtn = zoomToCropBtn;
        this.zoomLevelInput = zoomLevelInput;
        // Position input elements
        const elements = {
            cropX: document.getElementById('cropX'),
            cropY: document.getElementById('cropY'),
            cropWidth: document.getElementById('cropWidth'),
            cropHeight: document.getElementById('cropHeight')
        };
        // Validate position input elements
        Object.entries(elements).forEach(([key, element]) => {
            if (!element || !(element instanceof HTMLInputElement)) {
                throw new Error(`${key} input element not found`);
            }
        });
        this.cropXInput = elements.cropX;
        this.cropYInput = elements.cropY;
        this.cropWidthInput = elements.cropWidth;
        this.cropHeightInput = elements.cropHeight;
        this.initializeEventListeners();
        // Expose editor instance globally for testing
        window.editor = this;
        // Add new buttons (initially hidden)
        this.continueEditingBtn = document.getElementById('continueEditing');
        this.downloadBtn = document.getElementById('download');
        this.applyCropBtn = document.getElementById('applyCrop');
        if (!this.continueEditingBtn || !this.downloadBtn || !this.applyCropBtn) {
            throw new Error('Required buttons not found');
        }
        // Add event listeners for new buttons
        this.continueEditingBtn.addEventListener('click', () => this.exitPreviewMode());
        this.downloadBtn.addEventListener('click', () => this.downloadCroppedImage());
        this.applyCropBtn.addEventListener('click', () => this.enterPreviewMode());
    }
    initializeEventListeners() {
        // Upload and zoom controls
        this.uploadButton.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.zoomInBtn.addEventListener('click', () => this.zoom(1.25));
        this.zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        this.zoomToFitBtn.addEventListener('click', () => this.zoomToFit());
        this.zoomToCropBtn.addEventListener('click', () => this.zoomToCrop());
        // Manual input handlers
        this.zoomLevelInput.addEventListener('change', () => this.handleZoomInput());
        this.cropXInput.addEventListener('change', () => this.handleCropInput());
        this.cropYInput.addEventListener('change', () => this.handleCropInput());
        this.cropWidthInput.addEventListener('change', () => this.handleCropInput());
        this.cropHeightInput.addEventListener('change', () => this.handleCropInput());
        // Convert mouse events to pointer events
        this.imageCanvas.addEventListener('pointerdown', this.handleCanvasMouseDown.bind(this));
        document.addEventListener('pointermove', this.handleMouseMove.bind(this));
        document.addEventListener('pointerup', this.handleMouseUp.bind(this));
        document.addEventListener('pointercancel', this.handleMouseUp.bind(this));
        this.imageCanvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
        // Crop box events
        this.cropBox.addEventListener('pointerdown', this.handleCropBoxMouseDown.bind(this));
        this.cropBox.addEventListener('click', (e) => e.stopPropagation());
        this.cropBox.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    }
    async handleImageUpload(event) {
        const input = event.target;
        const file = input.files?.[0];
        if (!file)
            return;
        try {
            const image = await this.loadImage(file);
            this.image = image;
            this.resetView();
            this.initializeCanvas();
            this.render();
            this.cropBox.style.display = 'block';
            this.handleImageLoad();
        }
        catch (error) {
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
                image.src = e.target?.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    resetView() {
        if (!this.image)
            return;
        // Get container dimensions
        const container = this.imageCanvas.parentElement;
        if (!container)
            return;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        // Calculate zoom to fit
        const scaleX = containerWidth / this.image.width;
        const scaleY = containerHeight / this.image.height;
        this.zoomLevel = Math.min(scaleX, scaleY, 1); // Don't zoom in past 100% for large images
        // For very small images (like pixel art), ensure they're at least 1/4 of the container
        const minScale = Math.max(containerWidth * 0.25 / this.image.width, containerHeight * 0.25 / this.image.height);
        this.zoomLevel = Math.max(this.zoomLevel, minScale);
        // Center the image
        this.panOffset = {
            x: (containerWidth - this.image.width * this.zoomLevel) / 2,
            y: (containerHeight - this.image.height * this.zoomLevel) / 2
        };
        this.updateZoomDisplay();
    }
    initializeCanvas() {
        if (!this.image)
            return;
        // Set canvas size to match container
        const container = this.imageCanvas.parentElement;
        if (!container)
            return;
        this.imageCanvas.width = container.clientWidth;
        this.imageCanvas.height = container.clientHeight;
        // Initialize crop box relative to image size and zoom level
        const defaultCropSize = Math.min(this.image.width * this.zoomLevel, this.image.height * this.zoomLevel, Math.min(this.image.width, this.image.height) // Don't make crop larger than image
        ) / 2;
        // Center crop box on image
        this.cropBoxPos = {
            x: (this.image.width - defaultCropSize / this.zoomLevel) / 2,
            y: (this.image.height - defaultCropSize / this.zoomLevel) / 2,
            width: defaultCropSize / this.zoomLevel,
            height: defaultCropSize / this.zoomLevel
        };
        this.updateCropBoxDisplay();
    }
    render() {
        if (!this.image)
            return;
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
    handleZoomInput() {
        const value = this.zoomLevelInput.value;
        const newZoom = parseFloat(value) / 100;
        if (isNaN(newZoom) || newZoom < 0.1 || newZoom > 10) {
            this.updateZoomDisplay(); // Reset to current value
            return;
        }
        const oldZoom = this.zoomLevel;
        this.zoomLevel = newZoom;
        // Adjust pan offset to keep the center point fixed
        const centerX = this.imageCanvas.width / 2;
        const centerY = this.imageCanvas.height / 2;
        this.panOffset.x = centerX - (centerX - this.panOffset.x) * (this.zoomLevel / oldZoom);
        this.panOffset.y = centerY - (centerY - this.panOffset.y) * (this.zoomLevel / oldZoom);
        this.render();
    }
    updateZoomDisplay() {
        this.zoomLevelInput.value = Math.round(this.zoomLevel * 100).toString();
    }
    updateCropBoxDisplay() {
        // Update position displays with current values
        this.cropXInput.value = Math.round(this.cropBoxPos.x).toString();
        this.cropYInput.value = Math.round(this.cropBoxPos.y).toString();
        this.cropWidthInput.value = Math.round(this.cropBoxPos.width).toString();
        this.cropHeightInput.value = Math.round(this.cropBoxPos.height).toString();
        // Update crop box visual position
        const scale = this.zoomLevel;
        this.cropBox.style.left = `${this.cropBoxPos.x * scale + this.panOffset.x}px`;
        this.cropBox.style.top = `${this.cropBoxPos.y * scale + this.panOffset.y}px`;
        this.cropBox.style.width = `${this.cropBoxPos.width * scale}px`;
        this.cropBox.style.height = `${this.cropBoxPos.height * scale}px`;
        // Add visual indicators for resize handles
        this.cropBox.style.cursor = 'move';
        // Update cursor based on hover position
        if (this.isDraggingCropBox) {
            switch (this.currentDragMode) {
                case DragMode.ResizeN:
                case DragMode.ResizeS:
                    this.cropBox.style.cursor = 'ns-resize';
                    break;
                case DragMode.ResizeE:
                case DragMode.ResizeW:
                    this.cropBox.style.cursor = 'ew-resize';
                    break;
                case DragMode.ResizeNW:
                case DragMode.ResizeSE:
                    this.cropBox.style.cursor = 'nwse-resize';
                    break;
                case DragMode.ResizeNE:
                case DragMode.ResizeSW:
                    this.cropBox.style.cursor = 'nesw-resize';
                    break;
                case DragMode.Move:
                    this.cropBox.style.cursor = 'move';
                    break;
            }
        }
    }
    handleCropInput() {
        const x = parseInt(this.cropXInput.value);
        const y = parseInt(this.cropYInput.value);
        const width = parseInt(this.cropWidthInput.value);
        const height = parseInt(this.cropHeightInput.value);
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || width < 1 || height < 1) {
            this.updateCropBoxDisplay(); // Reset to current values
            return;
        }
        // Update crop box with new values, ensuring minimum size
        this.cropBoxPos = {
            x: x,
            y: y,
            width: Math.max(1, width),
            height: Math.max(1, height)
        };
        this.render();
    }
    getDragMode(e) {
        const rect = this.cropBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const handleSize = this.RESIZE_HANDLE_SIZE;
        // Check corners first (they take precedence over edges)
        if (x <= handleSize && y <= handleSize)
            return DragMode.ResizeNW;
        if (x >= rect.width - handleSize && y <= handleSize)
            return DragMode.ResizeNE;
        if (x <= handleSize && y >= rect.height - handleSize)
            return DragMode.ResizeSW;
        if (x >= rect.width - handleSize && y >= rect.height - handleSize)
            return DragMode.ResizeSE;
        // Then check edges
        if (y <= handleSize)
            return DragMode.ResizeN;
        if (y >= rect.height - handleSize)
            return DragMode.ResizeS;
        if (x <= handleSize)
            return DragMode.ResizeW;
        if (x >= rect.width - handleSize)
            return DragMode.ResizeE;
        // If not on any edge/corner, it's a move
        return DragMode.Move;
    }
    handleCropBoxMouseDown(e) {
        e.stopPropagation();
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        this.isDraggingCropBox = true;
        this.isDraggingCanvas = false;
        this.currentDragMode = this.getDragMode(e);
        this.dragStartCropBox = {
            x: e.clientX,
            y: e.clientY
        };
        this.dragStartCanvasOffset = { ...this.panOffset };
    }
    handleCanvasMouseDown(e) {
        if (this.isDraggingCropBox)
            return;
        e.preventDefault(); // Prevent any default behavior
        // Set pointer capture to ensure we get all pointer events
        e.target.setPointerCapture(e.pointerId);
        this.isDraggingCanvas = true;
        this.isDraggingCropBox = false;
        // Store initial positions for relative movement
        this.dragStartCanvasOffset = {
            x: e.clientX,
            y: e.clientY
        };
    }
    handleMouseMove(e) {
        if (!this.isDraggingCropBox && !this.isDraggingCanvas)
            return;
        if (this.isDraggingCropBox) {
            const deltaX = e.clientX - this.dragStartCropBox.x;
            const deltaY = e.clientY - this.dragStartCropBox.y;
            const scaledDeltaX = deltaX / this.zoomLevel;
            const scaledDeltaY = deltaY / this.zoomLevel;
            // Store old values for min-size enforcement
            const oldX = this.cropBoxPos.x;
            const oldY = this.cropBoxPos.y;
            const oldWidth = this.cropBoxPos.width;
            const oldHeight = this.cropBoxPos.height;
            switch (this.currentDragMode) {
                case DragMode.Move:
                    this.cropBoxPos.x += scaledDeltaX;
                    this.cropBoxPos.y += scaledDeltaY;
                    break;
                case DragMode.ResizeN:
                    this.cropBoxPos.y += scaledDeltaY;
                    this.cropBoxPos.height -= scaledDeltaY;
                    break;
                case DragMode.ResizeS:
                    this.cropBoxPos.height += scaledDeltaY;
                    break;
                case DragMode.ResizeE:
                    this.cropBoxPos.width += scaledDeltaX;
                    break;
                case DragMode.ResizeW:
                    this.cropBoxPos.x += scaledDeltaX;
                    this.cropBoxPos.width -= scaledDeltaX;
                    break;
                case DragMode.ResizeNW:
                    this.cropBoxPos.x += scaledDeltaX;
                    this.cropBoxPos.y += scaledDeltaY;
                    this.cropBoxPos.width -= scaledDeltaX;
                    this.cropBoxPos.height -= scaledDeltaY;
                    break;
                case DragMode.ResizeNE:
                    this.cropBoxPos.y += scaledDeltaY;
                    this.cropBoxPos.width += scaledDeltaX;
                    this.cropBoxPos.height -= scaledDeltaY;
                    break;
                case DragMode.ResizeSW:
                    this.cropBoxPos.x += scaledDeltaX;
                    this.cropBoxPos.width -= scaledDeltaX;
                    this.cropBoxPos.height += scaledDeltaY;
                    break;
                case DragMode.ResizeSE:
                    this.cropBoxPos.width += scaledDeltaX;
                    this.cropBoxPos.height += scaledDeltaY;
                    break;
            }
            // Enforce minimum size
            const MIN_SIZE = 10;
            if (this.cropBoxPos.width < MIN_SIZE || this.cropBoxPos.height < MIN_SIZE) {
                this.cropBoxPos.x = oldX;
                this.cropBoxPos.y = oldY;
                this.cropBoxPos.width = oldWidth;
                this.cropBoxPos.height = oldHeight;
            }
            this.dragStartCropBox = {
                x: e.clientX,
                y: e.clientY
            };
            this.render();
        }
        else if (this.isDraggingCanvas) {
            // Calculate relative movement
            const deltaX = e.clientX - this.dragStartCanvasOffset.x;
            const deltaY = e.clientY - this.dragStartCanvasOffset.y;
            // Update pan offset
            this.panOffset.x += deltaX;
            this.panOffset.y += deltaY;
            // Update drag start for next move
            this.dragStartCanvasOffset = {
                x: e.clientX,
                y: e.clientY
            };
            // Update display
            requestAnimationFrame(() => this.render());
        }
    }
    handleMouseUp(e) {
        if (!this.isDraggingCropBox && !this.isDraggingCanvas)
            return;
        // Release pointer capture
        if (this.isDraggingCropBox) {
            this.cropBox.releasePointerCapture(e.pointerId);
        }
        else if (this.isDraggingCanvas) {
            this.imageCanvas.releasePointerCapture(e.pointerId);
        }
        this.isDraggingCropBox = false;
        this.isDraggingCanvas = false;
        // Ensure final render
        requestAnimationFrame(() => this.render());
    }
    handleCanvasWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    }
    zoomToFit() {
        if (!this.image)
            return;
        const container = this.imageCanvas.parentElement;
        if (!container)
            return;
        // Calculate zoom to fit
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scaleX = containerWidth / this.image.width;
        const scaleY = containerHeight / this.image.height;
        const newZoom = Math.min(scaleX, scaleY);
        // Store old zoom for pan adjustment
        const oldZoom = this.zoomLevel;
        this.zoomLevel = newZoom;
        // Center the image
        this.panOffset = {
            x: (containerWidth - this.image.width * this.zoomLevel) / 2,
            y: (containerHeight - this.image.height * this.zoomLevel) / 2
        };
        this.updateZoomDisplay();
        this.render();
    }
    zoomToCrop() {
        if (!this.image)
            return;
        const container = this.imageCanvas.parentElement;
        if (!container)
            return;
        // Calculate zoom to fit crop box
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const cropWidth = this.cropBoxPos.width;
        const cropHeight = this.cropBoxPos.height;
        // Add padding around crop box (20% of container)
        const padding = Math.min(containerWidth, containerHeight) * 0.2;
        const scaleX = (containerWidth - padding) / cropWidth;
        const scaleY = (containerHeight - padding) / cropHeight;
        const newZoom = Math.min(scaleX, scaleY);
        // Store old zoom for pan adjustment
        const oldZoom = this.zoomLevel;
        this.zoomLevel = newZoom;
        // Center the crop box
        const cropCenterX = this.cropBoxPos.x + cropWidth / 2;
        const cropCenterY = this.cropBoxPos.y + cropHeight / 2;
        this.panOffset = {
            x: containerWidth / 2 - cropCenterX * this.zoomLevel,
            y: containerHeight / 2 - cropCenterY * this.zoomLevel
        };
        this.updateZoomDisplay();
        this.render();
    }
    saveCurrentState() {
        this.originalState = {
            cropBox: { ...this.cropBoxPos },
            zoom: this.zoomLevel,
            pan: { ...this.panOffset },
            originalImageUrl: this.image?.src || ''
        };
    }
    enterPreviewMode() {
        if (!this.image)
            return;
        this.saveCurrentState();
        this.isPreviewMode = true;
        // Create a new canvas for the cropped image
        const cropCanvas = document.createElement('canvas');
        const ctx = cropCanvas.getContext('2d');
        // Set canvas size to crop box size
        cropCanvas.width = this.cropBoxPos.width;
        cropCanvas.height = this.cropBoxPos.height;
        // Enable transparency
        ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        // Draw the cropped portion of the image
        ctx.drawImage(this.image, this.cropBoxPos.x, this.cropBoxPos.y, this.cropBoxPos.width, this.cropBoxPos.height, 0, 0, this.cropBoxPos.width, this.cropBoxPos.height);
        // Replace current image with cropped version
        const croppedImageUrl = cropCanvas.toDataURL('image/png');
        this.image.onload = () => {
            // Update UI for preview mode first
            this.updateUIForPreviewMode(true);
            // Reset zoom and pan for the preview
            const container = this.imageCanvas.parentElement;
            if (container && this.image) {
                const scaleX = container.clientWidth / this.image.width;
                const scaleY = container.clientHeight / this.image.height;
                this.zoomLevel = Math.min(scaleX, scaleY);
                // Center the image
                this.panOffset = {
                    x: (container.clientWidth - this.image.width * this.zoomLevel) / 2,
                    y: (container.clientHeight - this.image.height * this.zoomLevel) / 2
                };
            }
            // Update zoom display and render
            this.updateZoomDisplay();
            this.render();
        };
        this.image.src = croppedImageUrl;
    }
    exitPreviewMode() {
        if (!this.image || !this.originalState)
            return;
        this.isPreviewMode = false;
        // Restore original image
        this.image.onload = () => {
            if (!this.originalState)
                return;
            // Restore original state
            this.cropBoxPos = { ...this.originalState.cropBox };
            this.zoomLevel = this.originalState.zoom;
            this.panOffset = { ...this.originalState.pan };
            // Update UI
            this.updateUIForPreviewMode(false);
            this.updateCropBoxDisplay();
            this.updateZoomDisplay();
            this.render();
        };
        this.image.src = this.originalState.originalImageUrl;
    }
    updateUIForPreviewMode(isPreview) {
        // Toggle visibility of buttons
        this.continueEditingBtn.style.display = isPreview ? 'block' : 'none';
        this.downloadBtn.style.display = isPreview ? 'block' : 'none';
        this.applyCropBtn.style.display = isPreview ? 'none' : 'block';
        this.zoomToCropBtn.style.display = isPreview ? 'none' : 'block';
        // Enable/disable Apply Crop button based on preview mode
        this.applyCropBtn.disabled = isPreview;
        // Toggle input fields and zoom controls
        const inputs = document.querySelectorAll('.coordinate-display input, .size-display input');
        inputs.forEach(input => input.disabled = isPreview);
        // Toggle crop box visibility
        if (this.cropBox) {
            this.cropBox.style.display = isPreview ? 'none' : 'block';
        }
    }
    downloadCroppedImage() {
        if (!this.image || !this.isPreviewMode)
            return;
        // Create download link
        const link = document.createElement('a');
        link.download = 'cropped-image.png';
        link.href = this.image.src;
        link.click();
    }
    updateImageTransform() {
        // Implementation of updateImageTransform method
    }
    handleImageLoad() {
        if (!this.image)
            return;
        // Get the natural dimensions of the loaded image
        this.imageWidth = this.image.naturalWidth;
        this.imageHeight = this.image.naturalHeight;
        // Initialize crop box to full image size
        this.cropBoxPos = {
            x: 0,
            y: 0,
            width: this.imageWidth,
            height: this.imageHeight
        };
        // Enable the Apply Crop button since we now have an image
        this.applyCropBtn.disabled = false;
        // Update UI
        this.updateCropBoxDisplay();
        this.zoomToFit();
    }
    clearImage() {
        if (this.image) {
            this.image.src = '';
            this.cropBoxPos = { x: 0, y: 0, width: 0, height: 0 };
            this.zoomLevel = 1;
            this.panOffset = { x: 0, y: 0 };
            this.applyCropBtn.disabled = true; // Disable the button when clearing image
            this.updateCropBoxDisplay();
            this.updateImageTransform();
        }
    }
    resetImage() {
        if (!this.image)
            return;
        this.image.src = '';
        this.applyCropBtn.disabled = true; // Disable the button when resetting image
        // Re-load the image to trigger handleImageLoad
        setTimeout(() => {
            if (this.image && this.originalState) {
                this.image.src = this.originalState.originalImageUrl;
            }
        }, 0);
    }
}
// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new PixelPerfectEditor();
    window.editor = editor; // Type assertion for global access
});
