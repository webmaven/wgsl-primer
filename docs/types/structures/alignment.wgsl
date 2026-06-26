struct Offsets {
  u_align: u32,
  v_align: u32,
  w_align: u32,
  size_of_struct: u32,
}

// Define a struct to demonstrate alignment, size and padding rules.
struct CustomVehicle {
  // Offset 0, size 4 (aligned to 4)
  @align(4) num_wheels: u32,
  
  // Offset 16, size 12 (aligned to 16 due to vec3's inherent alignment requirement)
  // This leaves 12 bytes of padding between num_wheels and mass_kg!
  @align(16) mass_kg: vec3<f32>,
  
  // Offset 28, size 4, but explicitly padded to size 8 using the @size attribute
  @size(8) cargo_id: u32,
}

// Since WGSL does not have runtime sizeof/alignof operators,
// we define a constant struct that represents the calculated layout offsets
// to feed the Tour of WGSL's value visualizer.
const computed_offsets = Offsets(
  4u,   // u_align: alignment of num_wheels
  16u,  // v_align: alignment of mass_kg (vec3<f32>)
  8u,   // w_align: size of cargo_id (with @size(8))
  32u   // size_of_struct: total size of CustomVehicle struct
);
