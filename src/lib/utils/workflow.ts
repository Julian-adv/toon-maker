// ComfyUI workflow configuration and constants

export const FINAL_SAVE_NODE_ID = 'final_save_output' // Consistent ID for our dynamically added save node

import type { ComfyUIWorkflow } from '$lib/types'

// Dynamic LoRA chain generation
export function generateLoraChain(selectedLoras: string[], workflow: ComfyUIWorkflow, loraWeight: number = 0.8) {
  // Remove existing LoRA nodes (70-85)
  for (let i = 70; i <= 85; i++) {
    delete workflow[i.toString()]
  }

  if (selectedLoras.length === 0) {
    // If no LoRAs selected, update all references to point to node '11'
    updateLoraReferences(workflow, '11')
    return
  }

  // Generate LoRA chain starting from node 70
  let previousModelNode = '11'
  let previousClipNode = '11'
  let lastLoraNodeId = '11'

  selectedLoras.forEach((lora, index) => {
    const nodeId = (70 + index).toString()
    
    workflow[nodeId] = {
      inputs: {
        lora_name: lora,
        strength_model: loraWeight,
        strength_clip: loraWeight,
        model: [previousModelNode, 0],
        clip: [previousClipNode, 1]
      },
      class_type: 'LoraLoader',
      _meta: {
        title: `Load LoRA ${index + 1}`
      }
    }

    previousModelNode = nodeId
    previousClipNode = nodeId
    lastLoraNodeId = nodeId
  })

  // Update all references to the last LoRA node
  updateLoraReferences(workflow, lastLoraNodeId)
}

function updateLoraReferences(workflow: ComfyUIWorkflow, targetNodeId: string) {
  // Update all nodes that were referencing '85' to use the target node
  const nodesToUpdate = ['10', '12', '13', '18', '51', '56', '69']
  
  nodesToUpdate.forEach(nodeId => {
    if (workflow[nodeId] && workflow[nodeId].inputs) {
      if (workflow[nodeId].inputs.model && Array.isArray(workflow[nodeId].inputs.model)) {
        workflow[nodeId].inputs.model = [targetNodeId, 0]
      }
      if (workflow[nodeId].inputs.clip && Array.isArray(workflow[nodeId].inputs.clip)) {
        workflow[nodeId].inputs.clip = [targetNodeId, 1]
      }
    }
  })
}

export const defaultWorkflowPrompt = {
  '2': {
    inputs: {
      value: 0,
      width: 832,
      height: 1216
    },
    class_type: 'SolidMask',
    _meta: {
      title: 'SolidMask'
    }
  },
  '3': {
    inputs: {
      value: 1,
      width: 832,
      height: 1216
    },
    class_type: 'SolidMask',
    _meta: {
      title: 'SolidMask'
    }
  },
  '10': {
    inputs: {
      model: ['85', 0],
      base_mask: ['3', 0],
      cond_1: ['13', 0],
      mask_1: ['87', 0],
      cond_2: ['51', 0],
      mask_2: ['88', 0]
    },
    class_type: 'AttentionCouple|cgem156',
    _meta: {
      title: 'Attention Couple 🍌'
    }
  },
  '11': {
    inputs: {
      ckpt_name: 'model.safetensors'
    },
    class_type: 'CheckpointLoaderSimple',
    _meta: {
      title: 'Load Checkpoint'
    }
  },
  '12': {
    inputs: {
      text: 'overall base prompt',
      clip: ['11', 1]
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)'
    }
  },
  '13': {
    inputs: {
      text: 'left side prompt',
      clip: ['85', 1]
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)'
    }
  },
  '14': {
    inputs: {
      add_noise: true,
      noise_seed: 712011592294887,
      cfg: 4.5,
      model: ['10', 0],
      positive: ['12', 0],
      negative: ['18', 0],
      sampler: ['15', 0],
      sigmas: ['45', 0],
      latent_image: ['16', 0]
    },
    class_type: 'SamplerCustom',
    _meta: {
      title: 'SamplerCustom'
    }
  },
  '15': {
    inputs: {
      sampler_name: 'euler_ancestral'
    },
    class_type: 'KSamplerSelect',
    _meta: {
      title: 'KSamplerSelect'
    }
  },
  '16': {
    inputs: {
      width: 832,
      height: 1216,
      batch_size: 1
    },
    class_type: 'EmptyLatentImage',
    _meta: {
      title: 'Empty Latent Image'
    }
  },
  '18': {
    inputs: {
      text: 'negative prompt',
      clip: ['11', 1]
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)'
    }
  },
  '19': {
    inputs: {
      samples: ['14', 1],
      vae: ['11', 2]
    },
    class_type: 'VAEDecode',
    _meta: {
      title: 'VAE Decode'
    }
  },
  '45': {
    inputs: {
      scheduler: 'simple',
      steps: 25,
      denoise: 1,
      model: ['10', 0]
    },
    class_type: 'BasicScheduler',
    _meta: {
      title: 'BasicScheduler'
    }
  },
  '51': {
    inputs: {
      text: 'right side prompt',
      clip: ['85', 1]
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)'
    }
  },
  '56': {
    inputs: {
      guide_size: 512,
      guide_size_for: true,
      max_size: 1024,
      seed: 136661438945910,
      steps: 15,
      cfg: 4.5,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 0.4,
      feather: 5,
      noise_mask: true,
      force_inpaint: true,
      bbox_threshold: 0.5,
      bbox_dilation: 10,
      bbox_crop_factor: 3,
      sam_detection_hint: 'center-1',
      sam_dilation: 0,
      sam_threshold: 0.93,
      sam_bbox_expansion: 0,
      sam_mask_hint_threshold: 0.7,
      sam_mask_hint_use_negative: 'False',
      drop_size: 10,
      wildcard: '',
      cycle: 1,
      inpaint_model: false,
      noise_mask_feather: 20,
      tiled_encode: false,
      tiled_decode: false,
      image: ['19', 0],
      model: ['85', 0],
      clip: ['85', 1],
      vae: ['11', 2],
      positive: ['12', 0],
      negative: ['18', 0],
      bbox_detector: ['57', 0],
      sam_model_opt: ['58', 0],
      segm_detector_opt: ['59', 1]
    },
    class_type: 'FaceDetailer',
    _meta: {
      title: 'FaceDetailer1'
    }
  },
  '57': {
    inputs: {
      model_name: 'bbox/face_yolov8m.pt'
    },
    class_type: 'UltralyticsDetectorProvider',
    _meta: {
      title: 'UltralyticsDetectorProvider'
    }
  },
  '58': {
    inputs: {
      model_name: 'sam_vit_b_01ec64.pth',
      device_mode: 'AUTO'
    },
    class_type: 'SAMLoader',
    _meta: {
      title: 'SAMLoader (Impact)'
    }
  },
  '59': {
    inputs: {
      model_name: 'segm/person_yolov8m-seg.pt'
    },
    class_type: 'UltralyticsDetectorProvider',
    _meta: {
      title: 'UltralyticsDetectorProvider'
    }
  },
  '64': {
    inputs: {
      upscale_model: ['65', 0],
      image: ['19', 0]
    },
    class_type: 'ImageUpscaleWithModel',
    _meta: {
      title: 'Upscale Image (using Model)'
    }
  },
  '65': {
    inputs: {
      model_name: '4x_foolhardy_Remacri.pt'
    },
    class_type: 'UpscaleModelLoader',
    _meta: {
      title: 'Load Upscale Model'
    }
  },
  '69': {
    inputs: {
      guide_size: 1024,
      guide_size_for: true,
      max_size: 1536,
      seed: 562575562233700,
      steps: 15,
      cfg: 4.5,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 0.4,
      feather: 5,
      noise_mask: true,
      force_inpaint: true,
      bbox_threshold: 0.5,
      bbox_dilation: 10,
      bbox_crop_factor: 3,
      sam_detection_hint: 'center-1',
      sam_dilation: 0,
      sam_threshold: 0.93,
      sam_bbox_expansion: 0,
      sam_mask_hint_threshold: 0.7,
      sam_mask_hint_use_negative: 'False',
      drop_size: 10,
      wildcard: '',
      cycle: 1,
      inpaint_model: false,
      noise_mask_feather: 20,
      tiled_encode: false,
      tiled_decode: false,
      image: ['64', 0],
      model: ['85', 0],
      clip: ['85', 1],
      vae: ['11', 2],
      positive: ['12', 0],
      negative: ['18', 0],
      bbox_detector: ['57', 0],
      sam_model_opt: ['58', 0],
      segm_detector_opt: ['59', 1]
    },
    class_type: 'FaceDetailer',
    _meta: {
      title: 'FaceDetailer'
    }
  },
  '86': {
    inputs: {
      image: 'static\\left-horizontal-mask.png'
    },
    class_type: 'LoadImage',
    _meta: {
      title: 'Load Image'
    }
  },
  '87': {
    inputs: {
      channel: 'red',
      image: ['86', 0]
    },
    class_type: 'ImageToMask',
    _meta: {
      title: 'Convert Image to Mask'
    }
  },
  '88': {
    inputs: {
      mask: ['87', 0]
    },
    class_type: 'InvertMask',
    _meta: {
      title: 'InvertMask'
    }
  }
}
