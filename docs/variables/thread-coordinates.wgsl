/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

struct Coords {
  global_id: vec3<u32>,
  local_id: vec3<u32>,
  workgroup_id: vec3<u32>,
  local_idx: u32,
}

// We demonstrate a mock dispatch with:
//   workgroup_size = (8, 8, 1)
//   workgroup_id   = (2, 3, 0)
//   local_id       = (4, 5, 0)
//
// Let's compute the thread coordinates mathematically:
//   global_id = workgroup_id * workgroup_size + local_id
//             = (2, 3, 0) * (8, 8, 1) + (4, 5, 0)
//             = (16, 24, 0) + (4, 5, 0)
//             = (20, 29, 0)
//
//   local_idx = local_id.z * (size_x * size_y) + local_id.y * size_x + local_id.x
//             = 0 * 64 + 5 * 8 + 4
//             = 44
const computed_coords = Coords(
  vec3<u32>(20u, 29u, 0u), // global_invocation_id
  vec3<u32>(4u, 5u, 0u),   // local_invocation_id
  vec3<u32>(2u, 3u, 0u),   // workgroup_id
  44u                      // local_invocation_index
);

// This helper function shows how thread coordinates are mathematically related in WGSL.
fn get_global_id(w_id: vec3<u32>, w_size: vec3<u32>, l_id: vec3<u32>) -> vec3<u32> {
  return w_id * w_size + l_id;
}

fn get_local_index(l_id: vec3<u32>, w_size: vec3<u32>) -> u32 {
  return l_id.z * (w_size.x * w_size.y) + l_id.y * w_size.x + l_id.x;
}
