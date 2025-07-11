import { json } from '@sveltejs/kit'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export async function GET({ url }) {
  try {
    const imagePath = url.searchParams.get('path')
    
    if (!imagePath) {
      return json({ error: 'Image path is required' }, { status: 400 })
    }

    // Security: ensure the path is within the output directory
    const outputDir = path.resolve(process.cwd(), 'data', 'output')
    const fullPath = path.resolve(outputDir, path.basename(imagePath))
    
    // Check if the resolved path is still within the output directory
    if (!fullPath.startsWith(outputDir)) {
      return json({ error: 'Invalid image path' }, { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      return json({ error: 'Image not found' }, { status: 404 })
    }

    // Extract metadata using Sharp
    const metadata = await sharp(fullPath).metadata()
    console.log(metadata)
    
    return json({
      success: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        channels: metadata.channels,
        depth: metadata.depth,
        hasAlpha: metadata.hasAlpha,
        comments: metadata.comments || [],
        // Extract parameters from comments (WebUI style)
        parameters: metadata.comments?.find(comment => comment.keyword === 'parameters')?.text || null,
        exif: metadata.exif ? {
          // Parse EXIF data if available
          imageDescription: metadata.exif.toString().includes('ImageDescription') ? 
            extractExifValue(metadata.exif.toString(), 'ImageDescription') : null,
          software: metadata.exif.toString().includes('Software') ?
            extractExifValue(metadata.exif.toString(), 'Software') : null
        } : null
      }
    })
  } catch (error) {
    console.error('Error reading image metadata:', error)
    return json({ error: 'Failed to read metadata' }, { status: 500 })
  }
}

// Helper function to extract EXIF values (simplified)
function extractExifValue(exifString: string, key: string): string | null {
  try {
    // This is a simplified extraction - in production you might want to use a proper EXIF parser
    const regex = new RegExp(`${key}[\\s\\S]*?([^\\x00-\\x1f\\x7f-\\x9f]+)`, 'i')
    const match = exifString.match(regex)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}