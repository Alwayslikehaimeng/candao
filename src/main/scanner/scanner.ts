import { readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { parseCode } from './parser'
import type { ScanResult } from '../../shared/types'

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.wmv', '.flv', '.mov', '.m4v', '.ts', '.rmvb', '.rm']

export function scanFolder(folderPath: string): ScanResult[] {
  const results: ScanResult[] = []

  function scan(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        scan(fullPath)
        continue
      }

      const ext = extname(entry.name).toLowerCase()
      if (!VIDEO_EXTENSIONS.includes(ext)) continue

      const code = parseCode(entry.name)
      let category: ScanResult['category'] = null

      if (code) {
        if (code.toUpperCase().startsWith('FC2')) {
          category = 'fc2'
        } else if (/^[A-Z]{2,5}-\d{3,5}$/i.test(code)) {
          category = 'av'
        }
      }

      results.push({
        file_path: fullPath,
        file_name: entry.name,
        code,
        category
      })
    }
  }

  scan(folderPath)
  return results
}

export { parseCode }
