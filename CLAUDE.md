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

The application follows a modular component architecture:

- **ImageGenerator.svelte**: Main orchestrating component that integrates all child components with 1:3 grid layout
- **PromptForm.svelte**: Manages all prompt input forms and model settings (checkpoints, upscale, face detailer)
- **ImageViewer.svelte**: Handles image display, navigation controls, and metadata loading with automatic prompt restoration
- **GenerationControls.svelte**: Contains generation button, progress tracking, and settings dialog
- **TextAreaInput.svelte**: Reusable input component with autocomplete suggestions, select dropdown, textarea, and integrated category controls (drag handle, delete button)
- **SettingsDialog.svelte**: Modal for configuring generation parameters

### Utility Modules

- **imageGeneration.ts**: Extracted image generation logic and ComfyUI workflow management
- **comfyui.ts**: WebSocket communication and API interaction utilities
- **fileIO.ts**: File system operations for saving/loading prompts and images
- **types.ts**: Centralized TypeScript type definitions

### API Routes

- **`/api/prompts`**: Handles saving and loading prompt data to/from `data/prompts.json`
- **`/api/settings`**: Handles saving and loading user settings to/from `data/settings.json`
- **`/api/image`**: Serves generated images from the output directory
- **`/api/image-list`**: Returns list of generated images in the output directory
- **`/api/tags`**: Provides autocomplete tags for prompt suggestions

### ComfyUI Integration

The application connects to a local ComfyUI instance at `http://127.0.0.1:8188` and uses:
- REST API for submitting workflows and fetching available checkpoints
- WebSocket connection for real-time progress updates and image delivery
- Dynamic workflow configuration based on user settings (upscale, face detailer, checkpoint selection)
- Automatic node injection for SaveImageWebsocket based on selected options

### Data Management

- **Prompt Storage**: User inputs are saved to `data/prompts.json` with historical values for each category
- **Image Storage**: Generated images are saved to `data/output/` with timestamp-based filenames
- **Metadata Storage**: PNG images include embedded metadata with categorized prompts for automatic restoration
- **State Management**: Uses Svelte 5's `$state` and callback patterns to avoid prop mutation warnings

### UI/UX Features

- **Responsive Layout**: 1:3 grid ratio with form section and image section
- **Image Navigation**: Previous/next buttons with current position indicator (n / total)
- **Autocomplete**: Tag suggestions with keyboard navigation and fixed positioning to prevent clipping
- **Progress Tracking**: Real-time progress bar with optimized animation timing
- **Prompt History**: Automatic saving of new prompts to dropdown options on generation
- **Metadata Restoration**: Clicking through saved images automatically loads their generation prompts
- **Drag-and-Drop Reordering**: Categories can be reordered by dragging with visual feedback
- **Scrollable Form Sections**: Form sections with custom thin scrollbars and auto-growing textareas

### Key Features

- Multi-category prompt system with dynamic category management
- Real-time progress tracking during image generation
- Dynamic checkpoint selection from ComfyUI
- Optional upscaling and face detailing
- Automatic saving of generated images with metadata
- Prompt history management with automatic updates
- Image navigation with position tracking
- Transparent overlay navigation controls
- Settings persistence and validation
- Drag-and-drop category reordering with visual feedback
- Integrated category controls (drag handle and delete button within input components)
- Auto-growing textareas that resize based on content

## Component Communication

- Uses callback patterns instead of prop binding to avoid Svelte 5 warnings
- Parent-child communication through well-defined interfaces
- Component instance binding for exposing utility functions (e.g., `refreshFileList`)
- Event-driven updates for real-time progress and image delivery

## Important Notes

- The application requires a running ComfyUI instance with specific nodes (SaveImageWebsocket, FaceDetailer, etc.)
- The workflow structure dynamically configures nodes based on user settings
- WebSocket communication tracks the `final_save_output` node for image delivery
- All generated images are automatically saved with timestamp-based filenames and embedded metadata
- Component architecture follows separation of concerns with focused, reusable components
- Uses modern Svelte 5 patterns with `$state`, `$props`, and `$effect`
- **To avoid lint errors, don't use explicit `any` type** - use proper TypeScript types, `unknown`, or type assertions instead
- **Avoid optional parameters in `$props` types when possible** - prefer required props with default values or explicit handling over optional (`?`) parameters
- **Avoid optional function parameters when possible** - when adding parameters to existing functions, prefer making them required and updating all call sites rather than using optional (`?`) parameters
- **Always run type checking after completing tasks** - execute `npm run check` after finishing any task to ensure there are no TypeScript errors