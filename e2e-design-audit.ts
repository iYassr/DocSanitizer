import { _electron as electron, ElectronApplication, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function runDesignAudit() {
  console.log('🎨 Starting Design Audit...\n');

  let electronApp: ElectronApplication;

  try {
    electronApp = await electron.launch({ args: ['.'] });
    const window: Page = await electronApp.firstWindow();

    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(2000);

    const screenshotDir = './screenshots';
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

    // UPLOAD STEP AUDIT
    console.log('='.repeat(60));
    console.log('📤 UPLOAD STEP ANALYSIS');
    console.log('='.repeat(60));

    await window.screenshot({ path: `${screenshotDir}/audit-01-upload.png`, fullPage: true });

    const uploadAnalysis = await window.evaluate(() => {
      const issues: string[] = [];
      const suggestions: string[] = [];

      // Check step indicator
      const stepIndicator = document.querySelector('[class*="step"], [class*="progress"]');

      // Check dropzone
      const dropzone = document.querySelector('[class*="drop"], [class*="upload"]');
      if (dropzone) {
        const rect = dropzone.getBoundingClientRect();
        const style = window.getComputedStyle(dropzone);
        if (rect.height < 200) {
          issues.push(`Dropzone too small: ${rect.height}px height`);
          suggestions.push('Increase dropzone height to at least 250px');
        }
      }

      // Check text readability
      const allText = document.querySelectorAll('p, span, div, h1, h2, h3, label');
      let smallTextCount = 0;
      allText.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 12 && el.textContent?.trim()) {
          smallTextCount++;
        }
      });
      if (smallTextCount > 5) {
        issues.push(`${smallTextCount} elements with font-size < 12px`);
        suggestions.push('Increase minimum font size to 12px for readability');
      }

      // Check color contrast
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      const bgColor = bodyStyle.backgroundColor;

      // Check button visibility
      const buttons = document.querySelectorAll('button');
      if (buttons.length === 0) {
        issues.push('No visible buttons on upload step');
      }

      // Check spacing
      const mainContent = document.querySelector('main, [class*="content"], [class*="container"]');
      if (mainContent) {
        const style = window.getComputedStyle(mainContent);
        const padding = parseFloat(style.padding);
        if (padding < 16) {
          issues.push('Insufficient content padding');
          suggestions.push('Add more padding to main content area');
        }
      }

      return { issues, suggestions, bgColor };
    });

    console.log('\n🔍 Issues Found:');
    uploadAnalysis.issues.forEach(i => console.log(`  ❌ ${i}`));
    console.log('\n💡 Suggestions:');
    uploadAnalysis.suggestions.forEach(s => console.log(`  → ${s}`));

    // Upload test file
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

    const fileInput = await window.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(testFilePath);
      await window.waitForTimeout(3000);
    }

    // REVIEW STEP AUDIT
    console.log('\n' + '='.repeat(60));
    console.log('📋 REVIEW STEP ANALYSIS');
    console.log('='.repeat(60));

    await window.screenshot({ path: `${screenshotDir}/audit-02-review.png`, fullPage: true });

    const reviewAnalysis = await window.evaluate(() => {
      const issues: string[] = [];
      const suggestions: string[] = [];

      // Check list items spacing
      const listItems = document.querySelectorAll('[class*="detection"], [class*="item"], li');
      let crampedItems = 0;
      listItems.forEach(item => {
        const style = window.getComputedStyle(item);
        const marginBottom = parseFloat(style.marginBottom);
        const padding = parseFloat(style.padding);
        if (marginBottom < 8 && padding < 8) {
          crampedItems++;
        }
      });
      if (crampedItems > 3) {
        issues.push(`${crampedItems} list items with cramped spacing`);
        suggestions.push('Add more margin/padding between detection items (min 12px)');
      }

      // Check font sizes in review panel
      const reviewText = document.querySelectorAll('[class*="review"] *, [class*="detection"] *, [class*="panel"] *');
      let tinyText = 0;
      reviewText.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 13 && el.textContent?.trim().length > 0) {
          tinyText++;
        }
      });
      if (tinyText > 10) {
        issues.push(`${tinyText} text elements smaller than 13px in review panel`);
        suggestions.push('Increase font size to minimum 13px for better readability');
      }

      // Check scroll areas
      const scrollAreas = document.querySelectorAll('[class*="scroll"], [style*="overflow"]');
      scrollAreas.forEach((area, i) => {
        const rect = area.getBoundingClientRect();
        if (rect.height < 100 && rect.height > 0) {
          issues.push(`Scroll area ${i+1} may be too small: ${Math.round(rect.height)}px`);
        }
      });

      // Check panel widths
      const panels = document.querySelectorAll('[class*="panel"], [class*="sidebar"], aside');
      panels.forEach((panel, i) => {
        const rect = panel.getBoundingClientRect();
        if (rect.width < 250 && rect.width > 0) {
          issues.push(`Panel ${i+1} too narrow: ${Math.round(rect.width)}px`);
          suggestions.push('Increase panel width to at least 300px');
        }
      });

      // Check buttons
      const buttons = document.querySelectorAll('button');
      let smallButtons = 0;
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.height < 32 && rect.height > 0) {
          smallButtons++;
        }
      });
      if (smallButtons > 0) {
        issues.push(`${smallButtons} buttons smaller than 32px height`);
        suggestions.push('Make buttons at least 36px tall for better clickability');
      }

      // Check category tabs/filters
      const tabs = document.querySelectorAll('[class*="tab"], [role="tab"]');
      if (tabs.length > 0) {
        let crampedTabs = 0;
        tabs.forEach(tab => {
          const style = window.getComputedStyle(tab);
          const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          if (padding < 16) crampedTabs++;
        });
        if (crampedTabs > 0) {
          issues.push(`${crampedTabs} tabs with insufficient padding`);
          suggestions.push('Add more horizontal padding to category tabs');
        }
      }

      // Check checkbox sizes
      const checkboxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"], [class*="checkbox"]');
      checkboxes.forEach((cb, i) => {
        const rect = cb.getBoundingClientRect();
        if (rect.width < 16 || rect.height < 16) {
          issues.push(`Checkbox ${i+1} too small: ${rect.width}x${rect.height}px`);
        }
      });

      // Check preview panel
      const preview = document.querySelector('[class*="preview"], [class*="document"]');
      if (preview) {
        const rect = preview.getBoundingClientRect();
        const style = window.getComputedStyle(preview);
        if (rect.width < 400) {
          issues.push(`Preview panel too narrow: ${Math.round(rect.width)}px`);
          suggestions.push('Preview panel should be at least 50% of screen width');
        }
      }

      // Check line height
      const textBlocks = document.querySelectorAll('p, div, span');
      let tightLineHeight = 0;
      textBlocks.forEach(el => {
        const style = window.getComputedStyle(el);
        const lineHeight = parseFloat(style.lineHeight);
        const fontSize = parseFloat(style.fontSize);
        if (lineHeight > 0 && fontSize > 0 && lineHeight / fontSize < 1.3) {
          tightLineHeight++;
        }
      });
      if (tightLineHeight > 10) {
        issues.push(`${tightLineHeight} elements with tight line-height (<1.3)`);
        suggestions.push('Increase line-height to at least 1.5 for readability');
      }

      // Get layout dimensions
      const layout = {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        listWidth: 0,
        previewWidth: 0
      };

      const leftPanel = document.querySelector('[class*="list"], [class*="sidebar"]:first-child');
      const rightPanel = document.querySelector('[class*="preview"], [class*="document"]');
      if (leftPanel) layout.listWidth = leftPanel.getBoundingClientRect().width;
      if (rightPanel) layout.previewWidth = rightPanel.getBoundingClientRect().width;

      return { issues, suggestions, layout };
    });

    console.log('\n🔍 Issues Found:');
    reviewAnalysis.issues.forEach(i => console.log(`  ❌ ${i}`));
    console.log('\n💡 Suggestions:');
    reviewAnalysis.suggestions.forEach(s => console.log(`  → ${s}`));
    console.log('\n📐 Layout Dimensions:');
    console.log(`  Window: ${reviewAnalysis.layout.windowWidth}x${reviewAnalysis.layout.windowHeight}`);
    console.log(`  List panel: ${reviewAnalysis.layout.listWidth}px`);
    console.log(`  Preview panel: ${reviewAnalysis.layout.previewWidth}px`);

    // CSS ANALYSIS
    console.log('\n' + '='.repeat(60));
    console.log('🎨 CSS/STYLING ANALYSIS');
    console.log('='.repeat(60));

    const cssAnalysis = await window.evaluate(() => {
      const issues: string[] = [];

      // Check for inconsistent spacing
      const margins = new Set<string>();
      const paddings = new Set<string>();
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.margin !== '0px') margins.add(style.margin);
        if (style.padding !== '0px') paddings.add(style.padding);
      });

      if (margins.size > 20) {
        issues.push(`Inconsistent margins: ${margins.size} different values used`);
      }
      if (paddings.size > 20) {
        issues.push(`Inconsistent padding: ${paddings.size} different values used`);
      }

      // Check for color consistency
      const colors = new Set<string>();
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
          colors.add(style.color);
        }
      });

      // Check truncation/overflow
      let truncatedText = 0;
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.textOverflow === 'ellipsis' || style.overflow === 'hidden') {
          if (el.scrollWidth > el.clientWidth) {
            truncatedText++;
          }
        }
      });
      if (truncatedText > 5) {
        issues.push(`${truncatedText} elements with truncated text`);
      }

      return { issues, colorCount: colors.size };
    });

    console.log('\n🔍 CSS Issues:');
    cssAnalysis.issues.forEach(i => console.log(`  ❌ ${i}`));
    console.log(`\n📊 Color palette: ${cssAnalysis.colorCount} colors used`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DESIGN AUDIT SUMMARY');
    console.log('='.repeat(60));

    const totalIssues = uploadAnalysis.issues.length + reviewAnalysis.issues.length + cssAnalysis.issues.length;
    console.log(`\n❌ Total issues found: ${totalIssues}`);
    console.log('\n🔑 KEY PROBLEMS:');
    console.log('  1. Text too small / poor readability');
    console.log('  2. Cramped spacing between elements');
    console.log('  3. List items need more breathing room');
    console.log('  4. Buttons may be too small for touch/click');
    console.log('  5. Line height too tight');

    // Cleanup
    fs.unlinkSync(testFilePath);
    await electronApp.close();

    console.log('\n✅ Design audit complete!');
    console.log('📁 Screenshots saved to:', path.resolve(screenshotDir));

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

runDesignAudit();
