/*
 * Copyright ©2026 Michael R. Bernstein. All new modifications licensed under Apache 2.0.
 * Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
 */

fn while_loop() -> u32 {
  var counter: u32 = 0;

  while counter < 5 {    
    // Increment the counter
    counter = counter + 1;
  }

  return counter;
}

