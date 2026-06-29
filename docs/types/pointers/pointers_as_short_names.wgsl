struct DataPoint {
    val: f32,
    scaled: f32,
}

@group(0) @binding(0) var<storage, read> input_data: array<f32>;
@group(0) @binding(1) var<storage, read_write> output_data: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let index = global_id.x;
    let length = arrayLength(&input_data);
    
    if (index < length) {
        // 1. Initialize a local composite structure
        var data: DataPoint;
        data.val = input_data[index];
        data.scaled = 0.0;
        
        // 2. Create a pointer as a short name targeting our local structure
        let p = &data;
        
        // 3. Access and update structure members using correct pointer precedence.
        // Parentheses are required: (*p).member binds dereference first.
        let original = (*p).val;
        (*p).scaled = original * 3.0;
        
        // 4. Output the updated struct value back to the buffer
        output_data[index] = (*p).scaled;
    }
}
