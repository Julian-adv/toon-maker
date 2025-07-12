import { json } from '@sveltejs/kit'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const outputDir = path.resolve(process.cwd(), 'data', 'output')
    
    // Check if output directory exists
    try {
      await fs.access(outputDir)
    } catch {
      // If directory doesn't exist, return empty list
      return json({
        success: true,
        files: []
      })
    }

    const files = await fs.readdir(outputDir)
    const imageFiles = files
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .sort() // Sort alphabetically (which should be chronological due to timestamp naming)
    
    return json({
      success: true,
      files: imageFiles
    })
  } catch (error) {
    console.error('Error reading output directory:', error)
    return json({ error: 'Failed to read output directory' }, { status: 500 })
  }
}