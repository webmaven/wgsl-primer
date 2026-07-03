---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Components & swizzling'
shader: ./components.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "test_individual_access()", "type": "f32"},
    {"expr": "test_color_style()", "type": "f32"},
    {"expr": "test_array_indexing()", "type": "f32"},
    {"expr": "test_swizzling_reorder()", "type": "vec3f"},
    {"expr": "test_swizzling_repeat()", "type": "vec4f"}
]}'
---
In WGSL, vectors are multi-component containers. To manipulate vectors effectively, you need to read individual components, reorder them, or index them like arrays. WGSL provides high-performance, built-in syntax for component selection, indexing, and swizzling.

---

## Component Access Styles

You can access individual vector components using dot-notation. WGSL supports two distinct semantic naming styles:

| Style                | Valid Components       | Typical Use Case                            |
| :------------------- | :--------------------- | :------------------------------------------ |
| **Coordinate Style** | `.x`, `.y`, `.z`, `.w` | Spatial positions, coordinates, and offsets |
| **Color Style**      | `.r`, `.g`, `.b`, `.a` | Color channels (Red, Green, Blue, Alpha)    |

### Strict Naming Rules

To keep code readable and prevent compiler ambiguity, WGSL enforces two critical rules:

1. **No Style Mixing**: You cannot mix coordinate and color naming styles within a single access expression.
   - `my_vec.xy` is **valid**.
   - `my_vec.rg` is **valid**.
   - `my_vec.xg` is **invalid** and results in a compilation error.
2. **Bounds Checking**: You can only access components that exist within the vector's declared dimension.
   - Attempting to access `.z` or `.b` on a `vec2` will cause a compile-time error.

---

## Array-Like Indexing

If you need to access components dynamically using variables or numerical offsets, you can index a vector just like a standard array using 0-based integer indices:

```wgsl
let position = vec3f(1.0, 2.0, 3.0);
let first_comp  = position[0]; // Resolves to 1.0 (equivalent to position.x)
let second_comp = position[1]; // Resolves to 2.0 (equivalent to position.y)
```

!!! note "Dynamic Indexing Constraint"
    While constant indices (like `position[0]`) can be evaluated at compile-time or pipeline-creation time, dynamic variable indices (like `position[index]`) are evaluated at runtime on the GPU.

---

## Component Swizzling

**Swizzling** is an extremely powerful technique that allows you to construct a new, smaller, or identical-sized vector by combining components of an existing vector in any order, duplicating them as needed.

You swizzle by appending multiple component letters after the dot:

```wgsl
let v = vec4f(1.0, 2.0, 3.0, 4.0);

let reversed  = v.zyx;   // Constructs vec3f(3.0, 2.0, 1.0)
let red_green = v.rg;    // Constructs vec2f(1.0, 2.0)
let replicated = v.xxxx; // Constructs vec4f(1.0, 1.0, 1.0, 1.0)
```

The resulting vector's size is determined by the number of component letters you specify (from 2 up to 4 elements).

---

## The Read-Only (Rvalue) Constraint

!!! important "Crucial WGSL Restriction"
    In WGSL, swizzles are strictly **rvalues** (read-only expressions). Unlike some other shading languages (such as GLSL), you **cannot** write to a swizzle or use it on the left-hand side of an assignment.

    ```wgsl
    // ❌ INVALID: This will fail to compile in WGSL
    position.xy = vec2f(10.0, 20.0);

    //  VALID: You must assign components individually
    position.x = 10.0;
    position.y = 20.0;

    //  VALID: Assign to the entire vector
    position = vec3f(10.0, 20.0, position.z);
    ```

---