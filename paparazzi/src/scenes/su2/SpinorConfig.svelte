<script lang="ts">
  /**
   * Spinor SU(2) Config Panel
   *
   * Multiple synchronized rotation representations with two-way bindings.
   * All representations update each other when any one changes.
   */

  import { Slider } from '$lib/components/ui/slider';
  import {
    config
    , formatSpinorPoint
    , euler
    , quaternion
    , doubleComplex
    , axisAngle
    , rotorComponents
    , alphaColor
    , betaColor
    , setYaw
    , setPitch
    , setRoll
    , setQuaternionW
    , setQuaternionX
    , setQuaternionY
    , setQuaternionZ
    , setDoubleComplexA
    , setDoubleComplexB
    , setDoubleComplexC
    , setDoubleComplexD
    , setRotorS
    , setRotorE12
    , setRotorE31
    , setRotorE23
    , setAxisX
    , setAxisY
    , setAxisZ
    , setAngle
    , resetRotation
    , negateSpinor
    , lockRadius
    , lockAngle
    , toggleLockRadius
    , toggleLockAngle
    , ghostEnabled
    , ghostDuration
    , toggleGhost
    , setGhostDuration
  } from './spinorState.svelte';

  const PI = Math.PI;
  const toDeg = (r: number) => (r * 180) / PI;
  const toRad = (d: number) => (d * PI) / 180;

  // Convert hex number to CSS color string
  const hexToCSS = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;

  // Track which slider (if any) the user is actively dragging
  // Only process onValueChange when this is set
  let activeSlider = $state<string | null>(null);

  function startDrag(id: string) {
    activeSlider = id;
  }
  function endDrag() {
    activeSlider = null;
  }

  // Guarded setters - only update state if this slider is being dragged
  function guardedSetYaw(v: number) {
    if (activeSlider === 'yaw') setYaw(toRad(v));
  }
  function guardedSetPitch(v: number) {
    if (activeSlider === 'pitch') setPitch(toRad(v));
  }
  function guardedSetRoll(v: number) {
    if (activeSlider === 'roll') setRoll(toRad(v));
  }
  function guardedSetQW(v: number) {
    if (activeSlider === 'qw') setQuaternionW(v);
  }
  function guardedSetQX(v: number) {
    if (activeSlider === 'qx') setQuaternionX(v);
  }
  function guardedSetQY(v: number) {
    if (activeSlider === 'qy') setQuaternionY(v);
  }
  function guardedSetQZ(v: number) {
    if (activeSlider === 'qz') setQuaternionZ(v);
  }
  function guardedSetDCA(v: number) {
    if (activeSlider === 'dca') setDoubleComplexA(v);
  }
  function guardedSetDCB(v: number) {
    if (activeSlider === 'dcb') setDoubleComplexB(v);
  }
  function guardedSetDCC(v: number) {
    if (activeSlider === 'dcc') setDoubleComplexC(v);
  }
  function guardedSetDCD(v: number) {
    if (activeSlider === 'dcd') setDoubleComplexD(v);
  }
  function guardedSetRotorS(v: number) {
    if (activeSlider === 'rotorS') setRotorS(v);
  }
  function guardedSetRotorE12(v: number) {
    if (activeSlider === 'rotorE12') setRotorE12(v);
  }
  function guardedSetRotorE31(v: number) {
    if (activeSlider === 'rotorE31') setRotorE31(v);
  }
  function guardedSetRotorE23(v: number) {
    if (activeSlider === 'rotorE23') setRotorE23(v);
  }
  function guardedSetAxisX(v: number) {
    if (activeSlider === 'axisX') setAxisX(v);
  }
  function guardedSetAxisY(v: number) {
    if (activeSlider === 'axisY') setAxisY(v);
  }
  function guardedSetAxisZ(v: number) {
    if (activeSlider === 'axisZ') setAxisZ(v);
  }
  function guardedSetAngle(v: number) {
    if (activeSlider === 'angle') setAngle(toRad(v));
  }

  // Handle direct input editing
  function handleInput(setter: (v: number) => void, transform?: (v: number) => number) {
    return (e: Event) => {
      const input = e.target as HTMLInputElement;
      const v = parseFloat(input.value);
      if (!isNaN(v)) {
        setter(transform ? transform(v) : v);
      }
    };
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }

  const inputClass =
    'w-14 px-1 py-0.5 text-right font-mono text-green-300 bg-black/30 border border-sky-400/30 rounded text-xs focus:outline-none focus:border-sky-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
</script>

<!-- Release drag on pointer up anywhere -->
<svelte:window onpointerup={endDrag} />

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md space-y-3">
  <legend class="text-xs text-sky-400 px-1">Spinor SU(2)</legend>

  <!-- Lock controls (for drag points only) -->
  <div class="space-y-1.5">
    <p class="text-[10px] text-gray-400 leading-tight">
      These locks only affect dragging the α/β points in the 3D view. Sliders always update all
      values.
    </p>
    <div class="flex gap-2">
      <button
        onclick={toggleLockRadius}
        class="flex-1 px-2 py-1 text-xs rounded transition-colors {lockRadius.value
          ? 'bg-amber-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        title="Lock radii (drag only changes angles)"
      >
        {lockRadius.value ? '🔒' : '🔓'} Radius
      </button>
      <button
        onclick={toggleLockAngle}
        class="flex-1 px-2 py-1 text-xs rounded transition-colors {lockAngle.value
          ? 'bg-amber-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        title="Lock angles (drag only changes radii)"
      >
        {lockAngle.value ? '🔒' : '🔓'} Angle
      </button>
    </div>
  </div>

  <!-- Ghost animation controls -->
  <div class="flex items-center gap-2">
    <button
      onclick={toggleGhost}
      class="px-2 py-1 text-xs rounded transition-colors {ghostEnabled.value
        ? 'bg-sky-600 text-white'
        : 'bg-gray-700 text-gray-400'}"
      title="Toggle ghost animation"
    >
      {ghostEnabled.value ? '👻' : '👁️‍🗨️'}
    </button>
    <div class="flex-1">
      <Slider
        value={ghostDuration.value}
        onValueChange={setGhostDuration}
        min={100}
        max={5000}
        step={100}
        disabled={!ghostEnabled.value}
      />
    </div>
    <span class="text-xs text-gray-400 w-10 text-right"
      >{(ghostDuration.value / 1000).toFixed(1)}s</span
    >
  </div>

  <!-- Spinor point display -->
  <div class="p-1.5 bg-black/30 rounded text-xs font-mono space-y-1">
    <div class="flex items-center gap-2">
      <span
        class="inline-block w-2 h-2 rounded-sm"
        style="background-color: {hexToCSS(alphaColor.value)}"
      ></span>
      <span class="text-gray-400">α:</span>
      <span class="text-green-300 flex-1">{formatSpinorPoint(config.pt1)}</span>
    </div>
    <div class="flex items-center gap-2">
      <span
        class="inline-block w-2 h-2 rounded-sm"
        style="background-color: {hexToCSS(betaColor.value)}"
      ></span>
      <span class="text-gray-400">β:</span>
      <span class="text-green-300 flex-1">{formatSpinorPoint(config.pt2)}</span>
    </div>
  </div>

  <!-- Negate/Reset (top) -->
  <div class="flex gap-2">
    <button
      onclick={negateSpinor}
      class="flex-1 px-2 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors"
    >
      Negate
    </button>
    <button
      onclick={resetRotation}
      class="flex-1 px-2 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors"
    >
      Reset
    </button>
  </div>

  <!-- Euler Angles -->
  <div class="border-t border-sky-400/30 pt-2">
    <div class="text-xs text-sky-300 mb-1.5">Euler Angles (ZYX)</div>
    <div class="space-y-1">
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-8 text-gray-400">Yaw</span>
        <div class="flex-1" onpointerdown={() => startDrag('yaw')}>
          <Slider
            value={toDeg(euler.value.yaw)}
            onValueChange={guardedSetYaw}
            min={-180}
            max={180}
            step={1}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={toDeg(euler.value.yaw).toFixed(1)}
          onchange={handleInput(setYaw, toRad)}
          onkeydown={handleKeydown}
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-8 text-gray-400">Pitch</span>
        <div class="flex-1" onpointerdown={() => startDrag('pitch')}>
          <Slider
            value={toDeg(euler.value.pitch)}
            onValueChange={guardedSetPitch}
            min={-90}
            max={90}
            step={1}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={toDeg(euler.value.pitch).toFixed(1)}
          onchange={handleInput(setPitch, toRad)}
          onkeydown={handleKeydown}
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-8 text-gray-400">Roll</span>
        <div class="flex-1" onpointerdown={() => startDrag('roll')}>
          <Slider
            value={toDeg(euler.value.roll)}
            onValueChange={guardedSetRoll}
            min={-180}
            max={180}
            step={1}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={toDeg(euler.value.roll).toFixed(1)}
          onchange={handleInput(setRoll, toRad)}
          onkeydown={handleKeydown}
        />
      </div>
    </div>
  </div>

  <!-- Quaternion -->
  <div class="border-t border-sky-400/30 pt-2">
    <div class="text-xs text-sky-300 mb-1.5">Quaternion (w + xi + yj + zk)</div>
    <div class="space-y-1">
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">w</span>
        <div class="flex-1" onpointerdown={() => startDrag('qw')}>
          <Slider
            value={quaternion.value.w}
            onValueChange={guardedSetQW}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={quaternion.value.w.toFixed(3)}
          onchange={handleInput(setQuaternionW)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">x</span>
        <div class="flex-1" onpointerdown={() => startDrag('qx')}>
          <Slider
            value={quaternion.value.x}
            onValueChange={guardedSetQX}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={quaternion.value.x.toFixed(3)}
          onchange={handleInput(setQuaternionX)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">y</span>
        <div class="flex-1" onpointerdown={() => startDrag('qy')}>
          <Slider
            value={quaternion.value.y}
            onValueChange={guardedSetQY}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={quaternion.value.y.toFixed(3)}
          onchange={handleInput(setQuaternionY)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">z</span>
        <div class="flex-1" onpointerdown={() => startDrag('qz')}>
          <Slider
            value={quaternion.value.z}
            onValueChange={guardedSetQZ}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={quaternion.value.z.toFixed(3)}
          onchange={handleInput(setQuaternionZ)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
    </div>
  </div>

  <!-- Double Complex (SU(2) as C²) -->
  <div class="border-t border-sky-400/30 pt-2">
    <div class="text-xs text-sky-300 mb-1.5 flex items-center gap-2">
      <span>SU(2) as ℂ²</span>
    </div>
    <div class="space-y-1">
      <!-- α components (a, b) with color indicator -->
      <div class="flex items-center gap-1 text-xs mb-0.5">
        <span
          class="inline-block w-2 h-2 rounded-sm"
          style="background-color: {hexToCSS(alphaColor.value)}"
        ></span>
        <span class="text-gray-500 text-[10px]">α (pole)</span>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">Re(α)</span>
        <div class="flex-1" onpointerdown={() => startDrag('dca')}>
          <Slider
            value={doubleComplex.value.a}
            onValueChange={guardedSetDCA}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={doubleComplex.value.a.toFixed(3)}
          onchange={handleInput(setDoubleComplexA)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">Im(α)</span>
        <div class="flex-1" onpointerdown={() => startDrag('dcb')}>
          <Slider
            value={doubleComplex.value.b}
            onValueChange={guardedSetDCB}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={doubleComplex.value.b.toFixed(3)}
          onchange={handleInput(setDoubleComplexB)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <!-- β components (c, d) with color indicator -->
      <div class="flex items-center gap-1 text-xs mt-2 mb-0.5">
        <span
          class="inline-block w-2 h-2 rounded-sm"
          style="background-color: {hexToCSS(betaColor.value)}"
        ></span>
        <span class="text-gray-500 text-[10px]">β (fabric)</span>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">Re(β)</span>
        <div class="flex-1" onpointerdown={() => startDrag('dcc')}>
          <Slider
            value={doubleComplex.value.c}
            onValueChange={guardedSetDCC}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={doubleComplex.value.c.toFixed(3)}
          onchange={handleInput(setDoubleComplexC)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">Im(β)</span>
        <div class="flex-1" onpointerdown={() => startDrag('dcd')}>
          <Slider
            value={doubleComplex.value.d}
            onValueChange={guardedSetDCD}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={doubleComplex.value.d.toFixed(3)}
          onchange={handleInput(setDoubleComplexD)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
    </div>
  </div>

  <!-- PGA Rotor -->
  <div class="border-t border-sky-400/30 pt-2">
    <div class="text-xs text-sky-300 mb-1.5">PGA Rotor (s + e₁₂ + e₃₁ + e₂₃)</div>
    <div class="space-y-1">
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">s</span>
        <div class="flex-1" onpointerdown={() => startDrag('rotorS')}>
          <Slider
            value={rotorComponents.value.s}
            onValueChange={guardedSetRotorS}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={rotorComponents.value.s.toFixed(3)}
          onchange={handleInput(setRotorS)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">e₁₂</span>
        <div class="flex-1" onpointerdown={() => startDrag('rotorE12')}>
          <Slider
            value={rotorComponents.value.e12}
            onValueChange={guardedSetRotorE12}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={rotorComponents.value.e12.toFixed(3)}
          onchange={handleInput(setRotorE12)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">e₃₁</span>
        <div class="flex-1" onpointerdown={() => startDrag('rotorE31')}>
          <Slider
            value={rotorComponents.value.e31}
            onValueChange={guardedSetRotorE31}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={rotorComponents.value.e31.toFixed(3)}
          onchange={handleInput(setRotorE31)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">e₂₃</span>
        <div class="flex-1" onpointerdown={() => startDrag('rotorE23')}>
          <Slider
            value={rotorComponents.value.e23}
            onValueChange={guardedSetRotorE23}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={rotorComponents.value.e23.toFixed(3)}
          onchange={handleInput(setRotorE23)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
    </div>
  </div>

  <!-- Axis-Angle -->
  <div class="border-t border-sky-400/30 pt-2">
    <div class="text-xs text-sky-300 mb-1.5">Axis-Angle</div>
    <div class="space-y-1">
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">x</span>
        <div class="flex-1" onpointerdown={() => startDrag('axisX')}>
          <Slider
            value={axisAngle.value.axis[0]}
            onValueChange={guardedSetAxisX}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={axisAngle.value.axis[0].toFixed(3)}
          onchange={handleInput(setAxisX)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">y</span>
        <div class="flex-1" onpointerdown={() => startDrag('axisY')}>
          <Slider
            value={axisAngle.value.axis[1]}
            onValueChange={guardedSetAxisY}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={axisAngle.value.axis[1].toFixed(3)}
          onchange={handleInput(setAxisY)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">z</span>
        <div class="flex-1" onpointerdown={() => startDrag('axisZ')}>
          <Slider
            value={axisAngle.value.axis[2]}
            onValueChange={guardedSetAxisZ}
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={axisAngle.value.axis[2].toFixed(3)}
          onchange={handleInput(setAxisZ)}
          onkeydown={handleKeydown}
          step="0.01"
        />
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="min-w-6 text-gray-400">θ</span>
        <div class="flex-1" onpointerdown={() => startDrag('angle')}>
          <Slider
            value={toDeg(axisAngle.value.angle)}
            onValueChange={guardedSetAngle}
            min={0}
            max={360}
            step={1}
          />
        </div>
        <input
          type="number"
          class={inputClass}
          value={toDeg(axisAngle.value.angle).toFixed(1)}
          onchange={handleInput(setAngle, toRad)}
          onkeydown={handleKeydown}
        />
      </div>
    </div>
  </div>

  <div class="border-t border-sky-400/30 pt-2 flex gap-2">
    <button
      onclick={negateSpinor}
      class="flex-1 px-2 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors"
    >
      Negate
    </button>
    <button
      onclick={resetRotation}
      class="flex-1 px-2 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors"
    >
      Reset
    </button>
  </div>
</fieldset>
