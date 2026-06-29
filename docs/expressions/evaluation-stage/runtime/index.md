---
title: 'Runtime Stage'
---

# Runtime Evaluation Stage

The **Runtime Stage** is the final stage in the lifecycle of a WGSL expression. Runtime-expressions are evaluated during the actual execution of the shader on the GPU hardware. Unlike compile-time constants or pipeline-creation overrides, runtime values are highly dynamic and can change on a per-pixel, per-vertex, or per-thread basis.

---

## Parallel Execution & GPU Registers

When a shader runs, the GPU executes your code across thousands of threads (called **invocations**) simultaneously. 

Each invocation has its own private pool of high-speed memory called **registers**:

- **Registers (`let`)**: Declaring a value with `let` allocates an immutable slot in that thread's local registers. The expression is evaluated once and remains constant for that specific thread.
- **Mutable Local Variables (`var`)**: Declaring a value with `var` allocates a mutable local variable. This allows the thread to change the value over time (e.g., inside loops or conditional blocks).

```wgsl
@compute @workgroup_size(64)
fn main(@builtin(local_invocation_id) id: vec3<u32>) {
    // Evaluated at runtime; different for every thread!
    let thread_id = id.x; 
    
    // Mutable local variable stored in registers
    var accumulator: u32 = 0u; 
    for (var i = 0u; i < thread_id; i++) {
        accumulator += i;
    }
}
```

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
