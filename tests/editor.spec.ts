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

        // Get initial transform
        const getTransform = async () => page.evaluate(() => {
            const canvas = document.getElementById('imageCanvas') as HTMLCanvasElement;
            const style = window.getComputedStyle(canvas);
            return style.transform;
        });

        const initialTransform = await getTransform();

        // Perform pan operation
        const canvas = page.locator('#imageCanvas');
        await canvas.hover();
        await page.mouse.down();
        await page.mouse.move(100, 100);
        
        // Verify transform has changed
        const newTransform = await getTransform();
        expect(newTransform).not.toBe(initialTransform);
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