/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

fn get_vector() -> vec4f {
  return vec4f(1.0, 2.0, 3.0, 4.0);
}

fn test_individual_access() -> f32 {
  let v = get_vector();
  return v.y; // Should be 2.0
}

fn test_color_style() -> f32 {
  let color = vec4f(0.1, 0.2, 0.3, 1.0);
  return color.g; // Should be 0.2
}

fn test_array_indexing() -> f32 {
  let v = get_vector();
  return v[2]; // Should be 3.0 (equivalent to v.z)
}

fn test_swizzling_reorder() -> vec3f {
  let v = get_vector();
  return v.zyx; // Should be vec3f(3.0, 2.0, 1.0)
}

fn test_swizzling_repeat() -> vec4f {
  let v = get_vector();
  return v.xxxx; // Should be vec4f(1.0, 1.0, 1.0, 1.0)
}
