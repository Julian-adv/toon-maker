import { json } from '@sveltejs/kit'
import fs from 'fs/promises'
import path from 'path'

const dataDir = path.resolve(process.cwd(), 'data')
const filePath = path.join(dataDir, 'qualityValues.json')

// Ensure the data directory exists
async function ensureDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

export async function POST({ request }) {
  await ensureDir()
  const { qualityValues } = await request.json()

  try {
    await fs.writeFile(filePath, JSON.stringify(qualityValues, null, 2))
    return json({ success: true })
  } catch (error) {
    console.error('Error writing to file:', error)
    return json({ success: false, error: 'Failed to save data' }, { status: 500 })
  }
}

export async function GET() {
  await ensureDir()
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return json(JSON.parse(data))
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return json([])
    }
    console.error('Error reading file:', error)
    return json({ error: 'Failed to read data' }, { status: 500 })
  }
}
