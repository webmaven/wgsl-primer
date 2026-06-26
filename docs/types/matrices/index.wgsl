const my_matrix = mat3x3f(
  vec3f(1.0, 2.0, 3.0), // Column 0
  vec3f(4.0, 5.0, 6.0), // Column 1
  vec3f(7.0, 8.0, 9.0)  // Column 2
);

fn get_column_1() -> vec3f {
  return my_matrix[1]; // Resolves to Column 1: vec3f(4.0, 5.0, 6.0)
}

fn get_element_1_2() -> f32 {
  return my_matrix[1][2]; // Column 1, Row 2 (0-based) -> 6.0
}

const m2x2 = mat2x2f(1.0, 2.0, 3.0, 4.0);
