import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

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

        const canvas = page.locator('#imageCanvas');
        await canvas.hover();

        // Test panning right (canvas moves left)
        const initialOffset = await getPanOffset();
        await page.mouse.down();
        await page.mouse.move(100, 0, { steps: 5 });
        await page.mouse.up();
        const rightPanOffset = await getPanOffset();
        expect(rightPanOffset.x).toBeLessThan(initialOffset.x);
        expect(rightPanOffset.y).toBe(initialOffset.y);

        // Test panning down (canvas moves up)
        await page.mouse.down();
        await page.mouse.move(100, 100, { steps: 5 });
        await page.mouse.up();
        const downPanOffset = await getPanOffset();
        expect(downPanOffset.y).toBeLessThan(rightPanOffset.y);

        // Test panning left (canvas moves right)
        await page.mouse.down();
        await page.mouse.move(0, 100, { steps: 5 });
        await page.mouse.up();
        const leftPanOffset = await getPanOffset();
        expect(leftPanOffset.x).toBeGreaterThan(downPanOffset.x);
    });

    test('should handle crop box movement', async ({ page }) => {
        // Upload image first
        const imagePath = path.join(__dirname, '../testimages/lewis-fungi-31a2.jpg');
        await page.locator('#imageInput').setInputFiles(imagePath);

        // Helper function to get crop box position and pan offset
        const getPositions = async () => page.evaluate(() => {
            const editor = (window as any).editor;
            return {
                cropBox: editor.cropBoxPos,
                panOffset: editor.panOffset
            };
        });

        // Get initial position
        const cropBox = page.locator('#cropBox');
        await expect(cropBox).toBeVisible();
        const initialPos = await getPositions();

        // Move crop box
        await cropBox.hover();
        await page.mouse.down();
        await page.mouse.move(50, 50, { steps: 5 });
        await page.mouse.up();

        // Verify new position
        const newPos = await getPositions();
        
        // Calculate expected position change accounting for pan offset
        const expectedX = initialPos.cropBox.x + (50 - (newPos.panOffset.x - initialPos.panOffset.x)) / 1;  // 1 is zoom level
        const expectedY = initialPos.cropBox.y + (50 - (newPos.panOffset.y - initialPos.panOffset.y)) / 1;
        
        expect(newPos.cropBox.x).toBeCloseTo(expectedX, 1);
        expect(newPos.cropBox.y).toBeCloseTo(expectedY, 1);

        // Verify crop box coordinates are updated in display
        const coordinates = await page.evaluate(() => ({
            x: parseInt(document.getElementById('cropX')?.textContent || '0'),
            y: parseInt(document.getElementById('cropY')?.textContent || '0')
        }));
        expect(coordinates.x).toBeCloseTo(newPos.cropBox.x, 0);
        expect(coordinates.y).toBeCloseTo(newPos.cropBox.y, 0);
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
                zoomLevel: editor.zoomLevel
            };
        });

        // Get initial position
        const initialPos = await getPositions();

        // Move crop box
        const cropBox = page.locator('#cropBox');
        await cropBox.hover();
        await page.mouse.down();
        await page.mouse.move(100, 100, { steps: 5 });
        await page.mouse.up();

        // Verify new position
        const newPos = await getPositions();
        
        // Calculate expected position change accounting for zoom and pan
        const expectedX = initialPos.cropBox.x + (100 - (newPos.panOffset.x - initialPos.panOffset.x)) / newPos.zoomLevel;
        const expectedY = initialPos.cropBox.y + (100 - (newPos.panOffset.y - initialPos.panOffset.y)) / newPos.zoomLevel;
        
        expect(newPos.cropBox.x).toBeCloseTo(expectedX, 1);
        expect(newPos.cropBox.y).toBeCloseTo(expectedY, 1);
        
        // Coordinates should still be whole numbers in display
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