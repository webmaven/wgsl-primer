// Case study: Surface Normal (vec3<f32>) and Specular intensity (f32) packing
// - Normal: x, y, z in [-1.0, 1.0] -> packed into 10 bits each (0 to 1023)
// - Specular: s in [0.0, 1.0] -> packed into 2 bits (0 to 3)

struct UnpackedData {
    normal: vec3<f32>,
    specular: f32,
};

fn pack_surface_data(normal: vec3<f32>, specular: f32) -> u32 {
    // 1. Clamp and map normal components from [-1.0, 1.0] to [0.0, 1.0]
    let n_mapped = clamp(normal, vec3f(-1.0), vec3f(1.0)) * 0.5 + 0.5;

    // 2. Convert to 10-bit integers (0 to 1023)
    let x_u32 = u32(round(n_mapped.x * 1023.0));
    let y_u32 = u32(round(n_mapped.y * 1023.0));
    let z_u32 = u32(round(n_mapped.z * 1023.0));

    // 3. Clamp and map specular to 2-bit integer (0 to 3)
    let s_mapped = clamp(specular, 0.0, 1.0);
    let s_u32 = u32(round(s_mapped * 3.0));

    // 4. Combine into a single u32 using bitwise shifts and OR operations
    // - x goes to bits 0-9   (shift 0)
    // - y goes to bits 10-19  (shift 10)
    // - z goes to bits 20-29  (shift 20)
    // - s goes to bits 30-31  (shift 30)
    let packed = x_u32 | (y_u32 << 10u) | (z_u32 << 20u) | (s_u32 << 30u);
    return packed;
}

fn unpack_surface_data(packed: u32) -> UnpackedData {
    // 1. Extract 10-bit components using bitwise shifts and AND masks (0x3FFu is 10 bits of 1s)
    let x_u32 = packed & 0x3FFu;
    let y_u32 = (packed >> 10u) & 0x3FFu;
    let z_u32 = (packed >> 20u) & 0x3FFu;

    // 2. Extract 2-bit specular intensity (0x3u is 2 bits of 1s)
    let s_u32 = (packed >> 30u) & 0x3u;

    // 3. Map back to original floating-point ranges
    var unpacked: UnpackedData;
    unpacked.normal.x = (f32(x_u32) / 1023.0) * 2.0 - 1.0;
    unpacked.normal.y = (f32(y_u32) / 1023.0) * 2.0 - 1.0;
    unpacked.normal.z = (f32(z_u32) / 1023.0) * 2.0 - 1.0;
    unpacked.specular = f32(s_u32) / 3.0;

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

