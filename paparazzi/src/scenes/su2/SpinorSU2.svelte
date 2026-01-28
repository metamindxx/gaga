<!--
  SpinorSU2.svelte - Interactive SU(2) spinor visualization

  Combines SpinorPoints (draggable pt1/pt2) with RotorFlag for visualization.
  
  State is managed by the slide module (slides/spinorSU2/state.svelte.ts).
-->
<script lang="ts">
  import SpinorPoints from './SpinorPoints.svelte';
  import SpinorFlag from '../../geometry/RotorFlag.svelte';
  import { e12, e13, e23, one, pga } from '../../algebra/pga';
  import { config, setPt1, setPt2 } from './spinorState.svelte';

  interface Props {
    color?: number;
  }
  let { color = 0x4c9aff }: Props = $props();

  // Convert spinor (pt1, pt2) to PGA rotor
  // pt1 = (ar, 0, ai) represents alpha = ar + i*ai
  // pt2 = (br, 0, bi) represents beta = br + i*bi
  // Rotor components: scalar=ar, e12=ai (Z-rot), e13=br (Y-rot), e23=bi (X-rot)
  const rotor = $derived.by(() => {
    const [ar, , ai] = pga.pointCoords(config.pt1)!;
    const [br, , bi] = pga.pointCoords(config.pt2)!;

    // === SU(2) spinor to PGA rotor derivation ===
    //
    // The spin rotation matrices (rotsigx, rotsigy, rotsigz) show:
    //   exp(i θ/2 σx) rotates flagpole by θ about x-axis
    //   exp(i θ/2 σy) rotates flagpole by θ about y-axis
    //   exp(i θ/2 σz) rotates flagpole by θ about z-axis
    //
    // A general unitary 2x2 matrix with det=1 has form:
    //   U = [[a, -b*],
    //        [b,  a*]]  with |a|² + |b|² = 1
    //
    // Expanding U = w*I + x*(i σx) + y*(i σy) + z*(i σz):
    //   i σx = [[ 0, i],
    //           [ i, 0]]
    //   i σy = [[ 0, 1],
    //           [-1, 0]]
    //   i σz = [[ i, 0],
    //           [ 0,-i]]
    //
    // Gives: U = [[ w + iz, ix +  y],
    //             [ix -  y,  w - iz]]
    //
    // Matching coefficients with [[a, -b*], [b, a*]]:
    //    a  = w + iz  ->    w = Re(a) = ar,  z =  Im(a) =  ai
    //    b  = ix - y  ->    x = Im(b) = bi,  y = -Re(b) = -br
    //   -b* = ix + y  ->    (consistent)
    //    a* = w - iz  ->    (consistent)
    //
    // As PGA bivector:
    //   i σx <-> e23  (rotation about x)
    //   i σy <-> e31  (rotation about y), and e31 = -e13
    //   i σz <-> e12  (rotation about z)
    //
    // Final rotor: R = w + x*e23 + y*e31 + z*e12
    //                = ar + bi*e23 + (-br)*e31 + ai*e12
    //                = ar + bi*e23 + br*e13 + ai*e12
    return one
      .smul(ar)
      .add(e23.smul(bi)) // X-axis rotation component
      .add(e13.smul(br)) // Y-axis rotation component
      .add(e12.smul(ai)); // Z-axis rotation component
  });
</script>

<SpinorPoints pt1={config.pt1} pt2={config.pt2} onPt1Change={setPt1} onPt2Change={setPt2} {color} />
<SpinorFlag {rotor} {color} />
