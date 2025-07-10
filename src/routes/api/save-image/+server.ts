import { json } from '@sveltejs/kit'
import fs from 'fs/promises'
import path from 'path'

// Function to format date as yyyy-mm-dd-HH-MM
function getFormattedDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

export async function POST({ request }) {
  try {
    const imageBlob = await request.blob()
    const buffer = Buffer.from(await imageBlob.arrayBuffer())

    const outputDir = path.resolve(process.cwd(), 'data', 'output')
    await fs.mkdir(outputDir, { recursive: true })

    const fileName = `${getFormattedDate()}.png`
    const filePath = path.join(outputDir, fileName)

    await fs.writeFile(filePath, buffer)

    return json({ success: true, filePath })
  } catch (error) {
    console.error('Error saving image:', error)
    return json({ success: false, error: 'Failed to save image' }, { status: 500 })
  }
}
