---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Override Variables'
---
In WGSL, `override` variables (often called **pipeline-creatable constants**) define scalar values that are set to default values inside the shader, but can be customized (overridden) at pipeline creation time on the JavaScript host.

This is highly efficient. When you override an `override` variable, the GPU compiler optimizes the shader during compilation for that specific pipeline, constant-folding any branches or expressions that depend on it (similar to preprocessor `#if` macros in other shading languages), without requiring you to compile or modify separate shader source strings.

---

## Declaring Override Variables

Override variables must be declared at **global scope** (outside of any functions) using the `override` keyword.

**Syntax:**

```wgsl
override name: type = default_value;
```

- Only scalar types (`f32`, `i32`, `u32`, `f16`, `bool`) are supported. Complex types (structs, arrays, vectors) cannot be declared as `override`.
- If no default value is supplied, you **must** provide one during pipeline creation in JavaScript; otherwise, compilation will fail.
- You can optionally assign an integer identifier using the `@id` attribute.

**Examples:**

<details class='example'>
<summary>Example</summary>

```wgsl
override lightIntensity: f32 = 1.0;          // Default value provided
@id(42) override maxIterations: u32;         // Must be overridden in JS
```

</details>

---

## Overriding in JavaScript

In the WebGPU JavaScript API, overrides are passed via the `constants` map of the programmable stage descriptor (`vertex`, `fragment`, or `compute` stages).

You can refer to the variable by its **WGSL identifier name** or by its **numeric `@id` value** (as a stringified key).

### Example: Overriding Constants in Shader and Host

<details class='example'>
<summary>Example</summary>

**WGSL Shader Code:**

```wgsl
override lightIntensity: f32 = 1.0;
@id(42) override useGamma: bool = false;

@fragment
fn main() -> @location(0) vec4<f32> {
    var color = vec4<f32>(1.0, 0.5, 0.2, 1.0);

    if (useGamma) {
        color = pow(color, vec4<f32>(2.2));
    }

    return color * lightIntensity;
}
```

**JavaScript Host Setup:**

```javascript
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [{ format: 'rgba8unorm' }],

    // Override the pipeline constants here:
    constants: {
      lightIntensity: 2.5, // Overriding by variable name
      42: 1, // Overriding @id(42) (boolean true mapped to 1)
    },
  },
});
```

</details>

---

## Summary

- **Static Optimization**: Allows branch-pruning and constant-folding at pipeline compilation, giving you the flexibility of dynamic variables with the speed of hardcoded constants.
- **JS mapping via `constants`**: Overrides are defined inside individual pipeline stages (`vertex.constants`, `fragment.constants`, etc.) rather than on a top-level pipeline property.
- **String or @id Keying**: Identify variables on the host by their WGSL name string or by a stringified `@id(N)` integer value.

---

!!! info "Deep-Dive: Override Evaluation Stage"
    For details on how the compiler and pipeline builder evaluate expressions containing overrides, including how they propagate through sub-expressions and enable dynamic workgroup or cache sizing, see the **[Override Stage](../expressions/evaluation-stage/override/index.md)** reference.
