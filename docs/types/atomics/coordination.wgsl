struct AtomicResults {
  raced_sum: u32,
  atomic_sum: u32,
}

// Simulating 1000 threads doing concurrent increments.
// Without atomics, some increments overlap and are lost (resulting in e.g., 642).
// With atomics, the GPU serializes them to guarantee the exact total of 1000.
const atomic_results = AtomicResults(
  642u,   // raced_sum
  1000u   // atomic_sum
);

// Illustrating safe atomic accumulation versus a hazardous race.
var<workgroup> secure_counter: atomic<u32>;
var<workgroup> insecure_counter: u32;

fn concurrent_worker() {
  // SAFE: atomicAdd takes a pointer (&) to the workgroup atomic variable.
  // The hardware serializes concurrent requests to prevent data loss.
  atomicAdd(&secure_counter, 1u);
  
  // HAZARDOUS: Ordinary additions are not atomic.
  // Read, add, and write back are separate actions; overlapping threads
  // will read duplicate values, leading to silent, untraceable data loss.
  insecure_counter += 1u;
}
