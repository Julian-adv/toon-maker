// ComfyUI workflow configuration and constants

export const FINAL_SAVE_NODE_ID = 'final_save_output' // Consistent ID for our dynamically added save node

export const defaultWorkflowPrompt = {
  '5': {
    inputs: {
      guide_size: 512,
      guide_size_for: true,
      max_size: 1024,
      seed: 836267740683999,
      steps: 20,
      cfg: 8,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 0.5,
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
      image: ['18', 0],
      model: ['10', 0],
      clip: ['10', 1],
      vae: ['10', 2],
      positive: ['11', 0],
      negative: ['12', 0],
      bbox_detector: ['20', 0],
      sam_model_opt: ['6', 0]
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
      model: ['10', 0],
      positive: ['11', 0],
      negative: ['12', 0],
      latent_image: ['9', 0]
    },
    class_type: 'KSampler',
    _meta: {
      title: 'KSampler'
    }
  },
  '9': {
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
  '10': {
    inputs: {
      ckpt_name: 'zenijiMixKIllust_v10.safetensors'
    },
    class_type: 'CheckpointLoaderSimple',
    _meta: {
      title: 'Load Checkpoint'
    }
  },
  '11': {
    inputs: {
      text: 'maid,christian louboutin high heels',
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
      scale_by: 2.0000000000000004,
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
      denoise: 0.4000000000000001,
      model: ['10', 0],
      positive: ['11', 0],
      negative: ['12', 0],
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
      max_size: 1024,
      seed: 781342677367830,
      steps: 20,
      cfg: 8,
      sampler_name: 'euler_ancestral',
      scheduler: 'simple',
      denoise: 0.5,
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
      model: ['10', 0],
      clip: ['10', 1],
      vae: ['10', 2],
      positive: ['11', 0],
      negative: ['12', 0],
      bbox_detector: ['20', 0],
      sam_model_opt: ['6', 0]
    },
    class_type: 'FaceDetailer',
    _meta: {
      title: 'FaceDetailer2'
    }
  }
}
