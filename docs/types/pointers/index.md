---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Pointers Overview'
---
In high-performance GPU shading, variables and buffers are stored across distinct types of physical memory on the chip. To write modular, reusable code without copying large chunks of data between functions, WGSL uses **Pointers**.

A **pointer** is a value that refers to a specific storage location in memory rather than holding a direct data value.

---

## What is a WGSL Pointer?

If you come from a systems programming background (in languages like C, C++, or Rust), you might be familiar with pointers as raw 32-bit or 64-bit integer addresses representing locations in virtual system memory. In those languages, you can perform pointer arithmetic, cast pointers to arbitrary types, or accidentally create "null pointers" that crash your application.

**WGSL pointers are fundamentally different:**

* **Static Compile-Time Abstractions**: Pointers in WGSL do not exist as raw, numeric runtime memory addresses. Instead, they are high-level abstractions analyzed and resolved statically by the GPU compiler.
* **No Pointer Arithmetic**: You cannot add or subtract offsets from a pointer (e.g., `p + 1` is a compiler error).
* **No Null Pointers**: A pointer must always be initialized to point to a valid, existing variable or member. There is no concept of a `null` or uninitialized pointer.
* **Strict Address Space Binding**: Every pointer is bound to a specific **Address Space** that dictates *exactly* where the pointed-to memory lives on the physical GPU hardware.

---

## The Role of Address Spaces & Physical Hardware Tiers

When you declare a pointer in WGSL, its type must explicitly declare its **Address Space**. This is because GPUs are massive parallel engines with several distinct tiers of memory, each optimized for different bandwidth, latency, and sharing requirements. 

How these address spaces map to physical GPU architectures is essential for writing high-performance shaders:

<div style="background: #0f172a; border: 1.5px solid #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
  <h3 style="color: #cbd5e1; font-weight: 700; font-size: 16px; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 8px; height: 8px; background-color: #38bdf8; border-radius: 50%;"></span>
    GPU Hardware Memory Tiers
  </h3>

  <!-- Tier 1: Registers -->
  <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.03), rgba(56, 189, 248, 0.08)); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.03);">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
      <span style="color: #38bdf8; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">TIER 1: CORE REGISTERS & L1 CACHE</span>
      <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;">LATENCY: ~1 CYCLE</span>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; margin-bottom: 8px;">
      Ultra-fast registers dedicated to an individual thread. This is where your local thread execution variables reside.
    </p>
    <div style="display: flex; gap: 8px; font-size: 11px; font-weight: 500;">
      <span style="color: #cbd5e1; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 2px 8px; border-radius: 4px;">
        Address Spaces: <code style="color: #38bdf8; background: none; padding: 0;">function</code>, <code style="color: #38bdf8; background: none; padding: 0;">private</code>
      </span>
      <span style="color: #cbd5e1; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 2px 8px; border-radius: 4px;">
        Scope: Single Thread
      </span>
    </div>
  </div>

  <!-- Tier 2: LDS -->
  <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.03), rgba(249, 115, 22, 0.08)); border: 1px solid rgba(249, 115, 22, 0.25); border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 0 15px rgba(249, 115, 22, 0.03);">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
      <span style="color: #f97316; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">TIER 2: ON-CHIP LOCAL DATA SHARE (LDS)</span>
      <span style="background: rgba(249, 115, 22, 0.15); color: #f97316; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;">LATENCY: ~10 CYCLES</span>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; margin-bottom: 8px;">
      High-speed local data share memory located directly on the GPU compute units. Used for fast synchronization and sharing between threads in a workgroup.
    </p>
    <div style="display: flex; gap: 8px; font-size: 11px; font-weight: 500;">
      <span style="color: #cbd5e1; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 2px 8px; border-radius: 4px;">
        Address Spaces: <code style="color: #f97316; background: none; padding: 0;">workgroup</code>
      </span>
      <span style="color: #cbd5e1; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 2px 8px; border-radius: 4px;">
        Scope: Single Workgroup
      </span>
    </div>
  </div>

  <!-- Tier 3: VRAM -->
  <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(16, 185, 129, 0.08)); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 16px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.03);">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
      <span style="color: #10b981; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">TIER 3: GLOBAL VIDEO RAM (VRAM)</span>
      <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;">LATENCY: ~100-300 CYCLES</span>
    </div>
    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; margin-bottom: 8px;">
      Large off-chip global device memory (GDDR/HBM) shared across all threads on the entire GPU, optimized for high bulk throughput.
    </p>
    <div style="display: flex; gap: 8px; font-size: 11px; font-weight: 500;">
      <span style="color: #cbd5e1; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 2px 8px; border-radius: 4px;">
        Address Spaces: <code style="color: #10b981; background: none; padding: 0;">storage</code>, <code style="color: #10b981; background: none; padding: 0;">uniform</code>
      </span>
      <span style="color: #cbd5e1; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; padding: 2px 8px; border-radius: 4px;">
        Scope: Global GPU
      </span>
    </div>
  </div>
</div>

The subsequent sections detail how to write, instantiate, and pass pointers.