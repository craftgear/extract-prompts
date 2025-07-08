import { describe, it, expect } from 'vitest';
import { formatOutput } from './output';

describe('formatOutput', () => {
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

  it('should format as JSON by default', () => {
    const output = formatOutput(sampleResults, 'json');
    expect(output).toBe(JSON.stringify(sampleResults, null, 2));
  });

  it('should format as JSON when format is json', () => {
    const output = formatOutput(sampleResults, 'json');
    expect(output).toBe(JSON.stringify(sampleResults, null, 2));
  });

  it('should format as pretty output', () => {
    const output = formatOutput(sampleResults, 'pretty');
    
    expect(output).toContain('=== test1.png ===');
    expect(output).toContain('=== test2.png ===');
    expect(output).toContain('ComfyUI Workflow:');
    expect(output).toContain('Total Nodes: 2');
    expect(output).toContain('Total Nodes: 1');
    expect(output).toContain('CheckpointLoaderSimple');
    expect(output).toContain('CLIPTextEncode');
    expect(output).toContain('KSampler');
  });


  it('should handle results without workflow', () => {
    const resultsNoWorkflow = [
      {
        file: 'test.png'
      }
    ];
    
    const prettyOutput = formatOutput(resultsNoWorkflow, 'pretty');
    expect(prettyOutput).toContain('No workflow found');
    
  });

  it('should handle empty results', () => {
    const emptyResults: any[] = [];
    
    const jsonOutput = formatOutput(emptyResults, 'json');
    expect(jsonOutput).toBe('[]');
    
    const prettyOutput = formatOutput(emptyResults, 'pretty');
    expect(prettyOutput).toBe('');
    
  });

  it('should default to json for unknown format', () => {
    const output = formatOutput(sampleResults, 'unknown' as any);
    expect(output).toBe(JSON.stringify(sampleResults, null, 2));
  });

  it('should show workflow info in pretty format', () => {
    const output = formatOutput(sampleResults, 'pretty');
    
    // Check for workflow analysis
    expect(output).toContain('ComfyUI Workflow:');
    expect(output).toContain('Workflow Stats:');
    expect(output).toContain('Node Types:');
  });

  it('should show node examples in pretty format', () => {
    const output = formatOutput(sampleResults, 'pretty');
    
    // Should show node types in the workflow stats
    expect(output).toContain('CheckpointLoaderSimple, CLIPTextEncode');
    expect(output).toContain('KSampler');
    expect(output).toContain('Node Types:');
  });
});