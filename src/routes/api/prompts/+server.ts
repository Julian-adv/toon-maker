// API for prompts storage and retrieval

import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { PromptsData, PromptCategory } from '$lib/types';

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

function createDefaultCategories(): PromptCategory[] {
  return [
    {
      id: 'quality',
      name: 'Quality',
      values: [],
      currentValue: { title: '', value: '' }
    },
    {
      id: 'character',
      name: 'Character',
      values: [],
      currentValue: { title: '', value: '' }
    },
    {
      id: 'outfit',
      name: 'Outfit',
      values: [],
      currentValue: { title: '', value: '' }
    },
    {
      id: 'pose',
      name: 'Pose',
      values: [],
      currentValue: { title: '', value: '' }
    },
    {
      id: 'backgrounds',
      name: 'Backgrounds',
      values: [],
      currentValue: { title: '', value: '' }
    },
    {
      id: 'negative',
      name: 'Negative',
      values: [],
      currentValue: { title: '', value: '' }
    }
  ]
}


export async function GET() {
  await ensureDir()
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const parsedData = JSON.parse(data)
    return json(parsedData)
  } catch (error) {
    // If the file doesn't exist, return a default structure
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      const defaultPrompts: PromptsData = {
        categories: createDefaultCategories(),
        selectedCheckpoint: null,
        useUpscale: true,
        useFaceDetailer: true
      }
      return json(defaultPrompts)
    }
    console.error('Error reading file:', error)
    return json({ error: 'Failed to read data' }, { status: 500 })
  }
}
