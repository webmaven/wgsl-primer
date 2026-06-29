struct OperationResults {
  initial_val: u32,
  after_add: u32,
  after_cas_mul: u32,
}

// Statically representing the values after sequential atomic operations
const ops_results = OperationResults(
  10u, // initial_val
  15u, // after_add (10 + 5)
  30u  // after_cas_mul (15 * 2)
);

var<workgroup> my_atomic: atomic<u32>;

fn run_operations_demo() {
  // Store the initial value safely using a pointer
  atomicStore(&my_atomic, 10u);
  
  // Safely add 5 (returns old value 10, new value is 15)
  let old_val = atomicAdd(&my_atomic, 5u);
  
  // Safely multiply by 2 using a Compare-and-Swap retry loop
  var old = atomicLoad(&my_atomic);
  loop {
    let new_val = old * 2u;
    let res = atomicCompareExchangeWeak(&my_atomic, old, new_val);
    
    // If successful, the exchange occurred and we are done!
    if res.exchanged {
      break;
    }
    
    // If unsuccessful, another thread modified my_atomic first.
    // Update old with the actual current value and retry.
    old = res.old_value;
  }
}
