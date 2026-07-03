/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

// ============================================================================
// Pipeline Entry Points Example
// ============================================================================
// This WGSL module showcases how vertex, fragment, and compute shaders
// are declared, annotated, and connected in WebGPU.
// ============================================================================

// The graphics visualizer supplies the current frame number inside a uniform buffer
// at bind group 0, binding 0. This is used to drive animations.
@group(0) @binding(0) var<uniform> frame: u32;

// Custom structure to pass data from the Vertex stage to the Fragment stage.
struct VertexOutput {
    // Required output for any vertex shader. Instructs the rasterizer
    // where to place the transformed vertex in clip-space.
    @builtin(position) position: vec4f,

    // Custom user attribute passed to the fragment shader.
    // The rasterizer will automatically interpolate this value across the
    // surface of the triangle before delivering it to the fragment shader.
    @location(0) color: vec4f,
}

// ----------------------------------------------------------------------------
// 1. VERTEX SHADER
// ----------------------------------------------------------------------------
// Annotated with @vertex to declare it as the vertex pipeline entry point.
// Named 'vtx_main' to match the graphics visualizer pipeline targets.
@vertex
fn vtx_main(@builtin(vertex_index) vertex_id: u32) -> VertexOutput {
    // Define a hardcoded set of 2D coordinates for a simple triangle.
    const positions = array<vec2f, 3>(
        vec2f(0.0, 0.5),    // Top vertex
        vec2f(-0.5, -0.5),  // Bottom-left vertex
        vec2f(0.5, -0.5)    // Bottom-right vertex
    );

    // Define base color values for each vertex.
    const colors = array<vec4f, 3>(
        vec4f(1.0, 0.0, 0.0, 1.0), // Red
        vec4f(0.0, 1.0, 0.0, 1.0), // Green
        vec4f(0.0, 0.0, 1.0, 1.0)  // Blue
    );

    var output: VertexOutput;
    // Map 2D position to 4D clip-space coordinates: (x, y, z, w)
    output.position = vec4f(positions[vertex_id], 0.0, 1.0);
    
    // Assign the vertex-specific color
    output.color = colors[vertex_id];
    
    return output;
}

// ----------------------------------------------------------------------------
// 2. FRAGMENT SHADER
// ----------------------------------------------------------------------------
// Annotated with @fragment to declare it as the fragment entry point.
// Named 'frag_main' to match the graphics visualizer pipeline targets.
@fragment
fn frag_main(input: VertexOutput) -> @location(0) vec4f {
    // Use the frame uniform to slowly animate the intensity of the colors
    let pulse = sin(f32(frame) * 0.02) * 0.2 + 0.8;
    
    // The input.color parameter has been automatically blended (interpolated)
    // based on the pixel's relative distance from each vertex.
    return vec4f(input.color.rgb * pulse, 1.0);
}

// ----------------------------------------------------------------------------
// 3. COMPUTE SHADER
// ----------------------------------------------------------------------------
// Demonstrates workgroup shared memory which doesn't require external bindings,
// ensuring zero validation conflicts with the graphics visualizer pipeline.
var<workgroup> shared_data: array<f32, 64>;

// Annotated with @compute to define a general-purpose calculation entry point.
// Every compute entry point MUST specify a multi-dimensional @workgroup_size.
@compute @workgroup_size(64, 1, 1)
fn cs_main(
    // Access the local execution index (0 to 63) of the thread within its workgroup
    @builtin(local_invocation_index) local_id: u32,
    
    // Access the global thread index across the entire grid dispatch
    @builtin(global_invocation_id) global_id: vec3u
) {
    // Each thread writes a computed value to its corresponding index in shared memory
    shared_data[local_id] = f32(global_id.x) * 1.5;
    
    // Synchronize all threads within this workgroup to ensure all writes complete
    workgroupBarrier();
    
    // We can now safely read from other threads' written locations without race conditions
    let neighbor_val = shared_data[(local_id + 1u) % 64u];
}
