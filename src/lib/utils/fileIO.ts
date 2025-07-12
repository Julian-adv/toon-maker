export interface PromptsData {
	qualityValues: string[];
	characterValues: string[];
	outfitValues: string[];
	poseValues: string[];
	backgroundsValues: string[];
	selectedCheckpoint: string | null;
	useUpscale: boolean;
	useFaceDetailer: boolean;
	qualityValue: string;
	characterValue: string;
	outfitValue: string;
	poseValue: string;
	backgroundsValue: string;
}

export async function savePrompts(data: PromptsData): Promise<void> {
	try {
		await fetch('/api/prompts', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
	} catch (error) {
		console.error('Failed to save prompts:', error);
	}
}

export async function loadPrompts(): Promise<PromptsData | null> {
  try {
    const response = await fetch('/api/prompts');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load prompts from server:', error);
    return null;
  }
}

export async function saveImage(imageBlob: Blob, prompt: string, outputDirectory: string): Promise<string | null> {
  try {
    // Send as form data with prompt metadata and output directory
    const formData = new FormData()
    formData.append('image', imageBlob, 'generated-image.png')
    formData.append('prompt', prompt)
    formData.append('outputDirectory', outputDirectory)
    
    const response = await fetch('/api/image', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to save image:', errorData.error);
      return null
    } else {
      const result = await response.json();
      console.log('Image saved successfully:', result.filePath);
      if (result.prompt) {
        console.log('Prompt metadata added:', result.prompt);
      }
      // Return the full file path
      return result.filePath
    }
  } catch (error) {
    console.error('Error saving image:', error);
    return null
  }
}

export function getImageUrl(imagePath: string): string {
  // Create URL with full path
  return `/api/image?path=${encodeURIComponent(imagePath)}`
}

export async function getImageMetadata(imagePath: string): Promise<any> {
  try {
    const response = await fetch(`/api/image?path=${encodeURIComponent(imagePath)}&metadata=true`)
    
    if (response.ok) {
      const result = await response.json()
      return result.metadata
    } else {
      console.error('Failed to fetch image metadata')
      return null
    }
  } catch (error) {
    console.error('Error fetching image metadata:', error)
    return null
  }
}

export async function getImageList(outputDirectory: string): Promise<string[]> {
  try {
    const params = new URLSearchParams()
    params.append('outputDirectory', outputDirectory)
    const url = '/api/image-list?' + params.toString()
    const response = await fetch(url)
    
    if (response.ok) {
      const result = await response.json()
      return result.files || []
    } else {
      console.error('Failed to fetch image list')
      return []
    }
  } catch (error) {
    console.error('Error fetching image list:', error)
    return []
  }
}

export async function loadSettings(): Promise<any> {
  try {
    const response = await fetch('/api/settings')
    
    if (response.ok) {
      const result = await response.json()
      return result.settings
    } else {
      console.error('Failed to fetch settings')
      return null
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return null
  }
}

export async function saveSettings(settings: any): Promise<boolean> {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    })
    
    if (response.ok) {
      console.log('Settings saved successfully')
      return true
    } else {
      const errorData = await response.json()
      console.error('Failed to save settings:', errorData.error)
      return false
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}
