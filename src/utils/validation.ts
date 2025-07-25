/**
 * ComfyUI workflow validation utilities
 * 
 * This module provides comprehensive validation functions for ComfyUI workflows,
 * A1111 parameters, and general metadata structures.
 * 
 * @fileoverview Validation utilities for ComfyUI workflow data
 */

import { ValidationError } from '../errors/index';
import { defaultLogger } from './logger';
import { WorkflowInfo } from '../types';

/**
 * Validates ComfyUI workflow structure
 * 
 * Checks if the provided data represents a valid ComfyUI workflow by examining
 * the structure for numeric node keys, class_type properties, and other patterns.
 * 
 * @param data - Data to validate
 * @param strict - Whether to use strict validation mode
 * @returns True if the data represents a valid workflow
 * 
 * @example
 * ```typescript
 * const workflow = { "1": { class_type: "LoadImage", inputs: {} } };
 * if (validateComfyUIWorkflow(workflow)) {
 *   console.log('Valid ComfyUI workflow detected');
 * }
 * ```
 */
export function validateComfyUIWorkflow(data: any, strict: boolean = false): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  try {
    // Basic ComfyUI workflow structure validation
    // ComfyUI workflows typically have node structure with numbered keys
    const keys = Object.keys(data);
    
    // Check if it has numeric keys (typical of ComfyUI workflows)
    const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
    
    if (hasNumericKeys) {
      // Check if nodes have typical ComfyUI structure
      let validNodeCount = 0;
      for (const key of keys) {
        if (/^\d+$/.test(key)) {
          const node = data[key];
          if (node && typeof node === 'object') {
            // ComfyUI nodes typically have class_type and inputs
            if (node.class_type && typeof node.class_type === 'string') {
              validNodeCount++;
            }
          }
        }
      }
      
      // In strict mode, require at least one valid node
      if (strict && validNodeCount === 0) {
        return false;
      }
      
      return validNodeCount > 0;
    }
    
    // Check for UI format workflow (has nodes array)
    if (data.nodes && Array.isArray(data.nodes)) {
      // Validate that nodes have the typical UI format structure
      const validUINodes = data.nodes.filter((node: any) => 
        node && typeof node === 'object' && 
        typeof node.id !== 'undefined' &&
        node.type && typeof node.type === 'string'
      );
      
      // Require at least one valid node for UI format
      if (validUINodes.length > 0) {
        return true;
      }
    }
    
    // Check for other ComfyUI-specific patterns
    if (data.workflow || data.prompt || data.extra_pnginfo) {
      return true;
    }
    
    // Check for node-based structure with class_type (legacy arrays)
    if (Array.isArray(data)) {
      return data.some(item => 
        item && typeof item === 'object' && 
        item.class_type && typeof item.class_type === 'string'
      );
    }
    
    return false;
  } catch (error) {
    defaultLogger.debug('Validation error', { error, data: typeof data }, undefined);
    return false;
  }
}

/**
 * Extracts detailed information from a ComfyUI workflow
 * 
 * Analyzes the workflow structure to extract node counts, types,
 * and presence of common components like prompts and models.
 * 
 * @param workflow - Workflow data to analyze
 * @returns Object containing workflow statistics and information
 * 
 * @example
 * ```typescript
 * const info = extractWorkflowInfo(workflow);
 * console.log(`Workflow has ${info.nodeCount} nodes of types: ${info.nodeTypes.join(', ')}`);
 * ```
 */
export function extractWorkflowInfo(workflow: any): WorkflowInfo {
  const info = {
    nodeCount: 0,
    nodeTypes: new Set<string>(),
    hasPrompt: false,
    hasModel: false
  };
  
  if (!workflow || typeof workflow !== 'object') {
    return {
      ...info,
      nodeTypes: Array.from(info.nodeTypes)
    };
  }
  
  // Handle both UI format (has nodes array) and API format (numeric keys)
  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    // UI format workflow
    info.nodeCount = workflow.nodes.length;
    
    for (const node of workflow.nodes) {
      if (node && typeof node === 'object' && node.type) {
        info.nodeTypes.add(node.type);
        
        // Check for common node types  
        if (node.type.toLowerCase().includes('prompt') || node.type.toLowerCase().includes('text')) {
          info.hasPrompt = true;
        }
        if (node.type.toLowerCase().includes('model') || 
            node.type.toLowerCase().includes('checkpoint')) {
          info.hasModel = true;
        }
      }
    }
  } else {
    // API format workflow - count nodes with numeric keys
    for (const [key, node] of Object.entries(workflow)) {
      if (/^\d+$/.test(key) && node && typeof node === 'object') {
        const nodeData = node as any;
        info.nodeCount++;
        
        if (nodeData.class_type) {
          info.nodeTypes.add(nodeData.class_type);
          
          // Check for common node types
          if (nodeData.class_type.toLowerCase().includes('prompt')) {
            info.hasPrompt = true;
          }
          if (nodeData.class_type.toLowerCase().includes('model') || 
              nodeData.class_type.toLowerCase().includes('checkpoint')) {
            info.hasModel = true;
          }
        }
      }
    }
  }
  
  return {
    nodeCount: info.nodeCount,
    nodeTypes: Array.from(info.nodeTypes),
    hasPrompt: info.hasPrompt,
    hasModel: info.hasModel
  };
}

/**
 * Strict workflow validation that throws errors
 * 
 * Performs comprehensive validation and throws detailed ValidationError
 * if the data doesn't meet ComfyUI workflow requirements.
 * 
 * @param data - Data to validate
 * @param context - Optional context for error reporting
 * @throws {ValidationError} When validation fails with detailed error information
 * 
 * @example
 * ```typescript
 * try {
 *   validateWorkflowStrict(suspiciousData);
 *   console.log('Workflow is valid');
 * } catch (error) {
 *   console.error('Validation failed:', error.message);
 * }
 * ```
 */
export function validateWorkflowStrict(data: any, context?: string): void {
  if (!data || typeof data !== 'object') {
    throw new ValidationError(
      'Invalid workflow data: must be an object',
      'workflow_structure',
      { dataType: typeof data, context }
    );
  }
  
  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new ValidationError(
      'Invalid workflow data: empty object',
      'workflow_structure',
      { context }
    );
  }
  
  const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
  if (!hasNumericKeys && !data.workflow && !data.prompt && !data.extra_pnginfo) {
    throw new ValidationError(
      'Invalid workflow data: no ComfyUI structure found',
      'workflow_structure',
      { keys: keys.slice(0, 5), context } // Only include first 5 keys
    );
  }
  
  // Validate node structure
  if (hasNumericKeys) {
    let validNodeCount = 0;
    for (const key of keys) {
      if (/^\d+$/.test(key)) {
        const node = data[key];
        if (node && typeof node === 'object' && node.class_type) {
          validNodeCount++;
        }
      }
    }
    
    if (validNodeCount === 0) {
      throw new ValidationError(
        'Invalid workflow data: no valid ComfyUI nodes found',
        'workflow_nodes',
        { nodeCount: keys.filter(k => /^\d+$/.test(k)).length, context }
      );
    }
  }
}

/**
 * Validates Automatic1111 (A1111) parameters
 * 
 * Checks if the data contains valid A1111-style generation parameters
 * commonly found in images generated by Stable Diffusion WebUI.
 * 
 * @param data - Data to validate
 * @returns True if the data contains valid A1111 parameters
 * 
 * @example
 * ```typescript
 * const params = { positive_prompt: 'cat', steps: 20, cfg: 7.0 };
 * if (validateA1111Parameters(params)) {
 *   console.log('Valid A1111 parameters');
 * }
 * ```
 */
export function validateA1111Parameters(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check for common A1111 parameter fields
  const requiredFields = ['positive_prompt', 'negative_prompt', 'steps', 'cfg'];
  const hasRequiredFields = requiredFields.some(field => field in data);
  
  return hasRequiredFields;
}

/**
 * General metadata validation
 * 
 * Validates that the provided data represents valid metadata that can be
 * processed by the extraction system.
 * 
 * @param data - Data to validate
 * @returns True if the data represents valid metadata
 * 
 * @example
 * ```typescript
 * if (validateMetadata(extractedData)) {
 *   console.log('Valid metadata found');
 * }
 * ```
 */
export function validateMetadata(data: any): boolean {
  if (!data) {
    return false;
  }
  
  // Must be a string, object, or array
  const validTypes = ['string', 'object'];
  return validTypes.includes(typeof data);
}