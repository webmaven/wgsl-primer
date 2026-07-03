---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Subgroups & Register-Level Shuffling'
shader: ./subgroups.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
  {"expr": "subgroup_status.active_threads", "type": "u32"},
  {"expr": "subgroup_status.shuffled_val", "type": "f32"}
  ]}'
---

While all threads in a workgroup are logically grouped, the GPU physical hardware actually groups threads into smaller clusters called **subgroups** (also known as *warps* on NVIDIA GPUs, or *wavefronts* on AMD GPUs).

Subgroups typically consist of 32 or 64 threads executing in physical lockstep.

### Direct Register-to-Register Shuffling

Normally, to share data between threads, we must write to shared workgroup memory (`var<workgroup>`) and call `workgroupBarrier()`. This involves roundtrips to SRAM caches, which adds latency.

**Subgroup collective operations** allow threads in the same subgroup to share and shuffle values directly between their hardware registers, completely bypassing memory! This is the fastest possible communication on modern GPU architectures.

### WGSL Subgroup Operations

To use subgroup features, the WebGPU context must enable the `subgroups` extension. WGSL then exposes several subgroup built-ins:

1. <code>subgroupBroadcast(<span class="template template-struct-v1">value</span>, <span class="template template-struct-v2">id</span>)</code>: Shares the <span class="template template-struct-v1">value</span> from thread <span class="template template-struct-v2">id</span> with every other thread in the subgroup.
2. <code>subgroupAdd(<span class="template template-struct-v1">value</span>)</code> / <code>subgroupMul(<span class="template template-struct-v1">value</span>)</code>: Performs collective reductions (e.g., sum or product) across all active threads.
3. <code>subgroupShuffle(<span class="template template-struct-v1">value</span>, <span class="template template-struct-v2">index</span>)</code>: Reads <span class="template template-struct-v1">value</span> directly from the register of the thread at <span class="template template-struct-v2">index</span>.
4. <code>subgroupShuffleXor(<span class="template template-struct-v1">value</span>, <span class="template template-struct-v2">mask</span>)</code>: Shuffles values based on a bitwise XOR of the thread coordinates—ideal for fast tree-reductions.

### Uniformity Constraints

Because subgroup operations are *collective* (meaning all active threads in the subgroup must execute them simultaneously), they are subject to strict **Uniformity Analysis** rules:

- They must only be called in **uniform control flow** (i.e., outside of divergent branches like `if (thread_id % 2 == 0)`).
- Calling them inside divergent blocks will cause compilation errors or undefined values!

### Subgroup State

In the shader code on the right, we show how subgroup-level tree reductions and shuffles are performed. The visualizer captures the outputs.
