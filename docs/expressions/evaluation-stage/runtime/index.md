---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Runtime Stage'
---
The **Runtime Stage** is the final stage in the lifecycle of a WGSL expression. Runtime-expressions are evaluated during the actual execution of the shader on the GPU hardware. Unlike compile-time constants or pipeline-creation overrides, runtime values are highly dynamic and can change on a per-pixel, per-vertex, or per-thread basis.

---

## Parallel Execution & GPU Registers

When a shader runs, the GPU executes your code across thousands of threads (called **invocations**) simultaneously. 

Each invocation has its own private pool of high-speed memory called **registers**:

- **Registers (`let`)**: Allocates an immutable register slot inside the executing thread.
- **Mutable Local Variables (`var`)**: Allocates a mutable block of register or thread-local storage, allowing values to be updated incrementally.

```wgsl
@compute @workgroup_size(64)
fn main(@builtin(local_invocation_id) id: vec3<u32>) {
    // Evaluated at runtime; different for every thread!
    let thread_id = id.x; 
    
    // Mutable local variable stored in thread registers
    var accumulator: u32 = 0u; 
    for (var i = 0u; i < thread_id; i++) {
        accumulator += i;
    }
}
```

!!! info "Syntax Reference: `let` Declarations"
    For detailed syntax patterns, block-scoping constraints, and how `let` supports binding to pointer types, refer to the **[`let` Declarations](../../../variables/let.md)** guide.


---

## Dynamic Operations

Most operations inside a real-world shader are dynamic and must be computed at runtime. These include:

### 1. Buffer and Texture Accesses
Reading data from memory buffers or textures can only happen at runtime, as the contents of these resources are stored in VRAM and accessed dynamically based on coordinates or indices.

```wgsl
// UV coordinates change per-pixel, so texture sampling must happen at runtime
let uv = input.tex_coords;
let color = textureSample(my_texture, my_sampler, uv);
```

### 2. Hardware-Accelerated Vector and Matrix Math
Applying arithmetic or geometric operations (such as `dot()`, `cross()`, `reflect()`, or matrix transformations) to dynamic vectors or matrices executes at runtime. Modern GPUs contain dedicated floating-point units (ALUs) designed to perform these vector calculations at extreme speeds.

```wgsl
let world_position = model_matrix * vec4f(input.position, 1.0);
```

---

## Performance Considerations

Because runtime-expressions execute for millions of vertices or pixels every second, optimizing them is critical for achieving high frame rates.

!!! tip "Optimize by Pushing to Earlier Stages"
    The best way to optimize runtime code is to avoid executing it at runtime altogether! 
    
    Always analyze your calculations and push as much math as possible to earlier stages:
    
    - If a math expression depends only on constants, declare it as `const` so the compiler computes it once on the CPU.
    - If a math expression depends on settings configured when the application starts, declare it as `override` so the WebGPU pipeline builder specialized it before execution.
    - Keep only the truly dynamic, thread-specific calculations in the runtime stage.