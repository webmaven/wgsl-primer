<!--
Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
See root README.md for global project-wide upstream attributions.
-->

# Changelog

All notable changes to **WGSL: A Primer** (forked from the original 2023 *Tour of WGSL*) are documented here.

---

## 2.0.0-alpha.1 (this fork)

This version represents a modernization of the platform, transitioning from Hugo to a ProperDocs-based interactive workspace with GPGPU topics and custom visualizers.

### Infrastructure & Toolchain

- **Site Generator Migration**: Migrated the static site engine from Hugo to [ProperDocs](https://github.com/properdocs/properdocs) using the [MaterialX theme](https://github.com/properdocs/mkdocs-materialx).
- **Asset Bundling**: Integrated [Vite](https://vite.dev/) to handle SCSS compilation, TypeScript bundling, and Hot Module Replacement (HMR) for visualizers.
- **CI/CD Modernization**: Updated GitHub Actions workflows (`deploy-main.yml` and `build-pr.yml`) to use modern actions and runtime environments (Node 20, Python 3.11+).
- **Code Quality**: Established ESLint and Prettier rules for TypeScript assets and optimized checks with `.prettierignore`.

### GPGPU Content Expansion

Added **28,896 words** overall to the Primer, expanding it from a 9,000-word draft to a ~38,000-word technical reference (a ~3x expansion).

#### New Sections & Filled-out Blank Stubs

- **Bitwise & Data Packing** ([bitwise-packing.md](../expressions/operators/bitwise-packing.md)) – Case study on floating-point normal vector quantization and bitwise packing to optimize GPU memory bandwidth.
- **Structure Alignment** ([alignment.md](../types/structures/alignment.md)) – Guide detailing struct alignment, host/device padding rules, and memory layout constraints.
- **Strict Typing** ([strict-typing.md](../expressions/strict-typing.md)) – Analysis of WebGPU's "no implicit coercion" typing rules and compile-time validation.
- **Evaluation Stages & Constant/Override Stages** ([index.md](../expressions/evaluation-stage/index.md)) – Architectural guide to the constant, override, and runtime execution stages in WGSL compilation pipelines.
- **Atomic Operations** ([atomic-operations.md](../types/atomics/atomic-operations.md)) – Guide on resolving data race conditions using hardware-level atomic primitives (`atomicAdd`, `atomicMin`).
- **Thread Coordinates** ([thread-coordinates.md](../variables/thread-coordinates.md)) – Thread indexing guide with `@builtin(global_invocation_id)` and grid coordinate spaces.
- **Subgroups** ([subgroups.md](../uniformity-analysis/subgroups.md)) – Sections on register-level shuffles and hardware-level thread cooperation intrinsics (`subgroupBroadcast`).
- **Module Overview Indexes** – Created and populated overview landing pages across all 11 core modules (Functions, Types, Vectors, Matrices, Arrays, Structures, Pointers, Atomics, Expressions, Control Flow, Binding Points, Uniformity Analysis), adding technical context.

#### Expanded Sections

- **Pointer Aliasing & Memory Constraints** ([no_aliasing.md](../types/pointers/no_aliasing.md) and [no_aliasing_nested_calls.md](../types/pointers/no_aliasing_nested_calls.md)) – Expanded to cover WGSL's no-aliasing rules for nested and concurrent function invocations.
- **Linear Algebra Multiplication** ([multiplication.md](../types/matrices/multiplication.md)) – Expanded to cover matrix/vector multiplication mechanics and inner-product hardware pathways.
- **Invocations & Divergent Control Flow** ([invocations.md](../uniformity-analysis/invocations.md)) – Expanded to cover execution models and divergent control flow pathways in WebGPU shader pipelines.
- **Barriers & Synchronization** ([memory-barriers.md](../variables/memory-barriers.md)) – Expanded to cover workgroup cache hierarchies, execution barrier timings, and `workgroupBarrier()` usage.

### Interactive Visualizers & UI

- **Dynamic Buffer Viewer (`ArrayVisualizer`)**: Added live calculations of alignment boundaries and memory padding for editable structures. Used on [Runtime-Sized Arrays](../types/arrays/runtime-sized-arrays.md) and [Pointers as Short Names](../types/pointers/pointers_as_short_names.md).
- **Workgroup Sync Matrix (`WorkgroupVisualizer`)**: Added an interactive thread coordination grid with an execution timeline slider to step through workgroup barriers. Used on [Workgroup Variables](../variables/var-workgroup.md).
- **Dual-Pane Split Layout**: Designed an independent-scroll dual-pane grid on screens larger than `1200px`, keeping the compiler workspace locked in-viewport while reading.
- **Compact Sticky Footer**: Standardized a fixed glassmorphic bottom footer with inline navigation links and copyright/attribution anchors.
- **Static Fallbacks**: Implemented responsive SVG and HTML fallback layouts for clients without WebGPU support.

---

## Pre-Fork Legacy (2023–2024)

The original *Tour of WGSL* infrastructure, core content organization, and WebGPU compiler simulation engines were built and maintained by Google WebGPU team contributors and open-source community members.

For the full, authoritative roster of original upstream creators, please see the [Copyright & License](copyright.md#contributors-maintainers) page. Additional contributions are archived in the original project's [GitHub Contributors Graph](https://github.com/google/tour-of-wgsl/graphs/contributors).
