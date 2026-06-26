// WGSL Function Calling and Scope Demonstration

// 1. Order of declaration independence
fn start_process() {
    execute_step(); // Ok: Called before its declared definition
}

fn execute_step() {
    // Task implementation
}

// 2. Demonstration of passing arguments by value
fn transform_val(input : f32) -> f32 {
    // Parameters are immutable copies inside user functions
    // input = input * 2.0; // Compile Error: parameters are read-only
    return input * 2.0;
}
