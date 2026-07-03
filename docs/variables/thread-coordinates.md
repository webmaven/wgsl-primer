---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: "Workgrid Dispatch & Thread Coordinates"
shader: ./thread-coordinates.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "computed_coords.global_id", "type": "vec3u"},
    {"expr": "computed_coords.local_id",  "type": "vec3u"},
    {"expr": "computed_coords.workgroup_id", "type": "vec3u"},
    {"expr": "computed_coords.local_idx", "type": "u32"}
]}'
---

When launching a compute shader, execution is divided into a three-level hierarchy: **Invocations (Threads)**, **Workgroups**, and the **Grid**.

Understanding the coordinates of each executing thread is critical for GPGPU programming. WGSL provides several built-in input variables to locate an invocation within this hierarchy.

### Thread Coordinates Built-ins

Every execution thread has access to the following built-ins in its entry point:

1. **`@builtin(global_invocation_id)`** (`vec3<u32>`): The unique 3D coordinate of the current thread across the _entire_ dispatch grid.
2. **`@builtin(local_invocation_id)`** (`vec3<u32>`): The 3D coordinate of the thread _within_ its parent workgroup.
3. **`@builtin(workgroup_id)`** (`vec3<u32>`): The 3D coordinate of the workgroup _within_ the dispatch grid.
4. **`@builtin(local_invocation_index)`** (`u32`): A linearized (1D) index of the thread within its workgroup, starting at `0` and ending at `(size_x * size_y * size_z) - 1`.

### Mathematical Coordination Mapping

The relationship between these coordinates is given by:

\[ \text{global_invocation_id} = \text{workgroup_id} \times \text{workgroup_size} + \text{local_invocation_id} \]

Or in WGSL component form:

```wgsl
let global_x = workgroup_id.x * workgroup_size_x + local_id.x;
```

Similarly, the linearized index `local_invocation_index` is computed from the 3D local coordinate as:

\[ \text{local_invocation_index} = \text{local_id.z} \times (\text{size_x} \times \text{size_y}) + \text{local_id.y} \times \text{size_x} + \text{local_id.x} \]

### Inspecting Coordinates

In the shader code on the right, we capture these coordinate values. The visualizer evaluates them to show the layout mappings!
