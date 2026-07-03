---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Uniformity Analysis Overview'
---
In WebGPU, shaders do not execute as isolated, single-threaded programs. Instead, they run across thousands of parallel processor cores. To coordinate these threads and perform advanced operations, the hardware requires them to cooperate.

**Uniformity Analysis** is a static compile-time safety check performed by the WGSL compiler. It guarantees that certain advanced instructions—referred to as **uniform-requiring operations**—are only executed in locations where all cooperating threads are guaranteed to execute them in lockstep.

---

## The Cooperative Execution Problem

Certain operations in modern GPU programming cannot function correctly if threads inside an execution group diverge (take different branches). 

There are three primary categories of uniform-requiring operations in WGSL:

1. **Execution and Memory Barriers**: Functions like `workgroupBarrier()` or `storageBarrier()` synchronize threads in a workgroup. If one thread branches away and misses the barrier, other threads waiting for it will lock up, leading to a GPU-wide deadlock.
2. **Fragment Derivative Builtins**: Functions like `dpdx()`, `dpdy()`, and `fwidth()` (and implicit derivative samplers like `textureSample()`) compute rates of change by comparing register values between adjacent screen pixels inside a \(2 \times 2\) quad. If control flow diverges within the quad, the GPU cannot safely compute these values, resulting in undefined behavior.
3. **Subgroup Collective Operations**: Functions like `subgroupBroadcast()` or `subgroupAdd()` share data directly between physical register lanes. If lanes diverge, collective data shuffling reads corrupted or uninitialized hardware registers.

---

## Section Structure

This section covers parallel execution mechanics and the uniformity rules enforced by the WGSL compiler across three chapters:

*   **[Invocations & Control Flow](invocations.md)**: Execution models of Vertex, Fragment, and Compute shader stages, and the definition of **Uniform Control Flow** vs. **Divergent Control Flow**.
*   **[Fragment Derivative Builtins](fragment-derivative-builtins.md)**: Details on how \(2 \times 2\) pixel quads compute spatial derivatives, and the uniform control flow restriction on implicit mipmap sampling.
*   **[Subgroups & Register Shuffling](subgroups.md)**: Hardware execution blocks, register-to-register lane shuffles, and collective operations.