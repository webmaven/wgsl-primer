/*
 * Copyright ©2026 Michael R. Bernstein. All new modifications licensed under Apache 2.0.
 * Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
 */

struct Vehicle {
  num_wheels: u32,
  mass_kg: f32, // The last comma is optional
}  // Semicolon is optional

// Constructing a structure value by providing values for all members.
const a_bicycle = Vehicle(2, 10.5);
//const bad_vehicle = Vehicle(1.5, 20); // Error: num_wheels must be u32

// Get a member from a structure with '.' and then the member name.
const bike_num_wheels = a_bicycle.num_wheels;

fn add_cargo(v: Vehicle, cargo_mass: f32) -> Vehicle {
  var result = v;
  // Use dot-member notation to update a single member.
  // The other members are unchanged.
  result.mass_kg += cargo_mass;
  return result;
}

const all_zeros_vehicle = Vehicle();

struct Material {
  color: vec3<f32>,
  shininess: f32,
}

struct PointLight {
  position: vec3<f32>,
  intensity: f32,
  material: Material,
}

const default_material = Material(vec3<f32>(1.0, 0.5, 0.0), 32.0);
const light = PointLight(vec3<f32>(0.0, 5.0, -2.0), 1.5, default_material);
const light_shininess = light.material.shininess;

