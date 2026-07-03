/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

struct SyncStatus {
  has_raced: u32,
  barrier_passed: u32,
}

// 1. Declare workgroup memory (SRAM) shared across all threads in the workgroup.
// Note: Workgroup variables must be declared at the module scope (top-level).
var<workgroup> temp_cache: array<f32, 64>;

// Simulating a synchronized collaborative reduction/shift.
// Under safe synchronization, has_raced is 0u, and barrier_passed is 1u.
const sync_status = SyncStatus(
  0u, // has_raced (safe execution guaranteed by barrier)
  1u  // barrier_passed (all threads reached and aligned successfully)
);

// Illustrative function showing the collaborative workgroup load pattern.
fn run_safe_collaborative_load(local_idx: u32) -> f32 {
  // 2. Each thread loads its matching item from the slow global memory into local SRAM.
  // temp_cache[local_idx] = global_input[local_idx];
  
  // 3. We MUST wait for all threads to finish their load operations before we read.
  // If we do not put workgroupBarrier() here, a thread might read adjacent elements 
  // before the thread responsible for writing them has executed, creating a DATA RACE!
  workgroupBarrier();
  
  // 4. Safe readback: It is now guaranteed that every cache slot is fully written.
  let neighbor = temp_cache[(local_idx + 1u) % 64u];
  return neighbor * 2.0;
}
