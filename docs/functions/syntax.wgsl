// WGSL Syntax Demonstration

// 1. A function with no parameters and no return value (void function)
fn do_nothing() {
    // Body is empty, or performs state modifications
}

// 2. A function with an input parameter and no return value
fn eat_an_i32(my_param : i32) {
    // Parameter 'my_param' is read-only inside this scope
}

// 3. A function with no parameters that returns an 'i32' value
fn give_me_a_number() -> i32 {
    return 42;
}

// 4. A function with multiple parameters that returns a 'f32' value
// Notice the literal '2.0' - division must match types strictly!
fn average(a : f32, b : f32) -> f32 {
    return (a + b) / 2.0; 
}
