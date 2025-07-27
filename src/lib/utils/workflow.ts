// ComfyUI workflow configuration and constants

export const FINAL_SAVE_NODE_ID = 'final_save_output' // Consistent ID for our dynamically added save node

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
  '84': {
    inputs: {
      lora_name: 'MoriiMee_Gothic_Niji_Style_Illustrious_r1.safetensors',
      strength_model: 0.5,
      strength_clip: 0.5,
      model: ['11', 0],
      clip: ['11', 1]
    },
    class_type: 'LoraLoader',
    _meta: {
      title: 'Load LoRA'
    }
  },
  '85': {
    inputs: {
      lora_name: 'Niji_anime_illustrious.safetensors',
      strength_model: 0.8,
      strength_clip: 0.8,
      model: ['84', 0],
      clip: ['84', 1]
    },
    class_type: 'LoraLoader',
    _meta: {
      title: 'Load LoRA'
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
