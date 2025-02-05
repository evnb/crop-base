interface Point {
    x: number;
    y: number;
}

interface CropBox extends Point {
    width: number;
    height: number;
}

enum DragMode {
    None,
    Move,
    ResizeN,
    ResizeS,
    ResizeE,
    ResizeW,
    ResizeNW,
    ResizeNE,
    ResizeSW,
    ResizeSE
}

/**
 * PixelPerfectEditor - A class that handles pixel-perfect image editing operations
 * Features:
 * - Precise pixel coordinate tracking during zoom and pan
 * - Nearest neighbor scaling for crisp image display
 * - Crop box with exact pixel position maintenance
 * - Smooth pan and zoom controls
 */
class PixelPerfectEditor {
    private readonly imageInput: HTMLInputElement;
    private readonly uploadButton: HTMLButtonElement;
    private readonly imageCanvas: HTMLCanvasElement;
    private readonly cropBox: HTMLDivElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly zoomInBtn: HTMLButtonElement;
    private readonly zoomOutBtn: HTMLButtonElement;
    private readonly zoomToFitBtn: HTMLButtonElement;
    private readonly zoomToCropBtn: HTMLButtonElement;
    private readonly zoomLevelDisplay: HTMLElement;
    private readonly cropXDisplay: HTMLElement;
    private readonly cropYDisplay: HTMLElement;
    private readonly cropWidthDisplay: HTMLElement;
    private readonly cropHeightDisplay: HTMLElement;

    private image: HTMLImageElement | null = null;
    private zoomLevel: number = 1;
    private panOffset: Point = { x: 0, y: 0 };
    private cropBoxPos: CropBox = { x: 0, y: 0, width: 0, height: 0 };
    private isDragging: boolean = false;
    private dragStart: Point = { x: 0, y: 0 };
    private isDraggingCropBox: boolean = false;
    private isDraggingCanvas: boolean = false;
    private dragStartCropBox: Point = { x: 0, y: 0 };
    private dragStartCanvasOffset: Point = { x: 0, y: 0 };
    private currentDragMode: DragMode = DragMode.None;
    private readonly RESIZE_HANDLE_SIZE = 10; // Size of the edge/corner hit area in pixels

    constructor() {
        // DOM Elements
        const imageInput = document.getElementById('imageInput');
        const uploadButton = document.getElementById('uploadButton');
        const imageCanvas = document.getElementById('imageCanvas') as HTMLCanvasElement;
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
        const zoomLevelDisplay = document.getElementById('zoomLevel');
        
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
        if (!zoomLevelDisplay) {
            throw new Error('Zoom level display not found');
        }

        this.zoomInBtn = zoomInBtn;
        this.zoomOutBtn = zoomOutBtn;
        this.zoomToFitBtn = zoomToFitBtn;
        this.zoomToCropBtn = zoomToCropBtn;
        this.zoomLevelDisplay = zoomLevelDisplay;
        
        // Position display elements
        const elements = {
            cropX: document.getElementById('cropX'),
            cropY: document.getElementById('cropY'),
            cropWidth: document.getElementById('cropWidth'),
            cropHeight: document.getElementById('cropHeight')
        };

        // Validate position display elements
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                throw new Error(`${key} display element not found`);
            }
        });

        this.cropXDisplay = elements.cropX!;
        this.cropYDisplay = elements.cropY!;
        this.cropWidthDisplay = elements.cropWidth!;
        this.cropHeightDisplay = elements.cropHeight!;
        
        this.initializeEventListeners();
        
        // Expose editor instance globally for testing
        (window as any).editor = this;
    }

    private initializeEventListeners(): void {
        // Upload and zoom controls (keep these as click events)
        this.uploadButton.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        this.zoomInBtn.addEventListener('click', () => this.zoom(1.25));
        this.zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        this.zoomToFitBtn.addEventListener('click', () => this.zoomToFit());
        this.zoomToCropBtn.addEventListener('click', () => this.zoomToCrop());
        
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

    private async handleImageUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
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

    private loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private resetView(): void {
        if (!this.image) return;

        // Get container dimensions
        const container = this.imageCanvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate zoom to fit
        const scaleX = containerWidth / this.image.width;
        const scaleY = containerHeight / this.image.height;
        this.zoomLevel = Math.min(scaleX, scaleY, 1); // Don't zoom in past 100% for large images

        // For very small images (like pixel art), ensure they're at least 1/4 of the container
        const minScale = Math.max(
            containerWidth * 0.25 / this.image.width,
            containerHeight * 0.25 / this.image.height
        );
        this.zoomLevel = Math.max(this.zoomLevel, minScale);

        // Center the image
        this.panOffset = {
            x: (containerWidth - this.image.width * this.zoomLevel) / 2,
            y: (containerHeight - this.image.height * this.zoomLevel) / 2
        };

        this.updateZoomDisplay();
    }

    private initializeCanvas(): void {
        if (!this.image) return;

        // Set canvas size to match container
        const container = this.imageCanvas.parentElement;
        if (!container) return;

        this.imageCanvas.width = container.clientWidth;
        this.imageCanvas.height = container.clientHeight;
        
        // Initialize crop box relative to image size and zoom level
        const defaultCropSize = Math.min(
            this.image.width * this.zoomLevel,
            this.image.height * this.zoomLevel,
            Math.min(this.image.width, this.image.height) // Don't make crop larger than image
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

    private render(): void {
        if (!this.image) return;

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

    private zoom(factor: number): void {
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

    private updateZoomDisplay(): void {
        this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    private updateCropBoxDisplay(): void {
        // Update position displays
        this.cropXDisplay.textContent = Math.round(this.cropBoxPos.x).toString();
        this.cropYDisplay.textContent = Math.round(this.cropBoxPos.y).toString();
        this.cropWidthDisplay.textContent = Math.round(this.cropBoxPos.width).toString();
        this.cropHeightDisplay.textContent = Math.round(this.cropBoxPos.height).toString();
        
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

    private getDragMode(e: PointerEvent): DragMode {
        const rect = this.cropBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const handleSize = this.RESIZE_HANDLE_SIZE;
        
        // Check corners first (they take precedence over edges)
        if (x <= handleSize && y <= handleSize) return DragMode.ResizeNW;
        if (x >= rect.width - handleSize && y <= handleSize) return DragMode.ResizeNE;
        if (x <= handleSize && y >= rect.height - handleSize) return DragMode.ResizeSW;
        if (x >= rect.width - handleSize && y >= rect.height - handleSize) return DragMode.ResizeSE;
        
        // Then check edges
        if (y <= handleSize) return DragMode.ResizeN;
        if (y >= rect.height - handleSize) return DragMode.ResizeS;
        if (x <= handleSize) return DragMode.ResizeW;
        if (x >= rect.width - handleSize) return DragMode.ResizeE;
        
        // If not on any edge/corner, it's a move
        return DragMode.Move;
    }

    private handleCropBoxMouseDown(e: PointerEvent): void {
        e.stopPropagation();
        e.preventDefault();
        
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        
        this.isDraggingCropBox = true;
        this.isDraggingCanvas = false;
        this.currentDragMode = this.getDragMode(e);
        
        this.dragStartCropBox = {
            x: e.clientX,
            y: e.clientY
        };
        this.dragStartCanvasOffset = { ...this.panOffset };
    }

    private handleCanvasMouseDown(e: PointerEvent): void {
        if (this.isDraggingCropBox) return;
        e.preventDefault(); // Prevent any default behavior
        
        // Set pointer capture to ensure we get all pointer events
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        
        this.isDraggingCanvas = true;
        this.isDraggingCropBox = false;
        
        // Store initial positions for relative movement
        this.dragStartCanvasOffset = {
            x: e.clientX,
            y: e.clientY
        };
    }

    private handleMouseMove(e: PointerEvent): void {
        if (!this.isDraggingCropBox && !this.isDraggingCanvas) return;

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
        } else if (this.isDraggingCanvas) {
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

    private handleMouseUp(e: PointerEvent): void {
        if (!this.isDraggingCropBox && !this.isDraggingCanvas) return;
        
        // Release pointer capture
        if (this.isDraggingCropBox) {
            this.cropBox.releasePointerCapture(e.pointerId);
        } else if (this.isDraggingCanvas) {
            this.imageCanvas.releasePointerCapture(e.pointerId);
        }
        
        this.isDraggingCropBox = false;
        this.isDraggingCanvas = false;
        
        // Ensure final render
        requestAnimationFrame(() => this.render());
    }

    private handleCanvasWheel(e: WheelEvent): void {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    }

    private zoomToFit(): void {
        if (!this.image) return;

        const container = this.imageCanvas.parentElement;
        if (!container) return;

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

    private zoomToCrop(): void {
        if (!this.image) return;

        const container = this.imageCanvas.parentElement;
        if (!container) return;

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
}

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new PixelPerfectEditor();
    (window as any).editor = editor; // Type assertion for global access
});