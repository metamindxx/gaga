<script lang="ts">
  import { useTask } from '@threlte/core';
  import { e0, e1, e2, e13 } from '../algebra/pga';
  import RenderMv from '../geometry/RenderMv.svelte';
  import type { Multivector } from '../algebra/types';
  import { interactivity } from '@threlte/extras';

  interactivity();

  // shortcuts
  const { PI, sin } = Math;
  function translate(line: Multivector, dist: number) {
    return e0
      .smul(-0.5 * dist)
      .gp(line.normalize())
      .gp(e0.dual())
      .exp(1);
  }

  interface SpiderLegType {
    segmentCount: number;
    segmentLength: number;
    stride: number;
    start: number;
    animTime: number;
    points: Multivector[];
    lines: Multivector[][];
    step?: Multivector;
    lstep?: Multivector;
    solve: (base: Multivector, target: Multivector, locked?: boolean) => void;
  }
  // spiderLeg
  function SpiderLeg(this: SpiderLegType) {
    this.segmentCount = 4;
    this.segmentLength = 0.2;
    this.stride = 0.1;
    // animation start and duration
    this.start = 0;
    this.animTime = 0.2;
    this.points = [...Array(this.segmentCount + 1)].map((x, i) =>
      e0.add(e1.smul(i * this.segmentLength)).dual()
    );
    this.lines = this.points.map((x, i, a) => [x, a[i + 1]]).slice(0, 3);
  }

  function lerp(a: Multivector, b: Multivector, t: number) {
    return a.smul(1 - t).add(b.smul(t));
  }

  SpiderLeg.prototype.solve = function (base: Multivector, target: Multivector, locked = false) {
    const c = this.points
      , l = this.segmentLength
      , n = this.segmentCount;
    // initialize values on first run
    if (this.step == undefined || this.lstep == undefined) {
      this.step = target;
      this.lstep = target;
    }
    // update target step if far enough away and not locked
    const targetDist = this.step.join(target).inorm(); // todo: check norm is distance
    if (targetDist > this.stride && locked == false) {
      this.lstep = this.step;
      this.step = target;
      this.start = performance.now() / 1000;
    }
    // lerp towards target step
    var time = performance.now() / 1000 - this.start;
    if (time < this.animTime) {
      time /= this.animTime;
      c[n] = lerp(this.lstep, this.step, time).add(e2.smul(0.1 * sin(time * PI)));
    } else {
      c[n] = this.step;
      this.start = 0;
    }
    // solve IK
    // backward pass - move each joint towards the target
    c[0] = base;
    c[n - 1] = c[n];
    for (let i = n - 2; i >= 0; --i) c[i] = translate(c[i].join(c[i + 1]), -l).sandwich(c[i + 1]);
    // constraint pass - force each joint into vertical plane
    // var plane = (c[0] & c[4]) | 1e2;
    const plane = c[0].join(c[4]).dot(e2);
    for (let i = 1; i < n; ++i) c[i] = c[i].projectOnto(plane);
    // set knee to slightly behind foot
    let line = lerp(c[0], c[4], 0.9).gp(e2);
    c[2] = c[2].projectOnto(line);
    // forward pass - move each joint towards the base
    c[0] = base;
    for (let i = 1; i < n; ++i) c[i] = translate(c[i - 1].join(c[i]), l).sandwich(c[i - 1]);
    // select only grade 3 elements
    this.points = c.map((pt) => pt.selectGrade(3));
  };

  // create test setup
  // Original: (E ** (((i / 10) * PI + PI / 4) * 1e13)) >>> !(1e0 - 1e2 + 0.3e1)
  let startingPoints = [...Array(10)]
    .map((x, i) => e13.exp((i / 10) * PI + PI / 4).sandwich(e0.sub(e2).add(e1.smul(0.3)).dual()))
    .slice(1);
  startingPoints.splice(4, 1);
  let base = startingPoints
    .reduce((sum, point) => sum.add(point.smul(1 / 8)), e2.smul(0.2).dual())
    .selectGrade(3);
  let legs: SpiderLegType[] = startingPoints.map(() => new SpiderLeg());

  // reactive state
  let body = $state.raw(base);
  let legLines = $state.raw(legs.map((leg) => leg.points));

  // animations
  const motor = e0.add(e1).dual().join(e0.add(e1).add(e2).dual()).motor();
  const start = performance.now();

  let rendering = false;
  function render() {
    // return
    // skip frames while still calculating last frame
    if (rendering) return;
    rendering = true;

    const t = (performance.now() - start) / 8000;
    const m = motor(t);
    // const m = e0.add(e1).dual().join(e0.add(e1).add(e2).dual()).exp(t);
    // console.log(m.toStr());
    legs.forEach((leg, i) => {
      const locked = legs[(i + 7) % 8].start + legs[(i + 1) % 8].start;
      leg.solve(base, m.sandwich(startingPoints[i]), !!locked);
    });
    // base = m.sandwich(base); // test
    base = legs.reduce((sum, leg) => sum.add(leg.points[4].smul(1 / 8)), e2.smul(0.2).dual());
    body = base.selectGrade(3);
    // console.group('Spidor Frame');
    // console.log('Body: ' + body.toStr());
    // legs.forEach((leg, i) => {
    //   console.log(` Leg ${i} end: ` + leg.points[4].toStr());
    // });
    // console.groupEnd();
    legLines = legs.map((leg) => leg.points);
    setTimeout(() => (rendering = false), 0);
  }
  useTask(() => {
    if (!rendering) render();
  });
</script>

<RenderMv mv={body} color={0x666666} />
{#each legLines as leg}
  {#each leg as joint}
    <RenderMv mv={joint} color={0x999999} />
  {/each}
  <RenderMv mv={leg} color={0x333333} />
{/each}
