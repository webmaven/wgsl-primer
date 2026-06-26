---
title: "Structure Layouts & Memory Alignment"
shader: ./alignment.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "computed_offsets.u_align",  "type": "u32"},
    {"expr": "computed_offsets.v_align",  "type": "u32"},
    {"expr": "computed_offsets.w_align",  "type": "u32"},
    {"expr": "computed_offsets.size_of_struct", "type": "u32"}
]}'
---

When passing structures between your host program (JavaScript) and shaders, you must follow strict **Structure Layout & Memory Alignment** rules.

In WGSL, all variables are laid out in memory according to the Vulkan `std430` rules. This means every data type has an **alignment requirement** (the address of the variable must be a multiple of its alignment) and a **size** (the actual bytes it occupies in memory).

### Memory Alignments & Sizing Rules

Each basic type has an inherent size and alignment in bytes:

| Type                | Alignment (bytes) | Size (bytes)                    |
| :------------------ | :---------------- | :------------------------------ |
| `f32`, `i32`, `u32` | 4                 | 4                               |
| `vec2<f32>`         | 8                 | 8                               |
| `vec3<f32>`         | **16**            | **12**                          |
| `vec4<f32>`         | 16                | 16                              |
| `mat4x4<f32>`       | 16                | 64 (4 columns of 16 bytes each) |

!!! warning
    **The `vec3` Trap**: A `vec3<f32>` contains 3 floats, so it only occupies 12 bytes of data. However, **its alignment is 16 bytes**. This means any variable placed in memory immediately after a `vec3` will be forced to start at a 16-byte boundary, leaving a **4-byte padding hole** in your structure!

### Structure Padding Example

Consider this WGSL structure:

```wgsl
struct MyData {
  a : u32,      // Offset 0, size 4 (aligned to 4)
  b : vec3<f32>,// Offset 16, size 12 (aligned to 16) - 12 bytes of padding left after 'a'!
  c : f32,      // Offset 28, size 4 (aligned to 4)
}               // Total size: 32 bytes (struct aligned to its largest member, which is 16)
```

To prevent mismatched layouts between JavaScript and WGSL, you can use explicit **attributes** to enforce alignments and sizes:

- **`@align(N)`**: Sets the alignment of a structure member to `N` bytes.
- **`@size(N)`**: Sets the size of a structure member to `N` bytes.

Let's inspect the code on the right to see how offsets and sizes are calculated dynamically!
