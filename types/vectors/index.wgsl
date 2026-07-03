/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

// Demonstrates that vec2<f32> is fully equivalent to its short-hand alias vec2f.
fn a(v : vec2<f32>) {}

fn b(v : vec2f) {
    a(v); // No conversion needed: vec2<f32> and vec2f are identical types
}

// Computes and returns a 2-element vector of 32-bit floating point values (f32)
fn test_vec2f() -> vec2f {
    // vec2f is initialized with components (x = 1.5, y = 2.5)
    let my_vector: vec2f = vec2f(1.5, 2.5);
    b(my_vector);
    return my_vector;
}

// Computes and returns a 3-element vector of unsigned 32-bit integers (u32)
fn test_vec3u() -> vec3u {
    // vec3u is initialized with components (x = 10, y = 20, z = 30)
    return vec3u(10u, 20u, 30u);
}

// Computes and returns a 4-element vector of signed 32-bit integers (i32)
fn test_vec4i() -> vec4i {
    // vec4i is initialized with components (x = -1, y = 0, z = 1, w = 2)
    return vec4i(-1, 0, 1, 2);
}


