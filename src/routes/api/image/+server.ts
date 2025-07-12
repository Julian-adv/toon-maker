import { json } from '@sveltejs/kit'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import extractChunks from 'png-chunks-extract'
import encodeChunks from 'png-chunks-encode'
import textChunk from 'png-chunk-text'
import { DEFAULT_OUTPUT_DIRECTORY } from '$lib/constants'
import { getTodayDate, getFormattedTime } from '$lib/utils/date'

export async function GET({ url }) {
  try {
    const imagePath = url.searchParams.get('path')
    const metadataOnly = url.searchParams.get('metadata') === 'true'
    
    if (!imagePath) {
      return json({ error: 'Image path is required' }, { status: 400 })
    }

    // Use the full path directly
    const fullPath = path.resolve(imagePath)
    
    // Security: ensure the path is a real file and contains no directory traversal
    if (imagePath.includes('..') || !path.isAbsolute(imagePath)) {
      return json({ error: 'Invalid image path' }, { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      return json({ error: 'Image not found' }, { status: 404 })
    }

    // If only metadata is requested, return JSON with metadata
    if (metadataOnly) {
      // Extract metadata using Sharp
      const metadata = await sharp(fullPath).metadata()
      
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
          // Extract parameters from PNG text chunks (WebUI style)
          parameters: await extractPngParameters(fullPath),
        }
      })
    }

    // Otherwise, serve the image file
    const imageBuffer = await fs.readFile(fullPath)
    const fileExtension = path.extname(fullPath).toLowerCase()
    
    // Determine content type
    let contentType = 'application/octet-stream'
    if (fileExtension === '.png') {
      contentType = 'image/png'
    } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg'
    } else if (fileExtension === '.webp') {
      contentType = 'image/webp'
    }

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return json({ error: 'Failed to serve image' }, { status: 500 })
  }
}

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type')
    
    let imageBuffer: Buffer
    let promptText = ''
    let outputDirectory = DEFAULT_OUTPUT_DIRECTORY
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with prompt metadata and output directory
      const formData = await request.formData()
      const imageFile = formData.get('image') as File
      const prompt = formData.get('prompt') as string
      const outputDir = formData.get('outputDirectory') as string
      
      if (imageFile) {
        imageBuffer = Buffer.from(await imageFile.arrayBuffer())
        promptText = prompt || ''
        outputDirectory = outputDir || DEFAULT_OUTPUT_DIRECTORY
      } else {
        throw new Error('No image file found in form data')
      }
    } else {
      // Handle direct blob upload (backward compatibility)
      const imageBlob = await request.blob()
      imageBuffer = Buffer.from(await imageBlob.arrayBuffer())
    }

    const baseOutputDir = path.resolve(process.cwd(), outputDirectory)
    const todayFolder = getTodayDate()
    const finalOutputDir = path.join(baseOutputDir, todayFolder)
    await fs.mkdir(finalOutputDir, { recursive: true })

    const fileName = `${getFormattedTime()}.png`
    const filePath = path.join(finalOutputDir, fileName)

    // Add metadata to PNG if prompt is provided
    if (promptText) {
      // Format prompt in WebUI style with parameters
      const parametersText = `${promptText}
Steps: 28, Sampler: euler_ancestral, Schedule type: simple, CFG scale: 5, Seed: ${Math.floor(Math.random() * 10000000000)}, Size: 832x1216, Software: Toon Maker`

      // First process the image with Sharp
      const processedBuffer = await sharp(imageBuffer)
        .png({
          compressionLevel: 6,
          palette: false
        })
        .toBuffer()
      
      // Extract PNG chunks
      const chunks = extractChunks(processedBuffer)
      
      // Create a text chunk with parameters (WebUI style)
      const parametersChunk = textChunk.encode('parameters', parametersText)
      
      // Insert the text chunk before the IEND chunk
      const iendIndex = chunks.findIndex((chunk: any) => chunk.name === 'IEND')
      if (iendIndex > -1) {
        chunks.splice(iendIndex, 0, parametersChunk)
      } else {
        chunks.push(parametersChunk)
      }
      
      // Encode chunks back to PNG buffer
      const finalBuffer = Buffer.from(encodeChunks(chunks))
      
      await fs.writeFile(filePath, finalBuffer)
      
      console.log('Added parameters metadata:', parametersText)
    } else {
      // Save without metadata if no prompt provided
      await fs.writeFile(filePath, imageBuffer)
    }

    return json({ success: true, filePath, prompt: promptText })
  } catch (error) {
    console.error('Error saving image:', error)
    return json({ success: false, error: 'Failed to save image' }, { status: 500 })
  }
}

// Helper function to extract PNG parameters from text chunks
async function extractPngParameters(filePath: string): Promise<string | null> {
  try {
    const imageBuffer = await fs.readFile(filePath)
    const chunks = extractChunks(imageBuffer)
    
    // Look for text chunks containing parameters
    for (const chunk of chunks) {
      if (chunk.name === 'tEXt') {
        try {
          const decoded = textChunk.decode(chunk.data)
          if (decoded.keyword === 'parameters') {
            return decoded.text
          }
        } catch {
          // Skip invalid text chunks
        }
      }
    }
    return null
  } catch {
    return null
  }
}
