// ComfyUI workflow configuration and constants

export const FINAL_SAVE_NODE_ID = 'final_save_output' // Consistent ID for our dynamically added save node

export const defaultWorkflowPrompt = {
  '5': {
    inputs: {
      guide_size: 512,
      guide_size_for: true,
      max_size: 1216,
      seed: 836267740683999,
      steps: 25,
      cfg: 4.5,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 0.5,
      feather: 5,
      noise_mask: true,
      force_inpaint: false,
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
      inpaint_model: true,
      noise_mask_feather: 20,
      tiled_encode: false,
      tiled_decode: false,
      image: ['18', 0],
      model: ['10', 0],
      clip: ['28', 1],
      vae: ['10', 2],
      positive: ['28', 2],
      negative: ['28', 3],
      bbox_detector: ['20', 0],
      sam_model_opt: ['6', 0],
      segm_detector_opt: ['29', 1]
    },
    class_type: 'FaceDetailer',
    _meta: {
      title: 'FaceDetailer1'
    }
  },
  '6': {
    inputs: {
      model_name: 'sam_vit_b_01ec64.pth',
      device_mode: 'AUTO'
    },
    class_type: 'SAMLoader',
    _meta: {
      title: 'SAMLoader (Impact)'
    }
  },
  '8': {
    inputs: {
      seed: 764212958336468,
      steps: 28,
      cfg: 5,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 1,
      model: ['28', 0],
      positive: ['28', 2],
      negative: ['28', 3],
      latent_image: ['9', 0]
    },
    class_type: 'KSampler',
    _meta: {
      title: 'KSampler'
    }
  },
  '9': {
    inputs: {
      width: ['28', 5],
      height: ['28', 6],
      batch_size: 1
    },
    class_type: 'EmptyLatentImage',
    _meta: {
      title: 'Empty Latent Image'
    }
  },
  '10': {
    inputs: {
      ckpt_name: ''
    },
    class_type: 'CheckpointLoaderSimple',
    _meta: {
      title: 'Load Checkpoint'
    }
  },
  '11': {
    inputs: {
      text: '',
      clip: ['10', 1]
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)'
    }
  },
  '12': {
    inputs: {
      text: '',
      clip: ['10', 1]
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)'
    }
  },
  '14': {
    inputs: {
      upscale_method: 'nearest-exact',
      scale_by: 2.0,
      samples: ['8', 0]
    },
    class_type: 'LatentUpscaleBy',
    _meta: {
      title: 'Upscale Latent By'
    }
  },
  '15': {
    inputs: {
      samples: ['17', 0],
      vae: ['10', 2]
    },
    class_type: 'VAEDecode',
    _meta: {
      title: 'VAE Decode'
    }
  },
  '17': {
    inputs: {
      seed: 265369671560568,
      steps: 28,
      cfg: 5,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 0.4,
      model: ['10', 0],
      positive: ['28', 2],
      negative: ['28', 3],
      latent_image: ['14', 0]
    },
    class_type: 'KSampler',
    _meta: {
      title: 'KSampler'
    }
  },
  '18': {
    inputs: {
      samples: ['8', 0],
      vae: ['10', 2]
    },
    class_type: 'VAEDecode',
    _meta: {
      title: 'VAE Decode'
    }
  },
  '20': {
    inputs: {
      model_name: 'bbox/face_yolov8m.pt'
    },
    class_type: 'UltralyticsDetectorProvider',
    _meta: {
      title: 'UltralyticsDetectorProvider'
    }
  },
  '22': {
    inputs: {
      guide_size: 512,
      guide_size_for: true,
      max_size: 1536,
      seed: 781342677367830,
      steps: 15,
      cfg: 4.5,
      sampler_name: 'euler_ancestral',
      scheduler: 'karras',
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
      image: ['15', 0],
      model: ['28', 0],
      clip: ['28', 1],
      vae: ['10', 2],
      positive: ['28', 2],
      negative: ['28', 3],
      bbox_detector: ['20', 0],
      sam_model_opt: ['6', 0],
      segm_detector_opt: ['29', 1]
    },
    class_type: 'FaceDetailer',
    _meta: {
      title: 'FaceDetailer2'
    }
  },
  '28': {
    inputs: {
      wildcard_text: '',
      populated_text: '',
      mode: false,
      'Select to add LoRA': 'Select the LoRA to add to the text',
      'Select to add Wildcard': 'Select the Wildcard to add to the text',
      width: 832,
      height: 1216,
      seed: 566998447548836,
      overall: true,
      model: ['10', 0],
      clip: ['10', 1],
      negative: ['12', 0]
    },
    class_type: 'WildcardDivide',
    _meta: {
      title: 'Wildcard Divide'
    }
  },
  '29': {
    inputs: {
      model_name: 'segm/face_yolov8m-seg_60.pt'
    },
    class_type: 'UltralyticsDetectorProvider',
    _meta: {
      title: 'UltralyticsDetectorProvider'
    }
  }
}
