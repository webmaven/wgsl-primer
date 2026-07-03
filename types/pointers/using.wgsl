/*
 * Copyright ©2026 Michael R. Bernstein. All new modifications licensed under Apache 2.0.
 * Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
 */

fn f() {
  var x: f32 = 1.5;
  let px = &x;  // Get a pointer to x
  *px = 3.0;    // Update x through px.
  // Now x is 3.0
}


var<private> age: f32;

fn happy_birthday() {
  let age_ptr = &age;       // Get a pointer.
  *age_ptr = *age_ptr + 1;  // Updates 'age'
}

fn run_main() {
  age = 18.0;
  happy_birthday();
  // Now age is 19.0
}

fn run_test_age() -> f32 {
  run_main();
  return age;
}

