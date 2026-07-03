/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

@group(0) @binding(0) var<uniform> frame: u32;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vtx_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
  // A single giant triangle covering the screen (-1 to 3 clip space)
  const pos = array(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0)
  );

  var out: VertexOutput;
  out.pos = vec4f(pos[vertex_index], 0.0, 1.0);
  out.uv = pos[vertex_index] * 0.5 + vec2f(0.5);
  return out;
}

@fragment
fn frag_main(in: VertexOutput) -> @location(0) vec4f {
  let t = f32(frame) * 0.02;

  // Create a base moving color vector using spatial coordinates and time
  let r = sin(in.uv.x * 6.28 + t) * 0.5 + 0.5;
  let g = sin(in.uv.y * 6.28 - t) * 0.5 + 0.5;
  let b = cos((in.uv.x + in.uv.y) * 3.14 + t) * 0.5 + 0.5;

  let base_color = vec4f(r, g, b, 1.0);

  // SWIZZLING OVERRIDES: Try uncommenting and editing different swizzles below!
  var final_color = base_color;

  // Option 1: Swap red and blue channels (color swapping)
  // final_color = vec4f(base_color.bgr, 1.0);

  // Option 2: Extract green channel to make it monochromatic (component isolation)
  // final_color = vec4f(base_color.ggg, 1.0);

  // Option 3: Generate a 3D color wave from 2D coordinates (.xyx)
  // final_color = vec4f(sin(in.uv.xyx * 10.0 + t) * 0.5 + 0.5, 1.0);

  return final_color;
}
