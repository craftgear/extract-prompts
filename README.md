# extract-prompts

Extract ComfyUI workflow JSON and A1111 prompts from images and videos.

## Installation

```bash
npm install -g extract-prompts
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
extract-prompts *.png --output pretty

# Save extracted workflows to directory
extract-prompts *.png --save ./workflows

# Quiet mode (suppress non-error output)
extract-prompts *.png --quiet
```

## Options

- `-o, --output <format>`: Output format (json|pretty|raw) [default: json]
- `-s, --save <directory>`: Save workflows to directory
- `-q, --quiet`: Suppress non-error output
- `--overwrite`: Overwrite existing files when saving
- `--name-pattern <pattern>`: File naming pattern (source|sequential|timestamp) [default: source]
- `--organize <mode>`: Organize saved files (none|format|date) [default: none]

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

### Pretty
Human-readable format showing:
- LoRA models and strengths
- Prompts (positive/negative when detected)
- Sampler settings (steps, CFG, scheduler, seed)
- Model information
- Workflow statistics

### Raw
Simplified format with just the workflow JSON.

## Features

- **ComfyUI Workflow Extraction**: Extracts complete workflow JSON from ComfyUI-generated content
- **Prompt Detection**: Intelligently identifies and extracts prompts from various node types
- **LoRA Support**: Extracts LoRA models and their strengths from multiple loader formats
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
extract-prompts workflow.webm --output pretty
```

### Save workflows organized by date
```bash
extract-prompts *.png --save ./extracted --organize date
```

## License

MIT
