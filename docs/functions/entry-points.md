---
title: 'Entry Points'
shader: ./entry-points.wgsl
visualizer: /ts/graphics_visualizer.ts
---

# Pipeline Entry Points

An **entry point** is a special user-defined function that acts as the starting point of execution within a GPU shader. These functions are invoked directly by the host WebGPU application on the CPU.

A single WGSL file (or module) can contain multiple entry points, allowing you to define vertex, fragment, and compute pipelines in one place.

---

### The Three Shader Stages

WGSL supports three primary shader entry point stages, each identified by a specific attribute annotation:

*   **Vertex Shaders (`@vertex`)**: The vertex stage is responsible for processing individual vertex coordinates (typically representing 3D geometry).
    *   **Role**: Computes and transforms coordinates into clip-space.
    *   **Required Output**: Must output a 4-component float vector representing the position, annotated with the `@builtin(position)` attribute, to instruct the hardware rasterizer where to place the shape.

*   **Fragment Shaders (`@fragment`)**: The fragment stage determines the color of individual pixels (or fragments) rasterized from the geometry.
    *   **Role**: Computes shading, lighting, and textures.
    *   **Required Output**: Typically outputs a 4-component color vector associated with a color target channel, annotated with the `@location(0)` attribute.

*   **Compute Shaders (`@compute`)**: The compute stage performs general-purpose computing (GPGPU) outside of traditional graphics rendering (e.g., sorting, physics simulations, or linear algebra).
    *   **Role**: Executes arbitrary, highly parallel data manipulations.
    *   **Required Annotation**: Must be annotated with the <code>@workgroup_size(<span class="template template-array-n">X</span>, <span class="template template-array-n">Y</span>, <span class="template template-array-n">Z</span>)</code> attribute, defining the multi-dimensional layout of parallel threads that execute together in a single group.


---

### Data Flow and Pipeline Connectivity

Data enters and exits entry point functions through parameter lists and return values. This boundary interfacing uses two main mechanisms:

*   **System Builtins (`@builtin`)**: Provides access to hardware-generated inputs (e.g., `@builtin(vertex_index)` or `@builtin(global_invocation_id)`) or outputs position data.
*   **Custom Channels (`@location`)**: Interconnects custom data between stages. For example, a vertex shader's `@location(0)` output (such as color or texture UV coordinates) is automatically interpolated across the geometry and delivered as the `@location(0)` input to the fragment shader.

Review the playground code to see vertex, fragment, and compute entry points defined and annotated.
