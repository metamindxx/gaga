<script lang="ts">
  import { Slider as SliderPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils.js';

  interface Props {
    ref?: HTMLElement | null;
    value?: number;
    onValueChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    orientation?: 'horizontal' | 'vertical';
    class?: string;
    disabled?: boolean;
  }

  let {
    ref = $bindable(null)
    , value = $bindable(0)
    , onValueChange
    , min = 0
    , max = 100
    , step = 1
    , orientation = 'horizontal'
    , class: className
    , disabled = false
  }: Props = $props();

  function handleValueChange(newValue: number) {
    if (newValue !== value) {
      value = newValue;
      onValueChange?.(newValue);
    }
  }
</script>

<SliderPrimitive.Root
  bind:ref
  type="single"
  {value}
  onValueChange={handleValueChange}
  {min}
  {max}
  {step}
  {disabled}
  data-slot="slider"
  {orientation}
  class={cn(
    'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col'
    , className
  )}
>
  {#snippet children({ thumbs })}
    <span
      data-orientation={orientation}
      data-slot="slider-track"
      class={cn(
        'bg-primary relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5'
      )}
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        class={cn(
          'bg-muted absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
        )}
      />
    </span>
    {#each thumbs as thumb (thumb)}
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        index={thumb}
        class="border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
      />
    {/each}
  {/snippet}
</SliderPrimitive.Root>
