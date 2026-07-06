<!--
Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
See root README.md for global project-wide upstream attributions.
-->

# Changelog

All notable changes to **WGSL: A Primer** (forked from the original 2023 *Tour of WGSL*) are documented here.

## 2.0.0-alpha.2

This version introduces significant enhancements to the interactive code editor, status bar controls, compilation pipelines, syntax legibility, keyboard focus, and canvas playback interactions.

### Interactive Code Editor & Status Bar

- **Unified Docked Bottom Status Bar**: Moved compilation and layout controls into a docked bar attached directly to the base of the code editor container, creating a beautiful, unified visual block on desktop.
- **Flexible Compilation Pipeline**: Decoupled compilation from the animation rendering loop, adding a dedicated play-icon **Run** button to compile on demand, alongside a **Live Updates** slide toggle to enable or disable automatic debounced compile-on-type behavior.
- **Segmented Layout Button Group**: Integrated three distinct layout buttons (**Minimize**, **Split**, and **Maximize**) on the far right of the status bar, allowing instant vertical resizing of the workspace panel.
- **Theme-Adaptive High-Legibility Syntax Themes**: Implemented an active `MutationObserver` that monitors the site's `data-md-color-scheme` to automatically toggle editor syntax highlighting and backgrounds, hand-optimizing readability across light (Default) and dark (Slate) modes.
- **Enhanced Tooltip Management**: Added robust `Escape` key, blur, and outer-click handlers to cleanly dismiss definition popups triggered with `ctrl-o` or `cmd-o`.
- **Keyboard Focus Protection**: Intercepted page-level Prev/Next navigation shortcuts when keyboard focus is inside the active editor or interactive visualizers to prevent accidental page switching.

### Canvas Playback Controls

- **Interactive Canvas Overlay**: Implemented an absolute glassmorphic hover/touch overlay directly on the animated shader rendering canvas, housing a custom animated play/pause button to cleanly toggle frame loops.

### Platform Architecture & Cleanup

- **TypeScript Renaming**: Renamed `wgsl-tour.ts` to `wgsl-primer.ts` to align with the modernized codebase, updating all bundler and script entry points.
- **Shadow DOM Core Restorations**: Repaired and restored missing shadow DOM nodes for output and compiler error messaging, ensuring robust interactive diagnostics.

### Bug Fixes

- **Global Tooltip Escape Key**: Fixed a bug where hover/definition tooltips remained visible on the page when pressing the `Escape` key if the keyboard focus was outside the editor container.
- **Run Button Disabled State**: Fixed a UI inconsistency where the play-icon **Run** button remained active even when **Live Updates** was toggled on (the button is now correctly disabled when live updates are enabled, preventing redundant compilation runs).
- **Status Bar Layout Attachment**: Fixed an element placement issue where the docked controls status bar container was mistakenly appended above the CodeMirror text area, ensuring it always attaches seamlessly at the base of the code editor container.
- **Diagnostics Output Restoration**: Restored missing dynamic Shadow DOM diagnostic containers, fixing a rendering bug where compiler error messages and outputs failed to display correctly after pipeline execution.

---

## 2.0.0-alpha.1 (the initial fork)

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
