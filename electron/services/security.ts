/**
 * Security utilities for input validation and path safety
 */

import path from 'path'
import { app } from 'electron'

// Allowed file extensions for document processing
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  'txt', 'md', 'docx', 'xlsx', 'pdf', 'csv', 'json', 'html'
])

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'
])

const ALL_ALLOWED_EXTENSIONS = new Set([
  ...ALLOWED_DOCUMENT_EXTENSIONS,
  ...ALLOWED_IMAGE_EXTENSIONS
])

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

// Maximum text input length (10MB of text)
const MAX_TEXT_LENGTH = 10 * 1024 * 1024

// Directories that should never be accessed
const FORBIDDEN_PATHS = [
  '/etc',
  '/System',
  '/usr',
  '/bin',
  '/sbin',
  '/var',
  '/private/etc',
  '/private/var',
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\ProgramData'
]

/**
 * Validates that a file path is safe to access
 * - Must be absolute
 * - Must not contain path traversal
 * - Must have allowed extension
 * - Must not be in forbidden directories
 */
export function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  // Check if path is provided
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'File path is required' }
  }

  // Normalize the path to resolve any ../ or ./ segments
  const normalizedPath = path.normalize(filePath)

  // Check for path traversal attempts
  if (normalizedPath !== filePath && filePath.includes('..')) {
    return { valid: false, error: 'Path traversal detected' }
  }

  // Must be absolute path
  if (!path.isAbsolute(normalizedPath)) {
    return { valid: false, error: 'Path must be absolute' }
  }

  // Check extension
  const ext = path.extname(normalizedPath).toLowerCase().slice(1)
  if (!ext || !ALL_ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not allowed. Allowed: ${[...ALL_ALLOWED_EXTENSIONS].join(', ')}`
    }
  }

  // Check forbidden paths
  const normalizedLower = normalizedPath.toLowerCase()
  for (const forbidden of FORBIDDEN_PATHS) {
    if (normalizedLower.startsWith(forbidden.toLowerCase())) {
      return { valid: false, error: 'Access to system directories is not allowed' }
    }
  }

  return { valid: true }
}

/**
 * Validates just the file extension (for cases where buffer is already provided)
 * Used when we only need to check format, not access the file
 */
export function validateFileExtension(fileName: string): { valid: boolean; error?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: 'File name is required' }
  }

  // Check for path traversal in filename
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { valid: false, error: 'Invalid file name' }
  }

  // Check extension
  const ext = path.extname(fileName).toLowerCase().slice(1)
  if (!ext || !ALL_ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not allowed. Allowed: ${[...ALL_ALLOWED_EXTENSIONS].join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Validates file path specifically for drag-and-drop operations
 * Additional check: ensure it's within user-accessible directories
 */
export function validateDragDropPath(filePath: string): { valid: boolean; error?: string } {
  const baseValidation = validateFilePath(filePath)
  if (!baseValidation.valid) {
    return baseValidation
  }

  const normalizedPath = path.normalize(filePath)
  const homeDir = app.getPath('home')
  const tempDir = app.getPath('temp')
  const downloadsDir = app.getPath('downloads')
  const documentsDir = app.getPath('documents')
  const desktopDir = app.getPath('desktop')

  // Must be within user-accessible directories
  const allowedBasePaths = [homeDir, tempDir, downloadsDir, documentsDir, desktopDir]
  const isInAllowedPath = allowedBasePaths.some(base =>
    normalizedPath.startsWith(base)
  )

  if (!isInAllowedPath) {
    return { valid: false, error: 'File must be in a user-accessible directory' }
  }

  return { valid: true }
}

/**
 * Validates buffer size
 */
export function validateBufferSize(base64Data: string): { valid: boolean; error?: string } {
  if (!base64Data || typeof base64Data !== 'string') {
    return { valid: false, error: 'Buffer data is required' }
  }

  // Estimate actual size (base64 is ~33% larger than binary)
  const estimatedSize = Math.ceil(base64Data.length * 0.75)

  if (estimatedSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${Math.round(estimatedSize / 1024 / 1024)}MB) exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`
    }
  }

  return { valid: true }
}

/**
 * Validates text input length
 */
export function validateTextInput(text: string): { valid: boolean; error?: string } {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Text must be a string' }
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Text length exceeds maximum allowed (${MAX_TEXT_LENGTH / 1024 / 1024}MB)`
    }
  }

  return { valid: true }
}

/**
 * Validates profile ID (alphanumeric + dashes only)
 */
export function validateProfileId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Profile ID is required' }
  }

  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return { valid: false, error: 'Profile ID contains invalid characters' }
  }

  if (id.length > 100) {
    return { valid: false, error: 'Profile ID is too long' }
  }

  return { valid: true }
}

/**
 * Validates threshold value (0-100)
 */
export function validateThreshold(threshold: number): { valid: boolean; error?: string } {
  if (typeof threshold !== 'number' || isNaN(threshold)) {
    return { valid: false, error: 'Threshold must be a number' }
  }

  if (threshold < 0 || threshold > 100) {
    return { valid: false, error: 'Threshold must be between 0 and 100' }
  }

  return { valid: true }
}

/**
 * Sanitizes filename for export (removes dangerous characters)
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'document'
  }

  // Remove path separators and null bytes
  return filename
    .replace(/[/\\:*?"<>|\x00]/g, '_')
    .slice(0, 255)
}
