// The input storage buffer is a runtime-sized array.
@group(0) @binding(0) var<storage, read> input_data: array<f32>;

// The output storage buffer is a runtime-sized array.
@group(0) @binding(1) var<storage, read_write> output_data: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let index = global_id.x;
    
    // Query the element count of the runtime-sized array.
    // arrayLength accepts a pointer to the array and returns a u32.
    let length = arrayLength(&input_data);
    
    // Check bounds before performing array operations.
    if (index < length) {
        let original_value = input_data[index];
        
        // Multiply the input element by a scaling factor
        let scaled_value = original_value * 2.5;
        
        // Write the result directly to the output array
        output_data[index] = scaled_value;
    }
}
