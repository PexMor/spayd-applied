/**
 * Compose a symbol (VS, SS, or KS) from prefix and suffix with zero-padding
 * IMPORTANT: VS, SS, KS must be NUMERIC ONLY for SPAYD/QR codes
 * 
 * @param prefix Numeric prefix from event configuration (must be digits only)
 * @param suffix Numeric suffix from people data (digits only)
 * @param suffixLength Length for zero-padding the suffix (0 = no padding, use value as-is)
 * @param fallbackSuffix Fallback suffix if suffix is not provided (e.g., row index)
 * @returns Composed symbol as numeric string (digits only)
 * 
 * Examples:
 *   composeSymbol("2025", "123", 6, 0) => "2025000123" (10 digits total, padded)
 *   composeSymbol("", "45", 6, 0) => "000045" (6 digits, padded)
 *   composeSymbol("12", "", 4, 10) => "120010" (6 digits total, padded)
 *   composeSymbol("03", "08", 0, 0) => "0308" (no padding, value as-is)
 * 
 * Constraints:
 *   - VS: max 10 digits total
 *   - SS: max 10 digits total
 *   - KS: exactly 4 digits total
 */
export function composeSymbol(
    prefix: string,
    suffix: string | number,
    suffixLength: number,
    fallbackSuffix: string | number
): string {
    // Ensure prefix is numeric only (remove any non-digits)
    const numericPrefix = String(prefix).replace(/\D/g, '');
    
    // Use suffix if provided, otherwise use fallback
    const effectiveSuffix = suffix || fallbackSuffix;
    
    // Ensure suffix is numeric only and convert to string
    const numericSuffix = String(effectiveSuffix).replace(/\D/g, '');
    
    // Special case: suffixLength = 0 means "no padding, use value as-is"
    if (suffixLength === 0) {
        return `${numericPrefix}${numericSuffix}`;
    }
    
    // VALIDATION: Check if suffix value is longer than configured length
    if (numericSuffix.length > suffixLength) {
        const errorMsg = `⚠️ ERROR: Suffix value "${numericSuffix}" (${numericSuffix.length} digits) is longer than configured suffix length (${suffixLength} digits). ` +
            `Increase suffix length or use shorter values. Truncating to fit.`;
        console.error(errorMsg);
        // Truncate to fit, but this is data loss!
        const truncated = numericSuffix.substring(numericSuffix.length - suffixLength);
        return `${numericPrefix}${truncated}`;
    }
    
    // Pad suffix with zeros to specified length
    const paddedSuffix = numericSuffix.padStart(suffixLength, '0');
    
    // Combine prefix and suffix (all numeric)
    return `${numericPrefix}${paddedSuffix}`;
}

/**
 * Convert composed symbol string to number for SPAYD/QR code
 * @param symbolStr Composed symbol string
 * @returns Number representation, or 0 if invalid
 * 
 * Note: SPAYD requires numeric symbols. If prefix contains non-numeric characters,
 * this will try to convert what it can, or return 0.
 */
export function symbolToNumber(symbolStr: string): number {
    const num = parseInt(symbolStr, 10);
    return isNaN(num) ? 0 : num;
}

/**
 * Validate if a symbol string can be converted to a valid number
 * @param symbolStr Symbol string
 * @returns true if valid, false otherwise
 */
export function isValidNumericSymbol(symbolStr: string): boolean {
    return /^\d+$/.test(symbolStr);
}

/**
 * Compose VS (Variable Symbol) from event config and people data
 * VS must be max 10 digits total (prefix + suffix)
 * 
 * @param eventVsPrefix Numeric prefix (e.g., "2025", "99")
 * @param eventVsSuffixLength Length for suffix padding (configured once at event level)
 * @param personVsSuffix Suffix from CSV (optional, can be empty)
 * @param rowIndex Row index for auto-generation (0-based)
 * @param splitVsPrefix Optional prefix override from split (replaces event prefix)
 * @returns Composed VS (max 10 digits)
 */
export function composeVS(
    eventVsPrefix: string,
    eventVsSuffixLength: number,
    personVsSuffix: string | number,
    rowIndex: number,
    splitVsPrefix?: string
): string {
    // Split can override the prefix, but suffix length comes from event
    const prefix = splitVsPrefix !== undefined ? splitVsPrefix : eventVsPrefix;
    const suffixLength = eventVsSuffixLength; // Always from event, not overridable per split
    const fallback = rowIndex + 1; // 1-based index as fallback
    
    const composed = composeSymbol(prefix, personVsSuffix, suffixLength, fallback);
    
    // Ensure VS is max 10 digits
    if (composed.length > 10) {
        console.warn(`VS too long (${composed.length} digits), truncating to 10: ${composed}`);
        return composed.substring(0, 10);
    }
    
    return composed;
}

/**
 * Compose SS (Specific Symbol) from event config and people data
 * SS must be max 10 digits total (prefix + suffix)
 * 
 * @param eventSsPrefix Numeric prefix (optional)
 * @param eventSsSuffixLength Length for suffix padding (configured once at event level)
 * @param personSsSuffix Suffix from CSV (optional)
 * @param _rowIndex Row index (not used for SS, no auto-generation)
 * @param splitSsPrefix Optional prefix override from split (replaces event prefix)
 * @returns Composed SS (max 10 digits) or undefined if not configured
 */
export function composeSS(
    eventSsPrefix: string | undefined,
    eventSsSuffixLength: number | undefined,
    personSsSuffix: string | number,
    _rowIndex: number,  // Prefix with _ to indicate intentionally unused
    splitSsPrefix?: string
): string | undefined {
    // If no SS configuration at all, return undefined
    if (eventSsPrefix === undefined && splitSsPrefix === undefined) {
        return undefined;
    }
    
    // If person has no SS and we have no prefix, skip it
    if (!personSsSuffix && !eventSsPrefix && !splitSsPrefix) {
        return undefined;
    }
    
    // Split can override the prefix, but suffix length comes from event
    const prefix = splitSsPrefix !== undefined ? splitSsPrefix : (eventSsPrefix || '');
    const suffixLength = eventSsSuffixLength || 6; // Always from event
    const fallback = ''; // No auto-generation for SS
    
    const composed = composeSymbol(prefix, personSsSuffix, suffixLength, fallback);
    
    if (!composed || composed === '000000' || composed === '0000000000') {
        return undefined; // Don't include if empty or all zeros
    }
    
    // Ensure SS is max 10 digits
    if (composed.length > 10) {
        console.warn(`SS too long (${composed.length} digits), truncating to 10: ${composed}`);
        return composed.substring(0, 10);
    }
    
    return composed;
}

/**
 * Compose KS (Constant Symbol) from event config and people data
 * KS must be exactly 4 digits (standard in Czech banking)
 * 
 * @param eventKsPrefix Numeric prefix (optional)
 * @param eventKsSuffixLength Length for suffix padding (configured once at event level, typically 4 or 0)
 * @param personKsSuffix KS from CSV (typically the full 4-digit code)
 * @param _rowIndex Row index (not used for KS, no auto-generation)
 * @param splitKsPrefix Optional prefix override from split (replaces event prefix)
 * @returns Composed KS (4 digits) or undefined if not configured
 */
export function composeKS(
    eventKsPrefix: string | undefined,
    eventKsSuffixLength: number | undefined,
    personKsSuffix: string | number,
    _rowIndex: number,  // Prefix with _ to indicate intentionally unused
    splitKsPrefix?: string
): string | undefined {
    // If no KS configuration at all, return undefined
    if (eventKsPrefix === undefined && splitKsPrefix === undefined && !personKsSuffix) {
        return undefined;
    }
    
    // Split can override the prefix, but suffix length comes from event
    const prefix = splitKsPrefix !== undefined ? splitKsPrefix : (eventKsPrefix || '');
    const suffixLength = eventKsSuffixLength || 4; // Always from event
    const fallback = ''; // No auto-generation for KS
    
    const composed = composeSymbol(prefix, personKsSuffix, suffixLength, fallback);
    
    if (!composed || composed === '0000') {
        return undefined; // Don't include if empty or all zeros
    }
    
    // KS should be exactly 4 digits - pad or truncate
    if (composed.length < 4) {
        return composed.padStart(4, '0');
    } else if (composed.length > 4) {
        console.warn(`KS too long (${composed.length} digits), truncating to 4: ${composed}`);
        return composed.substring(0, 4);
    }
    
    return composed;
}

