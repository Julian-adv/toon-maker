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

export async function saveImage(imageBlob: Blob, prompt?: string): Promise<string | null> {
  try {
    let response: Response
    
    if (prompt) {
      // Send as form data with prompt metadata
      const formData = new FormData()
      formData.append('image', imageBlob, 'generated-image.png')
      formData.append('prompt', prompt)
      
      response = await fetch('/api/image', {
        method: 'POST',
        body: formData
      })
    } else {
      // Send as direct blob (backward compatibility)
      response = await fetch('/api/image', {
        method: 'POST',
        body: imageBlob
      })
    }
    
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
      // Extract filename from path
      const fileName = result.filePath.split('/').pop() || result.filePath.split('\\').pop()
      return fileName || null
    }
  } catch (error) {
    console.error('Error saving image:', error);
    return null
  }
}

export function getImageUrl(imagePath: string): string {
  // Extract just the filename from the path for security
  const fileName = imagePath.split('/').pop() || imagePath.split('\\').pop() || imagePath
  
  // Create URL with query parameter
  return `/api/image?path=${encodeURIComponent(fileName)}`
}

export async function getImageMetadata(imagePath: string): Promise<any> {
  try {
    const fileName = imagePath.split('/').pop() || imagePath.split('\\').pop() || imagePath
    const response = await fetch(`/api/image?path=${encodeURIComponent(fileName)}&metadata=true`)
    
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
