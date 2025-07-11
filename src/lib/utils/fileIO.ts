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

export async function saveImage(imageBlob: Blob): Promise<void> {
  try {
    const response = await fetch('/api/save-image', {
      method: 'POST',
      body: imageBlob
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to save image:', errorData.error);
    }
  } catch (error) {
    console.error('Error saving image:', error);
  }
}
