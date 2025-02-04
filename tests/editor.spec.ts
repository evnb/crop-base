import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

interface Point {
    x: number;
    y: number;
}

interface CropBox extends Point {
    width: number;
    height: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Photo Editor', () => {
    test.beforeEach(async ({ page }) => {
        // Start from a fresh page for each test
        await page.goto('http://localhost:8000/src/index.html');
        // Wait for DOM content to be loaded
        await page.waitForLoadState('domcontentloaded');
    });

    test('should load with initial state', async ({ page }) => {
        // Wait for specific elements to be ready
        await page.waitForSelector('#uploadButton', { state: 'visible' });
        await page.waitForSelector('#imageCanvas', { state: 'visible' });
        
        // Check initial UI elements
        await expect(page.locator('#uploadButton')).toBeVisible();
        await expect(page.locator('#imageCanvas')).toBeVisible();
        await expect(page.locator('#cropBox')).toBeHidden();
        await expect(page.locator('#zoomLevel')).toHaveText('100%');
    });

    test('should handle image upload', async ({ page }) => {
        // Get the test image path
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        
        // Set up file input handling
        const fileInput = page.locator('#imageInput');
        await fileInput.setInputFiles(imagePath);

        // Verify the crop box appears
        await expect(page.locator('#cropBox')).toBeVisible();
        
        // Verify canvas dimensions match image
        const canvas = page.locator('#imageCanvas');
        await expect(canvas).toBeVisible();
        // We'll need to verify canvas dimensions via JavaScript evaluation
        const dimensions = await page.evaluate(() => {
            const canvas = document.getElementById('imageCanvas') as HTMLCanvasElement;
            return { width: canvas.width, height: canvas.height };
        });
        expect(dimensions.width).toBeGreaterThan(0);
        expect(dimensions.height).toBeGreaterThan(0);
    });

    test('should handle zoom controls', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Test zoom in
        await page.click('#zoomIn');
        await expect(page.locator('#zoomLevel')).toHaveText('125%');

        // Test zoom out
        await page.click('#zoomOut');
        await expect(page.locator('#zoomLevel')).toHaveText('100%');

        // Test mouse wheel zoom
        const canvas = page.locator('#imageCanvas');
        await canvas.hover();
        await page.mouse.wheel(0, -100); // Zoom in
        await expect(page.locator('#zoomLevel')).toHaveText('110%');
    });

    test('should handle panning', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Get initial pan offset
        const getPanOffset = async () => page.evaluate(() => {
            const editor = (window as any).editor;
            return editor.panOffset;
        });

        const initialOffset = await getPanOffset();

        // Perform pan operation (drag right, canvas moves left)
        const canvas = page.locator('#imageCanvas');
        await canvas.hover();
        await page.mouse.down();
        await page.mouse.move(100, 100, { steps: 5 });
        await page.mouse.up();
        
        // Verify pan offset has changed (negative for right movement)
        const newOffset = await getPanOffset();
        expect(newOffset.x).toBeLessThan(initialOffset.x);
        expect(newOffset.y).toBeLessThan(initialOffset.y);
    });

    test('should handle panning in multiple directions', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Helper function to get pan offset
        const getPanOffset = async () => page.evaluate(() => {
            const editor = (window as any).editor;
            return editor.panOffset;
        });

        // Helper function to wait for position update
        const waitForPanUpdate = async (initialOffset: Point) => {
            await page.waitForTimeout(100);
            
            // Get and log current position for debugging
            const currentPos = await getPanOffset();
            console.log('Pan movement:', {
                dx: currentPos.x - initialOffset.x,
                dy: currentPos.y - initialOffset.y,
                current: currentPos,
                initial: initialOffset
            });
            
            if (Math.abs(currentPos.x - initialOffset.x) <= 1 && Math.abs(currentPos.y - initialOffset.y) <= 1) {
                throw new Error('Pan offset did not change enough');
            }
        };

        // Get canvas container bounds to ensure we stay within them
        const container = page.locator('.canvas-container');
        const containerBox = await container.boundingBox();
        if (!containerBox) throw new Error('Canvas container not found');

        // Calculate safe coordinates within the container
        const startX = containerBox.x + containerBox.width / 4;
        const startY = containerBox.y + containerBox.height / 4;
        const endX = containerBox.x + (containerBox.width * 3) / 4;
        const endY = containerBox.y + (containerBox.height * 3) / 4;

        // Move to start position
        await page.mouse.move(startX, startY);
        const initialOffset = await getPanOffset();

        // Test panning right (canvas moves left)
        await page.mouse.down();
        await page.mouse.move(endX, startY, { steps: 10 });
        await page.mouse.up();
        await waitForPanUpdate(initialOffset);
        const rightPanOffset = await getPanOffset();
        expect(rightPanOffset.x).toBeLessThan(initialOffset.x);
        expect(Math.abs(rightPanOffset.y - initialOffset.y)).toBeLessThan(5);

        // Test panning down (canvas moves up)
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX, endY, { steps: 10 });
        await page.mouse.up();
        await waitForPanUpdate(rightPanOffset);
        const downPanOffset = await getPanOffset();
        expect(downPanOffset.y).toBeLessThan(rightPanOffset.y);

        // Test panning left (canvas moves right)
        await page.mouse.move(endX, endY);
        await page.mouse.down();
        await page.mouse.move(startX, endY, { steps: 10 });
        await page.mouse.up();
        await waitForPanUpdate(downPanOffset);
        const leftPanOffset = await getPanOffset();
        expect(leftPanOffset.x).toBeGreaterThan(downPanOffset.x);
    });

    test('should handle crop box movement', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Helper function to get positions
        const getPositions = async () => page.evaluate(() => {
            const editor = (window as any).editor;
            return {
                cropBox: editor.cropBoxPos,
                panOffset: editor.panOffset,
                isDragging: editor.isDraggingCropBox
            };
        });

        // Helper function to wait for position update
        const waitForPositionUpdate = async (initialPos: { cropBox: CropBox }) => {
            await page.waitForTimeout(100);
            
            // Get and log current position for debugging
            const currentPos = await getPositions();
            console.log('Crop box movement:', {
                dx: currentPos.cropBox.x - initialPos.cropBox.x,
                dy: currentPos.cropBox.y - initialPos.cropBox.y,
                current: currentPos.cropBox,
                initial: initialPos.cropBox
            });
            
            if (Math.abs(currentPos.cropBox.x - initialPos.cropBox.x) <= 1 && 
                Math.abs(currentPos.cropBox.y - initialPos.cropBox.y) <= 1) {
                throw new Error('Position did not change enough');
            }
        };

        // Get crop box and ensure it's within canvas container
        const cropBox = page.locator('#cropBox');
        await expect(cropBox).toBeVisible();
        const cropBoxBounds = await cropBox.boundingBox();
        if (!cropBoxBounds) throw new Error('Crop box not found');

        const container = page.locator('.canvas-container');
        const containerBox = await container.boundingBox();
        if (!containerBox) throw new Error('Canvas container not found');

        // Ensure we're clicking within both the container and crop box
        const startX = Math.max(containerBox.x, cropBoxBounds.x + cropBoxBounds.width / 4);
        const startY = Math.max(containerBox.y, cropBoxBounds.y + cropBoxBounds.height / 4);
        const endX = Math.min(containerBox.x + containerBox.width, startX + 50);
        const endY = Math.min(containerBox.y + containerBox.height, startY + 50);

        // Start from within crop box
        await page.mouse.move(startX, startY);
        const initialPos = await getPositions();

        // Move crop box
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up();
        await waitForPositionUpdate(initialPos);

        // Get final positions
        const newPos = await getPositions();

        // Verify position changes
        expect(newPos.cropBox.x).toBeGreaterThan(initialPos.cropBox.x);
        expect(newPos.cropBox.y).toBeGreaterThan(initialPos.cropBox.y);
        expect(Math.abs(newPos.cropBox.x - initialPos.cropBox.x)).toBeGreaterThan(10);
        expect(Math.abs(newPos.cropBox.y - initialPos.cropBox.y)).toBeGreaterThan(10);

        // Verify crop box coordinates are updated in display
        const coordinates = await page.evaluate(() => ({
            x: parseInt(document.getElementById('cropX')?.textContent || '0'),
            y: parseInt(document.getElementById('cropY')?.textContent || '0')
        }));
        expect(coordinates.x).toBe(Math.round(newPos.cropBox.x));
        expect(coordinates.y).toBe(Math.round(newPos.cropBox.y));
    });

    test('should handle crop box movement with zoom', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Zoom in first
        await page.click('#zoomIn');
        await expect(page.locator('#zoomLevel')).toHaveText('125%');

        // Helper function to get positions
        const getPositions = async () => page.evaluate(() => {
            const editor = (window as any).editor;
            return {
                cropBox: editor.cropBoxPos,
                panOffset: editor.panOffset,
                zoomLevel: editor.zoomLevel,
                isDragging: editor.isDraggingCropBox
            };
        });

        // Helper function to wait for position update
        const waitForPositionUpdate = async (initialPos: { cropBox: CropBox }) => {
            // Instead of waiting for a function, we'll use the timeout we added
            await page.waitForTimeout(100);
            
            // Verify the position has actually changed
            const currentPos = await getPositions();
            const dx = currentPos.cropBox.x - initialPos.cropBox.x;
            const dy = currentPos.cropBox.y - initialPos.cropBox.y;
            
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                throw new Error('Position did not change enough');
            }
        };

        // Helper function to wait for pan update
        const waitForPanUpdate = async (initialOffset: Point) => {
            // Instead of waiting for a function, we'll use the timeout we added
            await page.waitForTimeout(100);
            
            // Verify the position has actually changed
            const currentPos = await getPositions();
            const dx = currentPos.panOffset.x - initialOffset.x;
            const dy = currentPos.panOffset.y - initialOffset.y;
            
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                throw new Error('Pan offset did not change enough');
            }
        };

        // Get initial position
        const cropBox = page.locator('#cropBox');
        const cropBoxBounds = await cropBox.boundingBox();
        if (!cropBoxBounds) throw new Error('Crop box not found');

        // Start from center of crop box
        const centerX = cropBoxBounds.x + cropBoxBounds.width / 2;
        const centerY = cropBoxBounds.y + cropBoxBounds.height / 2;
        await page.mouse.move(centerX, centerY);
        const initialPos = await getPositions();

        // Move crop box
        await page.evaluate((coords) => {
            const cropBox = document.getElementById('cropBox');
            if (!cropBox) return;
            
            const pointerDownEvent = new PointerEvent('pointerdown', {
                bubbles: true,
                clientX: coords.centerX,
                clientY: coords.centerY,
                pointerId: 1
            });
            cropBox.dispatchEvent(pointerDownEvent);
        }, { centerX, centerY });

        // Simulate move events with proper pointer properties
        for (let i = 0; i < 10; i++) {
            const newX = centerX + (i + 1) * 10;
            const newY = centerY + (i + 1) * 10;
            
            await page.evaluate((coords) => {
                const moveEvent = new PointerEvent('pointermove', {
                    bubbles: true,
                    clientX: coords.x,
                    clientY: coords.y,
                    pointerId: 1
                });
                document.dispatchEvent(moveEvent);
            }, { x: newX, y: newY });
            
            await page.waitForTimeout(10); // Small delay between moves
        }

        await page.evaluate((coords) => {
            const pointerUpEvent = new PointerEvent('pointerup', {
                bubbles: true,
                clientX: coords.endX,
                clientY: coords.endY,
                pointerId: 1
            });
            document.dispatchEvent(pointerUpEvent);
        }, { endX: centerX + 100, endY: centerY + 100 });

        await page.waitForTimeout(100);

        // Get final positions
        const newPos = await getPositions();

        // Verify position changes with more lenient checks
        expect(newPos.cropBox.x).toBeGreaterThanOrEqual(initialPos.cropBox.x);
        expect(newPos.cropBox.y).toBeGreaterThanOrEqual(initialPos.cropBox.y);
        expect(Math.abs(newPos.cropBox.x - initialPos.cropBox.x)).toBeGreaterThan(5);
        expect(Math.abs(newPos.cropBox.y - initialPos.cropBox.y)).toBeGreaterThan(5);

        // Verify display coordinates are integers
        const coordinates = await page.evaluate(() => ({
            x: parseInt(document.getElementById('cropX')?.textContent || '0'),
            y: parseInt(document.getElementById('cropY')?.textContent || '0')
        }));
        expect(Number.isInteger(coordinates.x)).toBeTruthy();
        expect(Number.isInteger(coordinates.y)).toBeTruthy();
    });

    test('should maintain pixel-perfect coordinates', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Get initial crop box coordinates
        const getCoordinates = async () => page.evaluate(() => {
            return {
                x: document.getElementById('cropX')?.textContent,
                y: document.getElementById('cropY')?.textContent,
                width: document.getElementById('cropWidth')?.textContent,
                height: document.getElementById('cropHeight')?.textContent
            };
        });

        const initialCoords = await getCoordinates();

        // Zoom in and verify coordinates are still integers
        await page.click('#zoomIn');
        const zoomedCoords = await getCoordinates();

        // Verify all coordinates are whole numbers
        Object.values(zoomedCoords).forEach(value => {
            expect(value).toMatch(/^\d+$/);
        });
    });
}); 