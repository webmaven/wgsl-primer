// Case study: Surface Normal (vec3<f32>) and Specular intensity (f32) packing
// - Normal: x, y, z in [-1.0, 1.0] -> packed into 9 bits each (0 to 511)
// - Specular: s in [0.0, 1.0] -> packed into 5 bits (0 to 31)

struct UnpackedData {
    normal: vec3<f32>,
    specular: f32,
};

fn pack_surface_data(normal: vec3<f32>, specular: f32) -> u32 {
    // 1. Clamp and map normal components from [-1.0, 1.0] to [0.0, 1.0]
    let n_mapped = clamp(normal, vec3f(-1.0), vec3f(1.0)) * 0.5 + 0.5;

    // 2. Convert to 9-bit integers (0 to 511)
    let x_u32 = u32(round(n_mapped.x * 511.0));
    let y_u32 = u32(round(n_mapped.y * 511.0));
    let z_u32 = u32(round(n_mapped.z * 511.0));

    // 3. Clamp and map specular to 5-bit integer (0 to 31)
    let s_mapped = clamp(specular, 0.0, 1.0);
    let s_u32 = u32(round(s_mapped * 31.0));

    // 4. Combine into a single u32 using bitwise shifts and OR operations
    // - x goes to bits 0-8   (shift 0)
    // - y goes to bits 9-17  (shift 9)
    // - z goes to bits 18-26 (shift 18)
    // - s goes to bits 27-31 (shift 27)
    let packed = x_u32 | (y_u32 << 9u) | (z_u32 << 18u) | (s_u32 << 27u);
    return packed;
}

fn unpack_surface_data(packed: u32) -> UnpackedData {
    // 1. Extract 9-bit components using bitwise shifts and AND masks (0x1FFu is 9 bits of 1s)
    let x_u32 = packed & 0x1FFu;
    let y_u32 = (packed >> 9u) & 0x1FFu;
    let z_u32 = (packed >> 18u) & 0x1FFu;

    // 2. Extract 5-bit specular intensity (0x1Fu is 5 bits of 1s)
    let s_u32 = (packed >> 27u) & 0x1Fu;

    // 3. Map back to original floating-point ranges
    var unpacked: UnpackedData;
    unpacked.normal.x = (f32(x_u32) / 511.0) * 2.0 - 1.0;
    unpacked.normal.y = (f32(y_u32) / 511.0) * 2.0 - 1.0;
    unpacked.normal.z = (f32(z_u32) / 511.0) * 2.0 - 1.0;
    unpacked.specular = f32(s_u32) / 31.0;

    return unpacked;
}

// Global functions for visualization
fn get_input_normal() -> vec3f {
    return vec3f(-0.577, 0.577, -0.577);
}

fn get_input_specular() -> f32 {
    return 0.75;
}

fn get_packed_val() -> u32 {
    return pack_surface_data(get_input_normal(), get_input_specular());
}

fn get_unpacked_normal() -> vec3f {
    let unpacked = unpack_surface_data(get_packed_val());
    return unpacked.normal;
}

fn get_unpacked_specular() -> f32 {
    let unpacked = unpack_surface_data(get_packed_val());
    return unpacked.specular;
}

