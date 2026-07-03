/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

// Declare compile-time constants
const my_constant = 4i;
const angle_deg = 30.0f;

// Compile-time evaluation using @const annotated built-in function radians()
const angle_rad = radians(angle_deg);

// Compile-time boolean evaluation
const is_even = (my_constant % 2i) == 0i;

// Compile-time assertion: shader fails compilation if this is false
const_assert (my_constant & 1i) == 0i;
