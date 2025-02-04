interface Point {
    x: number;
    y: number;
}

interface CropBox extends Point {
    width: number;
    height: number;
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
        const zoomLevelDisplay = document.getElementById('zoomLevel');
        
        if (!zoomInBtn || !(zoomInBtn instanceof HTMLButtonElement)) {
            throw new Error('Zoom in button not found');
        }
        if (!zoomOutBtn || !(zoomOutBtn instanceof HTMLButtonElement)) {
            throw new Error('Zoom out button not found');
        }
        if (!zoomLevelDisplay) {
            throw new Error('Zoom level display not found');
        }

        this.zoomInBtn = zoomInBtn;
        this.zoomOutBtn = zoomOutBtn;
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
        console.log('Initializing event listeners');
        
        // Upload handling
        this.uploadButton.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.zoom(1.25));
        this.zoomOutBtn.addEventListener('click', () => this.zoom(0.8));

        // Canvas interaction events
        this.imageCanvas.addEventListener('mousedown', (e) => {
            console.log('Canvas mousedown');
            this.handleCanvasMouseDown(e);
        });
        
        // Document-level mouse events
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingCropBox || this.isDraggingCanvas) {
                console.log('Mouse move with dragging:', {
                    isDraggingCropBox: this.isDraggingCropBox,
                    isDraggingCanvas: this.isDraggingCanvas
                });
            }
            this.handleMouseMove(e);
        });
        
        document.addEventListener('mouseup', (e) => {
            console.log('Document mouseup');
            this.handleMouseUp(e);
        });
        
        // Canvas wheel event
        this.imageCanvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));

        // Crop box interaction events
        console.log('Setting up crop box event listeners');
        this.cropBox.addEventListener('mousedown', (e) => {
            console.log('Crop box mousedown event:', {
                target: e.target,
                currentTarget: e.currentTarget,
                clientX: e.clientX,
                clientY: e.clientY
            });
            this.handleCropBoxMouseDown(e);
        });
        
        // Debug click events on crop box
        this.cropBox.addEventListener('click', (e) => {
            console.log('Crop box clicked:', {
                target: e.target,
                currentTarget: e.currentTarget
            });
            e.stopPropagation();
        });
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
            
            // Initialize crop box
            const initialSize = Math.min(image.width, image.height) / 2;
            this.cropBoxPos = {
                x: (image.width - initialSize) / 2,
                y: (image.height - initialSize) / 2,
                width: initialSize,
                height: initialSize
            };
            
            // Show crop box and update its position
            console.log('Showing crop box with position:', this.cropBoxPos);
            this.cropBox.style.display = 'block';
            this.updateCropBoxDisplay();
            
            // Log element visibility
            console.log('Crop box display style:', this.cropBox.style.display);
            console.log('Crop box computed style:', window.getComputedStyle(this.cropBox).display);
            console.log('Crop box dimensions:', {
                left: this.cropBox.style.left,
                top: this.cropBox.style.top,
                width: this.cropBox.style.width,
                height: this.cropBox.style.height
            });
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
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.updateZoomDisplay();
    }

    private initializeCanvas(): void {
        if (!this.image) return;

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
    }

    private handleCropBoxMouseDown(e: MouseEvent): void {
        console.log('Crop box mouse down:', {
            clientX: e.clientX,
            clientY: e.clientY
        });
        e.stopPropagation();
        this.isDraggingCropBox = true;
        this.isDraggingCanvas = false;
        
        // Store initial positions for relative movement
        this.dragStartCropBox = {
            x: this.cropBoxPos.x,
            y: this.cropBoxPos.y
        };
        this.dragStart = {
            x: e.clientX,
            y: e.clientY
        };
    }

    private handleCanvasMouseDown(e: MouseEvent): void {
        if (this.isDraggingCropBox) return;
        e.preventDefault(); // Prevent any default behavior
        this.isDraggingCanvas = true;
        this.isDraggingCropBox = false;
        
        // Store initial positions for relative movement
        this.dragStartCanvasOffset = {
            x: e.clientX,
            y: e.clientY
        };
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.isDraggingCropBox && !this.isDraggingCanvas) return;

        if (this.isDraggingCropBox) {
            console.log('Moving crop box:', {
                clientX: e.clientX,
                clientY: e.clientY,
                dragStart: this.dragStart,
                dragStartCropBox: this.dragStartCropBox
            });
            
            // Calculate relative movement in screen coordinates
            const deltaX = (e.clientX - this.dragStart.x) / this.zoomLevel;
            const deltaY = (e.clientY - this.dragStart.y) / this.zoomLevel;
            
            // Update crop box position relative to its starting position
            const newX = this.dragStartCropBox.x + deltaX;
            const newY = this.dragStartCropBox.y + deltaY;
            
            // Apply bounds checking
            if (this.image) {
                this.cropBoxPos.x = Math.max(0, Math.min(newX, this.image.width - this.cropBoxPos.width));
                this.cropBoxPos.y = Math.max(0, Math.min(newY, this.image.height - this.cropBoxPos.height));
            } else {
                this.cropBoxPos.x = newX;
                this.cropBoxPos.y = newY;
            }
            
            // Update display
            this.updateCropBoxDisplay();
            requestAnimationFrame(() => this.render());
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

    private handleMouseUp(e: MouseEvent): void {
        console.log('Mouse up:', {
            wasDraggingCropBox: this.isDraggingCropBox,
            wasDraggingCanvas: this.isDraggingCanvas,
            finalPosition: this.cropBoxPos
        });
        
        if (this.isDraggingCropBox || this.isDraggingCanvas) {
            e.preventDefault();
            this.isDraggingCropBox = false;
            this.isDraggingCanvas = false;
            this.render();
        }
    }

    private handleCanvasWheel(e: WheelEvent): void {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    }
}

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new PixelPerfectEditor();
    (window as any).editor = editor; // Type assertion for global access
});