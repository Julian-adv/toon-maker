import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { PromptsData } from '$lib/utils/fileIO';

const dataDir = path.resolve(process.cwd(), 'data')
const filePath = path.join(dataDir, 'prompts.json')

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
  const data: PromptsData = await request.json()

  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
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
    // If the file doesn't exist, return a default structure
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      const defaultPrompts: PromptsData = {
        qualityValues: [],
        characterValues: [],
        outfitValues: [],
        poseValues: [],
        backgroundsValues: [],
        selectedCheckpoint: null,
        useUpscale: true,
        useFaceDetailer: true,
        qualityValue: '',
        characterValue: '',
        outfitValue: '',
        poseValue: '',
        backgroundsValue: ''
      };
      return json(defaultPrompts);
    }
    console.error('Error reading file:', error)
    return json({ error: 'Failed to read data' }, { status: 500 })
  }
}
