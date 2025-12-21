# Claude Code Instructions for maskr

## Project Overview
maskr is an Electron desktop app for detecting and masking sensitive information in documents. Built with React 19, TypeScript, Vite 7, and Electron 39.

## Critical Build/Test Workflow

### Before Telling User "It Works"
1. **Always rebuild before testing**: `npm run build:vite`
2. **Run tests to verify**: `npm test` (runs all 35 E2E tests)
3. **Never rely on dev mode for verification** - dev mode can have stale Electron builds

### Running the App
```bash
# For development with hot reload (renderer only - Electron main may be stale!)
npm run dev

# For reliable testing (builds everything fresh)
npm run build:vite && npx electron dist-electron/main.js
```

### Common Gotcha
`npm run dev` hot-reloads the React frontend but the **Electron main process** may use stale code. If user reports errors like "Failed to analyze text" or "Failed to parse document", the fix is usually:
```bash
npm run build:vite
```

## Release Workflow

### Before Tagging a Release
1. Update version in `package.json`: `npm version X.Y.Z --no-git-tag-version`
2. Commit the version bump
3. Then create tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"`

### Building All Platforms
```bash
npm run build -- --mac --win --linux --x64 --arm64
```

### Release File Naming
- Avoid spaces in filenames (GitHub upload fails)
- Current naming convention:
  - macOS: `maskr-X.Y.Z-arm64-mac.zip`, `maskr-X.Y.Z-mac.zip`
  - Windows: `maskr-X.Y.Z-setup.exe`, `maskr-X.Y.Z-portable.exe`
  - Linux: `maskr-X.Y.Z.AppImage`, `maskr_X.Y.Z_amd64.deb`

### Uploading to GitHub
```bash
gh release create vX.Y.Z --title "maskr vX.Y.Z - Title" --notes "..." file1 file2 ...
```

## Testing

### Test Files Location
- `tests/e2e.spec.ts` - Core workflow tests (4 tests)
- `tests/comprehensive.spec.ts` - Extended tests (13 tests)
- `tests/all-formats.spec.ts` - Format-specific tests (12 tests)
- `tests/binary-formats.spec.ts` - DOCX/XLSX/PDF tests (6 tests)

### Running Tests
```bash
npm test                    # All tests
npx playwright test tests/e2e.spec.ts  # Specific file
```

## Key Dependencies (External in Vite Build)
These are marked as external in `vite.config.ts` and must be available at runtime:
- compromise (NLP for name detection)
- mammoth (DOCX parsing)
- exceljs (XLSX handling)
- pdfjs-dist, pdf-lib (PDF handling)
- tesseract.js (OCR)
- sharp (image processing)

## Lessons Learned
1. **Verify before declaring success** - Run tests, don't just start the app
2. **Rebuild on errors** - Most "failed to analyze/parse" errors are stale build issues
3. **Check version consistency** - package.json version must match git tag
4. **Test the actual build** - Use production build for user-facing verification
