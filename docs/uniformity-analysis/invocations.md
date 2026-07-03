---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Invocations & Control Flow'
---
In WebGPU, a shader does not run as a single monolithic program. Instead, it is executed thousands or millions of times in parallel. Each individual execution of a shader entry point is called an **invocation**.

The way invocations are spawned, scheduled, and grouped depends entirely on the **shader stage** (Vertex, Fragment, or Compute). Understanding these execution models is key to writing high-performance, race-free parallel programs.

---

## Vertex Shader Invocations

In a vertex shader, each vertex in the input stream (defined by your vertex buffers or index buffers) triggers exactly **one invocation**.

- **Purpose**: Transform 3D coordinates, calculate vertex normals, and pass per-vertex attributes to the rasterizer.
- **Key Built-ins**:
  - `@builtin(vertex_index)`: The 0-based index of the vertex being processed.
  - `@builtin(instance_index)`: The index of the active instance when using instanced rendering.

**Example: Generating vertex coordinates procedurally**

<details class='example'>
<summary>Example</summary>

```wgsl
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Generate a fullscreen triangle using only the vertex index!
    var pos = vec2<f32>(0.0, 0.0);
    if (vertexIndex == 0u) {
        pos = vec2<f32>(-1.0, -1.0);
    } else if (vertexIndex == 1u) {
        pos = vec2<f32>(3.0, -1.0);
    } else {
        pos = vec2<f32>(-1.0, 3.0);
    }
    return vec4<f32>(pos, 0.0, 1.0);
}
```

</details>

---

## Fragment Shader Invocations

After the vertex stage, WebGPU's hardware rasterizer determines which screen pixels (or sub-pixels) are covered by the rendered primitives. Each covered area triggers **one fragment invocation**.

- **Purpose**: Determine the color, depth, and visibility of a single screen pixel.
- **Key Built-ins**:
  - `@builtin(frag_coord)`: A `vec4<f32>` representing the \((x, y, z, 1/w)\) screen-space coordinates of the fragment.
  - `@builtin(front_facing)`: A `bool` indicating if the fragment is part of a front-facing or back-facing polygon.

**Example: Color mapping based on screen-space coordinates**

<details class='example'>
<summary>Example</summary>

```wgsl
@fragment
fn main(@builtin(frag_coord) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Standardize coordinates and output a red-to-green gradient
    let normX = fragCoord.x / 800.0;
    let normY = fragCoord.y / 600.0;
    return vec4<f32>(normX, normY, 0.0, 1.0);
}
```

</details>

---

## Compute Shader Invocations

Compute shaders run arbitrary, non-graphics tasks. Invocations are defined explicitly on a 3D grid and grouped into blocks called **workgroups**.

- **Purpose**: General-purpose parallel data processing (GPGPU), physics simulation, skinning, or pre-processing textures.
- **Key Built-ins**:
  - `@builtin(global_invocation_id)`: The absolute 3D coordinate of this invocation within the entire dispatch grid.
  - `@builtin(local_invocation_id)`: The 3D coordinate of this invocation relative only to its enclosing workgroup.
  - `@builtin(workgroup_id)`: The 3D coordinate of the active workgroup within the dispatch grid.

**Example: Running thread-specific work within a workgroup**

<details class='example'>
<summary>Example</summary>

```wgsl
@group(0) @binding(0) var<storage, read_write> outputBuffer: array<u32>;

@compute @workgroup_size(64, 1, 1)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let index = global_id.x;

    // Each invocation performs computations on its specific index in the buffer
    outputBuffer[index] = index * local_id.x;
}
```

</details>

---

## Control Flow Uniformity & Divergence

Because thousands of invocations run the same shader code concurrently, their execution paths can split and merge. This behavior is described by **Control Flow Uniformity**.

### Uniform Control Flow

An execution path is in **uniform control flow** when all active invocations in a given group (such as a \(2 \times 2\) pixel quad, a workgroup, or a subgroup) are guaranteed to execute the exact same instruction at the exact same time.

At the start of any shader entry point (`vs_main`, `fs_main`, `cs_main`), execution is always in uniform control flow.

### Divergent (Non-Uniform) Control Flow

If a conditional statement (like `if` or `switch`) or a loop condition depends on a value that varies across different invocations, the group splits. Some invocations take the branch, while others skip it or take the `else` path. This is called **execution divergence** (or non-uniform control flow).

```
              Uniform Control Flow
             [  I0   I1   I2   I3  ]
                     │
           if (global_id.x > 1u)  <-- Divergent Condition
              /             \
             /               \
       (Branch Taken)    (Branch Skipped)
        [  I2   I3  ]      [  I0   I1  ]
             │                 │
      execute_code()       idle_wait()
             │                 │
             \               /
              \             /
             Reconverge / Merge
             [  I0   I1   I2   I3  ]
                     │
              Uniform Control Flow
```

Once a group of invocations diverges, they remain in divergent control flow until their execution paths **reconverge** (typically after the closing brace of the conditional block).

---

## Uniform vs. Divergent Conditions

The uniformity of control flow is determined entirely by the expressions used in branch conditions.

### Uniform Values and Conditions

A value is **uniform** if it is guaranteed to be identical for all active invocations in a draw or dispatch call. Branching on a uniform value **preserves uniform control flow**:

*   **Shader Constants**: Constants declared with `const` or `let` variables derived from uniform sources.
*   **Pipeline Overrides**: Values declared with `override`.
*   **Uniform Buffers**: Variables residing in the `uniform` address space (`var<uniform>`).
*   **Literals**: Concrete values like `42u`, `3.14f`, or `true`.

```wgsl
// Uniform condition: all invocations check the same buffer value
if (myUniformBuffer.scale > 1.0) {
    // Inside this block, execution remains in UNIFORM control flow!
}
```

### Divergent (Non-Uniform) Values and Conditions

A value is **divergent** if it can differ between different invocations. Branching on a divergent value **causes execution divergence**:

*   **Stage Inputs**: Attributes like `@location(N)` or built-ins like `@builtin(vertex_index)`, `@builtin(frag_coord)`, or `@builtin(global_invocation_id)`.
*   **Storage Buffers**: Data loaded from the `storage` address space (`var<storage>`).
*   **Textures**: Pixel values loaded or sampled from textures.
*   **Derived Variables**: Any variable calculated using a divergent value.

```wgsl
// Divergent condition: depends on the specific thread coordinate
if (global_id.x % 2u == 0u) {
    // Inside this block, execution is in DIVERGENT control flow!
    // Calling uniform-requiring operations (like barriers or derivatives) here is forbidden.
}
```

---

## Built-in Variable Mapping Reference

The following table lists common built-in input and output variables. Because their values vary per invocation, using them in any control-flow condition causes **execution divergence**:

| Shader Stage  | Built-in Attribute                 | Type        | Explanation                                                                            |
| :------------ | :--------------------------------- | :---------- | :------------------------------------------------------------------------------------- |
| **Vertex**    | `@builtin(vertex_index)`           | `u32`       | 0-based index of current vertex.                                                       |
| **Vertex**    | `@builtin(instance_index)`         | `u32`       | 0-based index of current draw instance.                                                |
| **Fragment**  | `@builtin(frag_coord)`             | `vec4<f32>` | Position of the fragment in window coordinates \((x, y, z, 1/w)\).                     |
| **Fragment**  | `@builtin(front_facing)`           | `bool`      | True if the fragment belongs to a front-facing primitive.                              |
| **Compute**   | `@builtin(local_invocation_id)`    | `vec3<u32>` | Coordinate of the invocation within its workgroup.                                     |
| **Compute**   | `@builtin(global_invocation_id)`   | `vec3<u32>` | Coordinate of the invocation in the overall dispatch grid.                             |
| **Compute**   | `@builtin(workgroup_id)`           | `vec3<u32>` | Index of the active workgroup being executed.                                          |
| **Compute**   | `@builtin(local_invocation_index)` | `u32`       | Flattened 1D index of the invocation within its workgroup.                             |
| **Any Stage** | `@builtin(position)`               | `vec4<f32>` | In vertex: output clip-space coordinates. In fragment: input window-space coordinates. |