# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Toon Maker is a SvelteKit-based web application that interfaces with ComfyUI for AI image generation. The application allows users to create character art by providing prompts across different categories (quality, character, outfit, pose, background) and generates images using a local ComfyUI instance.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Watch mode type checking
npm run check:watch

# Lint and format code
npm run lint
npm run format
```

## Architecture

### Core Components

- **PromptInput.svelte**: Main form component containing all user input fields, workflow orchestration, and WebSocket communication with ComfyUI
- **TextAreaInput.svelte**: Reusable input component with select dropdown and textarea for each prompt category
- **fileIO.ts**: Utility functions for saving/loading prompts and images via API routes

### API Routes

- **`/api/prompts`**: Handles saving and loading prompt data to/from `data/prompts.json`
- **`/api/save-image`**: Saves generated images to `data/output/` with timestamp-based filenames

### ComfyUI Integration

The application connects to a local ComfyUI instance at `http://127.0.0.1:8188` and uses:
- REST API for submitting workflows
- WebSocket connection for real-time progress updates and image delivery
- Dynamic workflow configuration based on user settings (upscale, face detailer, checkpoint selection)

### Data Management

- **Prompt Storage**: User inputs are saved to `data/prompts.json` with historical values for each category
- **Image Storage**: Generated images are saved to `data/output/` with timestamps
- **State Management**: Uses Svelte 5's `$state` for reactive local state

### Key Features

- Multi-category prompt system (quality, character, outfit, pose, background)
- Real-time progress tracking during image generation
- Dynamic checkpoint selection from ComfyUI
- Optional upscaling and face detailing
- Automatic saving of generated images
- Prompt history for each category

## Important Notes

- The application requires a running ComfyUI instance with specific nodes (SaveImageWebsocket, FaceDetailer, etc.)
- The hardcoded workflow structure assumes specific node IDs and connections
- WebSocket communication tracks the `final_save_output` node for image delivery
- All generated images are automatically saved with timestamp-based filenames