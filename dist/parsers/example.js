#!/usr/bin/env node
"use strict";
/**
 * Example script demonstrating the A1111 parser functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const a1111_1 = require("./a1111");
// Example A1111 parameter strings
const examples = [
    {
        name: "Basic A1111 Parameters",
        data: `masterpiece, best quality, 1girl, solo, looking at viewer, blonde hair, blue eyes, white dress, garden background
Negative prompt: nsfw, ugly, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry
Steps: 28, Sampler: DPM++ 2M Karras, CFG scale: 7.5, Seed: 1234567890, Size: 512x768, Model: deliberate_v2, Denoising strength: 0.7, Clip skip: 2`
    },
    {
        name: "Extended Parameters with Hires Fix",
        data: `portrait of a woman, detailed, photorealistic
Negative prompt: cartoon, anime, 3d render, bad anatomy
Steps: 30, CFG scale: 8.0, Sampler: DPM++ SDE Karras, Seed: 987654321, Size: 768x1024, Model: realisticVision_v40, Hires upscale: 2, Hires upscaler: R-ESRGAN 4x+, Hires steps: 15, Hires denoising strength: 0.5, Restore faces`
    },
    {
        name: "Minimal Parameters",
        data: `simple landscape
Steps: 20, CFG scale: 7.0, Sampler: Euler a, Seed: 123456789`
    }
];
function main() {
    console.log('='.repeat(60));
    console.log('A1111 Parser Example');
    console.log('='.repeat(60));
    examples.forEach((example, index) => {
        console.log(`\n${index + 1}. ${example.name}`);
        console.log('-'.repeat(40));
        // Validate format
        const isValid = (0, a1111_1.validateA1111Format)(example.data);
        console.log(`Valid A1111 format: ${isValid}`);
        if (isValid) {
            // Parse parameters
            const params = (0, a1111_1.parseA1111Parameters)(example.data);
            console.log(`\nPositive prompt: "${params.positive_prompt}"`);
            if (params.negative_prompt) {
                console.log(`Negative prompt: "${params.negative_prompt}"`);
            }
            console.log('\nGeneration Settings:');
            if (params.steps)
                console.log(`  Steps: ${params.steps}`);
            if (params.cfg)
                console.log(`  CFG Scale: ${params.cfg}`);
            if (params.sampler)
                console.log(`  Sampler: ${params.sampler}`);
            if (params.seed)
                console.log(`  Seed: ${params.seed}`);
            if (params.size)
                console.log(`  Size: ${params.size}`);
            if (params.model)
                console.log(`  Model: ${params.model}`);
            if (params.denoise)
                console.log(`  Denoising: ${params.denoise}`);
            if (params.clip_skip)
                console.log(`  Clip Skip: ${params.clip_skip}`);
            if (params.hires_fix) {
                console.log('\nHires Fix Settings:');
                if (params.hires_upscaler)
                    console.log(`  Upscaler: ${params.hires_upscaler}`);
                if (params.hires_steps)
                    console.log(`  Steps: ${params.hires_steps}`);
                if (params.hires_denoising)
                    console.log(`  Denoising: ${params.hires_denoising}`);
            }
            if (params.restore_faces) {
                console.log('\nSpecial Features:');
                console.log('  Face Restoration: Enabled');
            }
            // Demonstrate individual functions
            console.log('\n--- Individual Function Results ---');
            const prompts = (0, a1111_1.separatePrompts)(example.data);
            console.log(`Prompt separation - Positive length: ${prompts.positive.length}, Negative length: ${prompts.negative.length}`);
            const settings = (0, a1111_1.extractGenerationSettings)(example.data);
            console.log(`Settings extracted: ${Object.keys(settings).length} parameters`);
        }
        else {
            console.log('Invalid A1111 format - skipping detailed parsing');
        }
    });
    console.log('\n' + '='.repeat(60));
    console.log('Example completed successfully!');
    console.log('='.repeat(60));
}
// Run the example if this file is executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=example.js.map