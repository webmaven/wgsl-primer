---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Vectors Overview'
shader: ./index.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "test_vec2f()", "type": "vec2f"},
    {"expr": "test_vec3u()", "type": "vec3u"},
    {"expr": "test_vec4i()", "type": "vec4i"}
]}'
---
WGSL supports 2-element, 3-element and 4-element vectors of scalar types.

Vectors are declared with the form <code>vec<span class="template template-vec-n">N</span>&lt;<span class="template template-vec-t">T</span>&gt;</code>, where <span class="template template-vec-n">N</span> is the number of elements in the vector, and <span class="template template-vec-t">T</span> is the element type.

| Vector Type  | Description                      |
| :----------- | :------------------------------- |
| `vec2<f32>`  | A two-element vector of `f32`.   |
| `vec3<u32>`  | A three-element vector of `u32`. |
| `vec4<bool>` | A four-element vector of `bool`. |

WGSL also predeclares the aliases <code>vec<span class="template template-vec-n">N</span><span class="template template-vec-s">S</span></code>, where <span class="template template-vec-s">S</span> is one of `i`, `u` or `f`:

- <code>vec<span class="template template-vec-n">N</span>i</code> is an alias to <code>vec<span class="template template-vec-n">N</span>&lt;i32&gt;</code>
- <code>vec<span class="template template-vec-n">N</span>u</code> is an alias to <code>vec<span class="template template-vec-n">N</span>&lt;u32&gt;</code>
- <code>vec<span class="template template-vec-n">N</span>f</code> is an alias to <code>vec<span class="template template-vec-n">N</span>&lt;f32&gt;</code>

| Alias   | Full Representation                           |
| :------ | :-------------------------------------------- |
| `vec2f` | `vec2<f32>` (a two-element vector of `f32`)   |
| `vec3u` | `vec3<u32>` (a three-element vector of `u32`) |
| `vec4i` | `vec4<i32>` (a four-element vector of `i32`)  |

---

## Next Steps

Vector operations and usage:

- **[Vector Constructors](constructors.md)**: Initialization forms including splat, element-wise, and type-inferring constructors.
- **[Components & Swizzling](components.md)**: Individual component access, spatial/color naming styles, and swizzling rules.