"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const output_1 = require("./output");
(0, vitest_1.describe)('formatOutput', () => {
    const sampleResults = [
        {
            file: 'test1.png',
            workflow: {
                '1': {
                    class_type: 'CheckpointLoaderSimple',
                    inputs: {}
                },
                '2': {
                    class_type: 'CLIPTextEncode',
                    inputs: {}
                }
            }
        },
        {
            file: 'test2.png',
            workflow: {
                '1': {
                    class_type: 'KSampler',
                    inputs: {}
                }
            }
        }
    ];
    (0, vitest_1.it)('should format as JSON by default', () => {
        const output = (0, output_1.formatOutput)(sampleResults, 'json');
        (0, vitest_1.expect)(output).toBe(JSON.stringify(sampleResults, null, 2));
    });
    (0, vitest_1.it)('should format as JSON when format is json', () => {
        const output = (0, output_1.formatOutput)(sampleResults, 'json');
        (0, vitest_1.expect)(output).toBe(JSON.stringify(sampleResults, null, 2));
    });
    (0, vitest_1.it)('should format as pretty output', () => {
        const output = (0, output_1.formatOutput)(sampleResults, 'pretty');
        (0, vitest_1.expect)(output).toContain('=== test1.png ===');
        (0, vitest_1.expect)(output).toContain('=== test2.png ===');
        (0, vitest_1.expect)(output).toContain('ComfyUI Workflow:');
        (0, vitest_1.expect)(output).toContain('Total Nodes: 2');
        (0, vitest_1.expect)(output).toContain('Total Nodes: 1');
        (0, vitest_1.expect)(output).toContain('CheckpointLoaderSimple');
        (0, vitest_1.expect)(output).toContain('CLIPTextEncode');
        (0, vitest_1.expect)(output).toContain('KSampler');
    });
    (0, vitest_1.it)('should handle results without workflow', () => {
        const resultsNoWorkflow = [
            {
                file: 'test.png'
            }
        ];
        const prettyOutput = (0, output_1.formatOutput)(resultsNoWorkflow, 'pretty');
        (0, vitest_1.expect)(prettyOutput).toContain('No workflow found');
    });
    (0, vitest_1.it)('should handle empty results', () => {
        const emptyResults = [];
        const jsonOutput = (0, output_1.formatOutput)(emptyResults, 'json');
        (0, vitest_1.expect)(jsonOutput).toBe('[]');
        const prettyOutput = (0, output_1.formatOutput)(emptyResults, 'pretty');
        (0, vitest_1.expect)(prettyOutput).toBe('');
    });
    (0, vitest_1.it)('should default to json for unknown format', () => {
        const output = (0, output_1.formatOutput)(sampleResults, 'unknown');
        (0, vitest_1.expect)(output).toBe(JSON.stringify(sampleResults, null, 2));
    });
    (0, vitest_1.it)('should show workflow info in pretty format', () => {
        const output = (0, output_1.formatOutput)(sampleResults, 'pretty');
        // Check for workflow analysis
        (0, vitest_1.expect)(output).toContain('ComfyUI Workflow:');
        (0, vitest_1.expect)(output).toContain('Workflow Stats:');
        (0, vitest_1.expect)(output).toContain('Node Types:');
    });
    (0, vitest_1.it)('should show node examples in pretty format', () => {
        const output = (0, output_1.formatOutput)(sampleResults, 'pretty');
        // Should show node types in the workflow stats
        (0, vitest_1.expect)(output).toContain('CheckpointLoaderSimple, CLIPTextEncode');
        (0, vitest_1.expect)(output).toContain('KSampler');
        (0, vitest_1.expect)(output).toContain('Node Types:');
    });
});
//# sourceMappingURL=output.test.js.map