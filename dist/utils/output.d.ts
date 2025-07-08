/**
 * Output formatting utilities for extracted workflow data
 *
 * This module provides functions to format extracted ComfyUI workflow data
 * into various output formats including JSON and human-readable formats.
 *
 * @fileoverview Output formatting and data presentation utilities
 */
import { ExtractedData, OutputFormat } from '../types';
/**
 * Formats extraction results into the specified output format
 *
 * @param results - Array of extracted data from files
 * @param format - Output format ('json' or 'pretty')
 * @returns Formatted string representation of the results
 *
 * @example
 * ```typescript
 * const results = [{ file: 'image.png', workflow: {...} }];
 * const output = formatOutput(results, 'pretty');
 * console.log(output);
 * ```
 */
export declare function formatOutput(results: ExtractedData[], format: OutputFormat): string;
//# sourceMappingURL=output.d.ts.map