// A compile-time constant expression (evaluated at shader module creation)
const DEFAULT_MULTIPLIER = 2u;

// A pipeline-overridable constant (evaluated at pipeline creation)
// Feel free to edit this default value and click "Run" to see the output update!
@id(101) override WORKGROUP_WIDTH: u32 = 16u;

// This override-expression uses both a const-expression and an override variable.
// It is evaluated during pipeline creation, once WORKGROUP_WIDTH is finalized.
override TOTAL_CACHE_SIZE: u32 = WORKGROUP_WIDTH * DEFAULT_MULTIPLIER;

// Sizing workgroup variables is the primary use-case for override-expressions.
// The array length is resolved at pipeline creation time.
var<workgroup> shared_cache: array<f32, TOTAL_CACHE_SIZE>;

@compute @workgroup_size(16)
fn compute_main(
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    // We can use the override constants inside our shader code as well
    if (local_id.x < TOTAL_CACHE_SIZE) {
        shared_cache[local_id.x] = 0.0;
    }
}
