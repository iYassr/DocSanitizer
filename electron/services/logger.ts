/**
 * @fileoverview Local Error Logger
 *
 * Provides local file-based logging for debugging issues on user devices.
 * Logs are stored in the app's user data directory and can be exported
 * for troubleshooting without sending data to external servers.
 *
 * Log location:
 * - macOS: ~/Library/Application Support/maskr/logs/
 * - Windows: %APPDATA%/maskr/logs/
 * - Linux: ~/.config/maskr/logs/
 *
 * @module electron/services/logger
 */

import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync, appendFileSync } from 'fs'

/** Maximum log file size before rotation (5MB) */
const MAX_LOG_SIZE = 5 * 1024 * 1024

/** Number of rotated log files to keep */
const MAX_LOG_FILES = 3

/** Log directory path */
let logDir: string | null = null

/** Current log file path */
let logFile: string | null = null

/**
 * Initialize the logger - creates log directory if needed
 */
function ensureLogDir(): string {
  if (!logDir) {
    logDir = path.join(app.getPath('userData'), 'logs')
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
  }
  return logDir
}

/**
 * Get the current log file path
 */
function getLogFile(): string {
  if (!logFile) {
    const dir = ensureLogDir()
    logFile = path.join(dir, 'maskr.log')
  }
  return logFile
}

/**
 * Format a log entry with timestamp and level
 */
function formatEntry(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? `\n  ${JSON.stringify(data, null, 2).replace(/\n/g, '\n  ')}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}\n`
}

/**
 * Rotate log files if current file exceeds max size
 */
async function rotateIfNeeded(): Promise<void> {
  const file = getLogFile()

  try {
    const stats = await fs.stat(file)
    if (stats.size < MAX_LOG_SIZE) return

    // Rotate existing log files
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldFile = `${file}.${i}`
      const newFile = `${file}.${i + 1}`
      if (existsSync(oldFile)) {
        if (i === MAX_LOG_FILES - 1) {
          await fs.unlink(oldFile)
        } else {
          await fs.rename(oldFile, newFile)
        }
      }
    }

    // Rotate current log file
    await fs.rename(file, `${file}.1`)
  } catch {
    // File doesn't exist yet or rotation failed - continue
  }
}

/**
 * Write a log entry to file (sync to ensure it's written before crash)
 */
function writeLog(level: string, message: string, data?: unknown): void {
  try {
    const file = getLogFile()
    const entry = formatEntry(level, message, data)
    appendFileSync(file, entry)
  } catch (error) {
    // Last resort: console output
    console.error('Failed to write to log file:', error)
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, data?: unknown): void {
  writeLog('info', message, data)
}

/**
 * Log a warning message
 */
export function logWarn(message: string, data?: unknown): void {
  writeLog('warn', message, data)
}

/**
 * Log an error message
 */
export function logError(message: string, error?: unknown): void {
  const errorData = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : error
  writeLog('error', message, errorData)
}

/**
 * Log app startup info
 */
export function logStartup(): void {
  rotateIfNeeded().catch(() => {})

  logInfo('=== maskr started ===', {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node,
    userData: app.getPath('userData')
  })
}

/**
 * Get the log file path for export
 */
export function getLogPath(): string {
  return getLogFile()
}

/**
 * Get the log directory path
 */
export function getLogDir(): string {
  return ensureLogDir()
}

/**
 * Read the current log file contents
 */
export async function readLogs(): Promise<string> {
  try {
    const file = getLogFile()
    if (!existsSync(file)) {
      return 'No logs yet.'
    }
    const content = await fs.readFile(file, 'utf-8')
    // Return last 1000 lines max
    const lines = content.split('\n')
    if (lines.length > 1000) {
      return `... (showing last 1000 lines)\n${lines.slice(-1000).join('\n')}`
    }
    return content
  } catch (error) {
    return `Failed to read logs: ${error}`
  }
}

/**
 * Clear all log files
 */
export async function clearLogs(): Promise<void> {
  const dir = ensureLogDir()
  const files = await fs.readdir(dir)

  for (const file of files) {
    if (file.startsWith('maskr.log')) {
      await fs.unlink(path.join(dir, file))
    }
  }
}
