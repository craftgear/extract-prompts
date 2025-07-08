# extract-prompts

a CLI tool to extract ComfyUI workflow JSON and A1111 prompts from images and videos.

## Installation

```bash
npm install -g @craftgear/extract-prompts
```

## Usage

```bash
extract-prompts <files...> [options]
```

### Examples

```bash
# Extract from a single image
extract-prompts image.png

# Extract from multiple files with glob patterns
extract-prompts *.png *.webm

# Pretty format output
extract-prompts *.png --pretty

# Save extracted workflows to directory
extract-prompts *.png --save ./workflows

# Save to directory with spaces (use quotes)
extract-prompts *.png --save "output directory with spaces"

# Save to input file directory (uses directory of first input file)
extract-prompts *.png --save

# Convert A1111 parameters to ComfyUI workflow format
extract-prompts a1111_image.png --convert-a1111

# Combine conversion with pretty output
extract-prompts a1111_image.png --convert-a1111 --pretty

# Quiet mode (suppress non-error output)
extract-prompts *.png --quiet
```

## Options

- `-p, --pretty`: Human-readable output format (default: JSON)
- `-s, --save [directory]`: Save workflows to directory (defaults to input directory if not specified)
- `-q, --quiet`: Suppress non-error output
- `--overwrite`: Overwrite existing files when saving
- `--name-pattern <pattern>`: File naming pattern (source|sequential|timestamp) [default: source]
- `--organize <mode>`: Organize saved files (none|format|date) [default: none]
- `--json-file`: Create JSON file with same name as input file
- `--convert-a1111`: Convert A1111 parameters to ComfyUI workflow format

## Supported Formats

### Images
- PNG
- JPEG/JPG
- WebP

### Videos
- MP4
- WebM
- MOV

## Output Formats

### JSON (default)
Raw JSON output with full workflow data.

### Pretty (--pretty flag)
Human-readable format showing:
- LoRA models and strengths
- Prompts (positive/negative when detected)
- Sampler settings (steps, CFG, scheduler, seed)
- Model information
- Workflow statistics

## Features

- **ComfyUI Workflow Extraction**: Extracts complete workflow JSON from ComfyUI-generated content
- **A1111 to ComfyUI Conversion**: Convert A1111 parameters to ComfyUI workflow format with full LoRA and upscaler support
- **Prompt Detection**: Intelligently identifies and extracts prompts from various node types
- **LoRA Support**: Extracts LoRA models and their strengths from multiple loader formats
- **Upscaler Support**: Handles hires.fix and upscaler parameters in conversions
- **Conservative Labeling**: Only shows positive/negative distinction when confident
- **Batch Processing**: Process multiple files at once with glob patterns
- **Flexible Output**: Multiple output formats for different use cases

## Supported Node Types

- CLIPTextEncode
- WanVideoTextEncode
- Text Multiline
- easy showAnything
- KSampler / WanVideoSampler
- Power Lora Loader (rgthree)
- LoraTagLoader
- Various model loaders

## Examples

### Basic extraction
```bash
extract-prompts generated_image.png
```

### Pretty format with LoRA and prompt details
```bash
extract-prompts workflow.webm --pretty
```

### Save workflows organized by date
```bash
extract-prompts *.png --save ./extracted --organize date
```

### Save to directory with spaces
```bash
# Use quotes for directory paths with spaces
extract-prompts *.png --save "My Output Directory"
extract-prompts *.png --save 'Output Folder With Spaces'
```

### A1111 to ComfyUI Conversion
```bash
# Convert A1111 parameters to ComfyUI workflow
extract-prompts a1111_image.png --convert-a1111

# Example with LoRA tags in A1111 prompt:
# "beautiful girl <lora:style1:0.8> <lora:character:0.6>, masterpiece"
# Will generate ComfyUI workflow with LoRA loader nodes

# Example with upscaler parameters:
# Hires.fix: true, Hires upscaler: ESRGAN_4x, Hires steps: 10, Hires denoising: 0.5
# Will generate ComfyUI workflow with upscaler nodes for 2-pass generation
```

## License

MIT
