/*
 * Copyright ©2026 Michael R. Bernstein. All new modifications licensed under Apache 2.0.
 * Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
 */

// vertex_count: 15

@binding(0) @group(0) var<uniform> frame : u32;

struct VertexOutput {
  @builtin(position) pos : vec4f,
  @location(0) color : vec3f,
  @location(1) uv : vec2f,
}

@vertex
fn vtx_main(@builtin(vertex_index) vertex_index : u32) -> VertexOutput {
  const pos = array(
    vec2f(-0.775189,  0.459474), // P1_A
    vec2f(-0.214846, -0.475223), // P1_B
    vec2f( 0.345474,  0.459474), // P1_C
    vec2f( 0.362880,  0.450034), // P2_A
    vec2f( 0.091383, -0.002834), // P2_B
    vec2f( 0.634377, -0.002834), // P2_C
    vec2f( 0.091383, -0.022354), // P3_A
    vec2f( 0.362880, -0.475223), // P3_B
    vec2f( 0.634377, -0.022354), // P3_C
    vec2f( 0.524640,  0.218560), // P4_A
    vec2f( 0.651717,  0.006587), // P4_B
    vec2f( 0.779154,  0.218560), // P4_C
    vec2f( 0.651703,  0.450057), // P5_A
    vec2f( 0.524617,  0.238075), // P5_B
    vec2f( 0.779154,  0.238075)  // P5_C
  );

  const colors = array(
    vec3f(0.57, 0.12, 0.94), // Purple
    vec3f(0.12, 0.40, 0.94), // Royal Blue
    vec3f(0.00, 0.65, 0.85), // Blue-Teal
    vec3f(0.12, 0.40, 0.94), // Royal Blue
    vec3f(0.00, 0.65, 0.85), // Blue-Teal
    vec3f(0.00, 0.75, 0.75), // Teal
    vec3f(0.00, 0.65, 0.85), // Blue-Teal
    vec3f(0.05, 0.75, 0.55), // Teal-Green
    vec3f(0.12, 0.75, 0.35), // Green
    vec3f(0.12, 0.75, 0.35), // Green
    vec3f(0.50, 0.80, 0.20), // Lime-Green
    vec3f(0.94, 0.85, 0.12), // Yellow
    vec3f(0.94, 0.85, 0.12), // Yellow
    vec3f(0.12, 0.75, 0.35), // Green
    vec3f(0.70, 0.82, 0.15)  // Lime-Yellow
  );

  var out: VertexOutput;
  out.pos = vec4f(pos[vertex_index], 0.0, 1.0);
  out.color = colors[vertex_index];
  out.uv = pos[vertex_index];
  return out;
}

@fragment
fn frag_main(in: VertexOutput) -> @location(0) vec4f {
  // Animate the gradient colors using the frame uniform to make the gradient float
  let t = f32(frame) * 0.03;
  let wave = sin(in.uv.x * 3.0 + t) * 0.18 + cos(in.uv.y * 3.0 - t) * 0.18;
  
  let animated_color = in.color + vec3f(wave, -wave * 0.6, sin(t) * 0.12);
  
  // WARMUP ACTIVITY: Try altering the animation or colors below!
  // For example, uncomment this line to see a pulsing solid green:
  // return vec4f(0.0, sin(f32(frame) / 128.0), 0.0, 1.0);
  
  return vec4f(clamp(animated_color, vec3f(0.0), vec3f(1.0)), 1.0);
}
