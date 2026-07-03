/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

// ============================================================================
// @must_use Attribute Example
// ============================================================================
// This example demonstrates how the @must_use attribute acts as a compiler-
// enforced guard to prevent developers from silently ignoring calculations.
// ============================================================================

// Pre-declaring a critical mathematical helper function.
// Prepending @must_use makes it a compile-time error to discard its return value.
@must_use
fn calculate_critical_factor(val: f32) -> f32 {
    // Perform a dummy safety-critical operation
    return val * 1.5 + 0.007;
}

// A standard helper function NOT marked with @must_use.
// Discarding its returned value is legally allowed, though discouraged if pure.
fn standard_calculation(val: f32) -> f32 {
    return val * 0.5;
}

fn test_calls() {
    // --- CASE 1: Valid Usage (Assignment) ---
    // The result of our @must_use function is stored in an immutable value.
    let factor = calculate_critical_factor(2.5);

    // --- CASE 2: Valid Usage (Control Flow) ---
    // The output is used as a direct evaluation parameter inside conditional flow.
    if (calculate_critical_factor(1.0) > 1.0) {
        // ...
    }

    // --- CASE 3: Valid Usage (Standard Return) ---
    // Since standard_calculation is NOT annotated as @must_use, we are
    // legally allowed to discard its result. This compiles perfectly:
    standard_calculation(4.2);

    // --- CASE 4: The Compile Error (Discarded Value) ---
    // UNCOMMENT THE LINE BELOW to see the WGSL compiler throw an error:
    // "statement has no effect; must_use value is discarded"
    //
    // calculate_critical_factor(2.5);
}
