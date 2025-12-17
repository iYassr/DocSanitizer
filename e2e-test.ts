import { _electron as electron, ElectronApplication, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function runTest() {
  console.log('🚀 Starting Electron app...');

  let electronApp: ElectronApplication;

  try {
    // Launch Electron app
    electronApp = await electron.launch({
      args: ['.'],
      cwd: process.cwd(),
    });

    // Get the first window
    const window: Page = await electronApp.firstWindow();

    console.log('✅ App launched successfully');
    console.log('📐 Window title:', await window.title());

    // Wait for app to fully load
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(2000);

    // Take screenshot of initial state
    const screenshotDir = './screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }

    await window.screenshot({ path: `${screenshotDir}/01-initial-load.png`, fullPage: true });
    console.log('📸 Screenshot saved: 01-initial-load.png');

    // Get page content info
    const pageContent = await window.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body?.innerText?.slice(0, 500),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText),
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder })),
      };
    });

    console.log('\n📋 Page Analysis:');
    console.log('  Title:', pageContent.title);
    console.log('  Headings:', pageContent.headings);
    console.log('  Buttons:', pageContent.buttons);
    console.log('  Inputs:', pageContent.inputs);
    console.log('  Body preview:', pageContent.bodyText?.slice(0, 200));

    // Check for the upload area
    const uploadArea = await window.$('[class*="upload"], [class*="drop"], input[type="file"]');
    if (uploadArea) {
      console.log('\n✅ Upload area found');
    } else {
      console.log('\n⚠️ Upload area not found');
    }

    // Check visible elements and their layout
    const layoutInfo = await window.evaluate(() => {
      const elements = document.querySelectorAll('div, section, main, header');
      const visibleElements: Array<{tag: string, class: string, rect: DOMRect, text: string}> = [];

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50 && rect.top < window.innerHeight) {
          visibleElements.push({
            tag: el.tagName,
            class: el.className?.toString()?.slice(0, 100) || '',
            rect: rect,
            text: el.textContent?.slice(0, 50) || ''
          });
        }
      });

      return {
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        elementsCount: visibleElements.length,
        mainElements: visibleElements.slice(0, 10)
      };
    });

    console.log('\n📐 Layout Info:');
    console.log('  Window size:', layoutInfo.windowSize);
    console.log('  Visible elements:', layoutInfo.elementsCount);

    // Check for any error messages in the UI
    const errors = await window.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .text-red, .text-danger');
      return Array.from(errorElements).map(el => el.textContent?.trim()).filter(Boolean);
    });

    if (errors.length > 0) {
      console.log('\n❌ Error messages found:', errors);
    } else {
      console.log('\n✅ No error messages visible');
    }

    // Test file upload with a sample text file
    console.log('\n🧪 Testing file upload...');

    // Create a test file
    const testFilePath = path.join(process.cwd(), 'test-document.txt');
    fs.writeFileSync(testFilePath, `
Test Document for DocSanitizer

Contact Information:
Name: John Smith
Email: john.smith@example.com
Phone: +1 (555) 123-4567
SSN: 123-45-6789

Company: Acme Corporation
Address: 123 Main Street, New York, NY 10001

Financial Information:
Credit Card: 4111-1111-1111-1111
IBAN: GB82WEST12345698765432
Amount: $50,000.00

Technical Details:
IP Address: 192.168.1.100
API Key: sk_live_abcdef123456789
AWS Key: AKIAIOSFODNN7EXAMPLE

Date: January 15, 2024
    `.trim());

    console.log('📄 Test file created:', testFilePath);

    // Find file input and upload
    const fileInput = await window.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(testFilePath);
      console.log('📤 File uploaded via input');

      // Wait for processing
      await window.waitForTimeout(3000);

      // Take screenshot after upload
      await window.screenshot({ path: `${screenshotDir}/02-after-upload.png`, fullPage: true });
      console.log('📸 Screenshot saved: 02-after-upload.png');

      // Check if we moved to review step
      const currentState = await window.evaluate(() => {
        return {
          bodyText: document.body?.innerText?.slice(0, 1000),
          hasDetections: document.body?.innerText?.includes('detection') ||
                        document.body?.innerText?.includes('Detection') ||
                        document.body?.innerText?.includes('found'),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText),
        };
      });

      console.log('\n📋 After upload state:');
      console.log('  Has detections:', currentState.hasDetections);
      console.log('  Buttons:', currentState.buttons);
      console.log('  Content preview:', currentState.bodyText?.slice(0, 300));

    } else {
      console.log('⚠️ File input not found, trying drag-drop area...');

      // Look for dropzone
      const dropzone = await window.$('[class*="drop"], [class*="upload"]');
      if (dropzone) {
        console.log('Found dropzone element');
      }
    }

    // Wait a bit and take final screenshot
    await window.waitForTimeout(2000);
    await window.screenshot({ path: `${screenshotDir}/03-final-state.png`, fullPage: true });
    console.log('📸 Screenshot saved: 03-final-state.png');

    // Check console logs
    window.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Console error:', msg.text());
      }
    });

    // Cleanup
    fs.unlinkSync(testFilePath);
    console.log('\n✅ Test completed!');
    console.log('📁 Screenshots saved to:', path.resolve(screenshotDir));

    await electronApp.close();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();
