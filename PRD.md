# Extract Prompts

A powerful command-line tool for extracting ComfyUI workflow data and generation parameters from images and videos.

## Overview

Extract Prompts is designed to help AI artists, researchers, and enthusiasts retrieve the generation parameters and workflow information embedded in images and videos created with ComfyUI and other AI generation tools like Automatic1111.

## Features

### Supported Formats

#### Image Formats
- **PNG**: Extracts from tEXt chunks and EXIF data
- **JPEG/JPG**: Extracts from EXIF metadata fields
- **WebP**: Extracts from EXIF data using Sharp library

#### Video Formats
- **MP4**: Extracts from format and stream metadata
- **WebM**: Extracts from metadata tags
- **MOV**: Extracts from QuickTime metadata

### Data Types Extracted

#### ComfyUI Workflows
- Complete workflow JSON structures
- Node information and connections
- Model and LoRA configurations
- Generation parameters

#### Automatic1111 (A1111) Parameters
- Positive and negative prompts
- Generation settings (steps, CFG scale, sampler)
- Model information
- Seed values

## Installation

```bash
npm install -g extract-prompts
```

## Usage

### Basic Usage

```bash
# Extract from a single file
extract-prompts image.png

# Extract from multiple files
extract-prompts *.png *.jpg

# Extract from a directory
extract-prompts "images/**/*.{png,jpg,webp}"
```

### Output Formats

```bash
# JSON format (default)
extract-prompts image.png --output json

# Human-readable format
extract-prompts image.png --output pretty

# Raw workflow data
extract-prompts image.png --output raw
```

### Examples

#### Extract ComfyUI Workflow

```bash
$ extract-prompts comfyui_generated.png --output pretty

=== comfyui_generated.png ===
ComfyUI Workflow:

LoRA Models:
  1. character_lora.safetensors (strength: 0.8)
  2. style_lora.safetensors (strength: 0.6)

Prompts:
  Positive 1: beautiful anime character, detailed face, high quality
  Negative 1: blurry, low quality, deformed

Sampler Settings:
  Steps: 30
  CFG Scale: 7.5
  Scheduler: karras
  Seed: 1234567890

Models:
  1. animagine-xl-3.1.safetensors

Workflow Stats:
  Total Nodes: 15
  Node Types: LoadImage, CLIPTextEncode, KSampler, VAEDecode...
```

#### Extract A1111 Parameters

```bash
$ extract-prompts a1111_image.png --output pretty

=== a1111_image.png ===
A1111-style Parameters:

Prompts:
  Positive: masterpiece, detailed portrait, photorealistic
  Negative: blurry, low quality, artifacts

Generation Settings:
  Steps: 20
  CFG Scale: 7.0
  Sampler: DPM++ 2M Karras
  Seed: 9876543210
  Model: realisticVision_v40.safetensors
```

## API Usage

You can also use Extract Prompts as a library in your Node.js projects:

```typescript
import { extractFromImage, extractFromVideo, formatOutput } from 'extract-prompts';

// Extract from an image
const imageData = await extractFromImage('./my-image.png');
if (imageData?.workflow) {
  console.log('Found ComfyUI workflow:', imageData.workflow);
}

// Extract from a video
const videoData = await extractFromVideo('./my-video.mp4');
if (videoData?.workflow) {
  console.log('Found workflow in video metadata');
}

// Format results
const results = [{ file: 'image.png', ...imageData }];
const prettyOutput = formatOutput(results, 'pretty');
console.log(prettyOutput);
```

## Technical Details

### PNG Extraction
- Directly reads tEXt chunks from PNG files
- Searches for ComfyUI-specific keywords: `workflow`, `prompt`, `parameters`
- Falls back to Sharp library for EXIF data

### JPEG/WebP Extraction
- Uses `exifr` library for comprehensive EXIF data extraction
- Handles UTF-16 encoded UserComment fields
- Supports multiple EXIF fields where metadata might be stored

### Video Extraction
- Uses `ffprobe` to extract metadata from video containers
- Searches both format-level and stream-level metadata
- Supports JSON workflow data embedded in video metadata

## Error Handling

The tool includes comprehensive error handling with specific error types:

- `UnsupportedFormatError`: File format not supported
- `FileAccessError`: File cannot be read
- `ExifError`: EXIF data extraction failed
- `ValidationError`: Workflow data validation failed

## Contributing

Contributions are welcome! Please read the contributing guidelines and ensure all tests pass before submitting a pull request.

## License

MIT License - see LICENSE file for details.
