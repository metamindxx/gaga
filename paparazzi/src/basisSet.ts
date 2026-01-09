/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @stylistic/comma-style */

// basis lists & operations
/*********************
 ** basisSet
 *********************/

// NOTE:
// This file is a TypeScript port of the legacy `basisSet.js` implementation.
// The runtime behavior is intentionally kept the same (including some quirks),
// but we add types to make it usable from the rest of the TS codebase.

import type { GeoPrimitive } from './primitives';

function stripUnderscores(id: string): string {
  return id.replace(/_/g, '');
}

function isEffectivelyZero(value: number, epsilon = 1e-4): boolean {
  return Math.abs(value) <= epsilon;
}

export interface Basis {
  id: string;
  sq: number;
  idStr: string;
  vecStr: string;
  vectorIdxs: number[];
  bsIdx: number;
  grade: number;
  dual?: Blade;
  idxNum?: number;
}

export interface Blade {
  mul: number;
  basis: Basis;
  smul(scale: number): void;
  copy(): Blade;
  s(): string;
  html(): string;
  unDualMul?: number;
}

export interface GpOptions {
  log?: boolean;
}

export interface CayleyHtmlOptions {
  order?: string[];
}

export interface MultiVectorRenderOptions {
  color?: number;
  size?: number;
  renderComponents?: boolean;
  [key: string]: unknown;
}

export interface MultiVectorDefinition {
  [bladeId: string]: number;
}

// This is a dynamic object with many methods attached at runtime.
// We model the parts used by the rest of the app, but allow extra keys.
export interface MultiVector {
  isA: 'mv';
  bs: BasisSet;
  gradeStored: number | string;
  opt: Record<string, unknown>;
  blades: Blade[];
  bladeIdx: Record<string, Blade>;
  components?: MultiVector[];
  renderStuff?: Record<string, unknown> | null;
  id?: string;

  pushBlade(blade: Blade): void;
  toStr(label?: string): string;
  strLog(label?: string): MultiVector;
  grade(refresh?: boolean): number | string;
  getGrades(): Set<number>;
  bl(basisId: string): Blade | undefined;
  bVal(basisId: string): number;
  basisSVal(basisId: string): number;
  isZero(epsilon?: number): boolean;

  gp(other: MultiVector): MultiVector;
  cross(other: MultiVector): MultiVector;
  op(other: MultiVector): MultiVector;
  dot(other: MultiVector): MultiVector;
  lDot(other: MultiVector): MultiVector;
  rDot(other: MultiVector): MultiVector;
  projectOnto(other: MultiVector): MultiVector;
  join(other: MultiVector): MultiVector;
  sandwich(other: MultiVector): MultiVector;
  selectGrade(grade: number): MultiVector;

  reverse(): MultiVector;
  involute(): MultiVector;
  conjugate(): MultiVector;

  render(options?: MultiVectorRenderOptions): MultiVector;
  move(rotor: MultiVector, target?: MultiVector): MultiVector;

  dual(): MultiVector;
  unDual(): MultiVector;
  onClick(event: Event): void;
  classify(): GeoPrimitive | null;

  scalarProduct(rhs: MultiVector): number;
  sq(): number;
  normSq(): number;
  norm(): number;
  inorm(): number;
  normalize(): MultiVector;
  inverse(): MultiVector;
  rotorSqrt(): MultiVector;

  exp(alpha: number): MultiVector;
  eexp(alpha: number): MultiVector;
  motor(): (alpha: number) => MultiVector;

  add(mv: MultiVector): MultiVector;
  sub(mv: MultiVector): MultiVector;
  sadd(scalar: number): MultiVector;
  smul(scalar: number): MultiVector;

  copy(): MultiVector;
  updateCopy(copyFrom: MultiVector): void;
  copyComponents(source: MultiVector): void;

  [key: string]: any;
}

export interface BasisSet {
  isA: 'basisSet';
  bases: Basis[];
  basisIdx: Record<string, number>;
  basisById: Record<string, Basis>;
  grades: Basis[][];
  cayley: Blade[][];
  gradeOrder: Basis[] | null;
  interpretation: any;

  // Commonly used basis shortcuts (these are Basis objects, not MultiVectors)
  e?: Basis;

  addBasis(id: string, sq: number): void;
  createBasis(baseBasis: Basis, template: Basis): void;
  renderHtml(options?: { order?: 'creation' }): string;
  basisSet_basis(id: string, sq: number, idStr: string): Basis;
  gpBlades(blade1: Blade, blade2: Blade, options?: GpOptions): Blade;
  newBlade(multiplier: number, basis: Basis): Blade;
  createCayley(symmetricDual?: boolean): void;
  setDual(basis: Basis, dualBasis: Basis, sign: number): void;
  cayleyHtml(options?: CayleyHtmlOptions): string;
  multiVector(definition?: string | MultiVectorDefinition): MultiVector;

  // The implementation adds many ad-hoc properties (e.g. bs.e12, bs.e123pm)
  // keyed by basis id with underscores stripped.
  [key: string]: any;
}

export function createBasisSet(p?: number, q?: number, r?: number): BasisSet {
  // NOT PURE: constructs/mutates an internal `bs` object graph (bases, indexes, tables) before returning it.
  // (Does not mutate inputs `p/q/r`, but is not side-effect-free in an FP sense.)
  // ignore unused variables 'p', 'q', 'r' for now
  void p;
  void q;
  void r;

  const bs: BasisSet = {
    // basis: e0, e1, e2, ex, ey, ez, et
    // - have a basis.sq value of +1, -1, 0
    isA: 'basisSet',
    bases: [],
    basisIdx: {},
    basisById: {},
    grades: [[]], // an array of the grades. Initiate grades[0] with []
    cayley: [],
    gradeOrder: null, // index of blades ordered by grade
    interpretation: null, // eg. pga, cga

    addBasis,
    createBasis,
    renderHtml,
    basisSet_basis,
    gpBlades,
    newBlade,
    createCayley,
    setDual,
    cayleyHtml,
    multiVector
  };

  // eg adding e2 will also add e12
  function addBasis(id: string, sq: number) {
    // NOT PURE: mutates external state (`bs`): adds derived bases via `createBasis` and also mutates existing bases' `idStr`.
    const that = bs;
    const bases = bs.bases;
    const numBases = bs.bases.length;

    // create new basis eg e2
    const newBasisVectorTemplate = bs.basisSet_basis(id, sq, bases[0].idStr + id);

    // what's the new grade?
    for (let b = 0; b < numBases; ++b) {
      // create a new blade for each blade existing eg e12
      // the actual vector (the one that gets added to the set) is a child of the scalar and the vectorTemplate
      that.createBasis(bases[b], newBasisVectorTemplate);
      that.bases[b].idStr += '.';
    }

    // add it to the indexes
    // newB.idxNum = bases.length
    // that.basisIdx[id] = newB.idxNum
    // that.bases.push(newB)
    // that.bladeByIdx[id] = newB
  }

  // eg create e23,
  function createBasis(baseBasis: Basis, newBasisVectorTemplate: Basis) {
    // NOT PURE: mutates external state (`bs`): bases array, grades buckets, id maps, and ad-hoc `bs[stripUnderscores(id)]`.
    const that = bs;

    // bs.basisSet_basis = function (id, sq, idStr) {
    const newBasis = bs.basisSet_basis(
      baseBasis.id + newBasisVectorTemplate.id,
      newBasisVectorTemplate.sq,
      baseBasis.idStr + newBasisVectorTemplate.id
    );

    // add it to the indexes
    (newBasis as any).idxNum = that.bases.length;
    // NOTE: legacy behavior preserved (seems like a bug: uses literal 'id')
    that.basisIdx['id'] = (newBasis as any).idxNum;
    newBasis.bsIdx = that.bases.length;
    // that.bases.push(newBasis)
    that.bases[newBasis.bsIdx] = newBasis;
    that.basisById[newBasis.id] = newBasis;

    // 2024-04-24 - put the bases straight into the bs
    that[stripUnderscores(newBasis.id)] = newBasis;

    if (!that.grades[newBasis.grade]) {
      that.grades[newBasis.grade] = [];
    }
    that.grades[newBasis.grade].push(newBasis);
  }

  function renderHtml(options?: { order?: 'creation' }) {
    const that = bs;
    let b: Basis;
    const s: string[] = [];

    // print in order of creation
    if (options && options.order == 'creation') {
      for (let i = 0; i < that.bases.length; ++i) {
        b = that.bases[i];
        s.push(b.id + ': ' + b.idStr);
      }
      // print in grade order
    } else {
      for (let g = 0; g < that.grades.length; ++g) {
        for (let i = 0; i < that.grades[g].length; ++i) {
          b = that.grades[g][i];
          s.push(b.id + ': ' + b.idStr + ' :' + b.vectorIdxs.join(''));
        }
      }
    }

    return s.join('<br />');
  }

  // create the basis
  function basisSet_basis(id: string, sq: number, idStr: string): Basis {
    const b: Basis = {
      id: id, // "e_13"
      sq: sq, // -1
      idStr: idStr, // ".1.3."
      vecStr: idStr.replace(/\./g, ''), // "13"
      vectorIdxs: [], // [1,3]
      bsIdx: 0, // what is my index in bs.bases (which keys into the cayley table)
      grade: 0
    };
    b.grade = b.vecStr.length; // 2

    let vecBit: string;
    for (let i = 0; i < idStr.length; ++i) {
      vecBit = idStr.substr(i, 1);
      if (vecBit != '.') b.vectorIdxs.push(i);
    }

    return b;
  }

  // eg adding e2 will also add e12
  function gpBlades(blade1: Blade, blade2: Blade, options?: GpOptions): Blade {
    // NOT PURE (conditional): if `options?.log` is true, logs to console.
    const b1 = blade1.basis;
    const b2 = blade2.basis;

    // have we already worked this out?
    if (bs.cayley[b1.bsIdx] && bs.cayley[b1.bsIdx][b2.bsIdx]) {
      const resultBlade = bs.cayley[b1.bsIdx][b2.bsIdx];
      const result = bs.newBlade(resultBlade.mul * blade1.mul * blade2.mul, resultBlade.basis);
      if (options && options.log) {
        console.log('bs.gpBlades: ' + blade1.s() + ' * ' + blade2.s() + ' = ' + result.s());
      }
      return result;
    }

    // start with left vector of right blade and move it across vectors of left blade from right to left
    let b2Idx: number;
    let b1Idx: number;
    let j: number;
    let moveB1On: boolean;
    let sign = 1;
    let iB1CopyStart = 0;
    let newBladeVectors = '';
    let newBasisId = bs.bases[0].id; // the root of the new id will be the scalar basis id
    for (let i2 = 0; i2 < b2.vectorIdxs.length; ++i2) {
      b2Idx = b2.vectorIdxs[i2];
      moveB1On = false;

      // do we have any more b1 vectors?
      if (iB1CopyStart < b1.vectorIdxs.length) {
        // move from right to left of basis 1
        for (let i1 = b1.vectorIdxs.length - 1; i1 >= iB1CopyStart && !moveB1On; --i1) {
          b1Idx = b1.vectorIdxs[i1];

          // move b2 across b1 vector
          if (b1Idx > b2Idx) {
            sign *= -1;

            // if we have got to the begining of b1, copy the b2 vector
            if (i1 == iB1CopyStart) {
              newBladeVectors = newBladeVectors + b2Idx;
              newBasisId = newBasisId + bs.grades[1][b2Idx].vecStr;
            }
          } else {
            // copy over the b1 indexes up to this point
            for (j = iB1CopyStart; j < i1; ++j) {
              newBladeVectors = newBladeVectors + b1.vectorIdxs[j];
              newBasisId = newBasisId + bs.grades[1][b1.vectorIdxs[j]].vecStr;
              iB1CopyStart += 1;
            }

            // vector match -> contract
            if (b1Idx == b2Idx) {
              sign *= bs.grades[1][b1Idx].sq; // contract the match
              iB1CopyStart += 1;

              // the b2 vector has moved from the right of b1 and found a lower index in b1.
              // copy over the b1 vector then the b2 vector
            } else {
              // (b1Idx < b2Idx) {
              newBladeVectors = newBladeVectors + b1Idx;
              newBasisId = newBasisId + bs.grades[1][b1Idx].vecStr;
              newBladeVectors = newBladeVectors + b2Idx;
              newBasisId = newBasisId + bs.grades[1][b2Idx].vecStr;
              iB1CopyStart += 1;
            }

            moveB1On = true;
          }
        }

        // we have run out of b1 vectors. copy over the b2 vector
      } else {
        newBladeVectors = newBladeVectors + b2Idx;
        newBasisId = newBasisId + bs.grades[1][b2Idx].vecStr;
      }
    }

    // copy over any unused b1 vectors
    for (let i1 = iB1CopyStart; i1 < b1.vectorIdxs.length; ++i1) {
      newBladeVectors = newBladeVectors + b1.vectorIdxs[i1];
      newBasisId = newBasisId + bs.grades[1][b1.vectorIdxs[i1]].vecStr;
    }

    const newBlade = bs.newBlade(sign * blade1.mul * blade2.mul, bs.basisById[newBasisId]);
    if (options && options.log) {
      console.log(
        'bs.gpBlades: ' +
          b1.id +
          ' * ' +
          b2.id +
          ' = ' +
          sign +
          bs.bases[0].id +
          newBladeVectors +
          ' or ' +
          newBlade.s()
      );
    }
    return newBlade;
  }

  function newBlade(mul: number, bss: Basis): Blade {
    // multivector-sub_blade eg -5 e23
    const bl: Blade = {
      mul: mul, // - the multiplier
      basis: bss, // - the basis
      smul(scale: number) {
        // NOT PURE: mutates the receiver blade (`this.mul`).
        this.mul *= scale;
      },
      copy() {
        return bs.newBlade(this.mul, this.basis);
      },
      s() {
        return '' + this.mul + ' ' + this.basis.id;
      },
      html() {
        let sign = this.mul < 0 ? 'neg">-' : 'pos">+';
        if (this.mul == 0) {
          sign = 'zro">&nbsp;';
        }
        return (
          '<span class="blade_' +
          sign +
          Math.abs(this.mul) +
          '&nbsp;' +
          bs.bases[0].id +
          this.basis.idStr +
          '</span>'
        );
      }
    };
    return bl;
  }

  function createCayley(symmetricDual?: boolean) {
    // NOT PURE: mutates external state (`bs.cayley`, `bs.gradeOrder`) and mutates basis dual links (`basis.dual`, `unDualMul`).
    // Also mutates local blades during construction (e.g. assigns `bl2.mul = ...`).
    let result: Blade;
    const pss = bs.bases[bs.bases.length - 1];
    for (let i = 0; i < bs.bases.length; ++i) {
      bs.cayley[i] = [];
      const bl1 = bs.newBlade(1, bs.bases[i]);

      for (let j = 0; j < bs.bases.length; ++j) {
        const bl2 = bs.newBlade(1, bs.bases[j]);
        result = bs.gpBlades(bl1, bl2);
        bs.cayley[i][j] = result;

        // let's do manual duals for now.
        // have we found the dual dual
        // bl1 * bl2 = +- pss
        if (result.basis == pss) {
          if (!symmetricDual) {
            bl2.mul = result.mul;
          }
          bl1.basis.dual = bl2;

          // if the dual is already found for this basis:
          // workout the un-dual for both
          if (bl2.basis.dual) {
            const undualMultiplier = 1; // bl1.basis.dual.mul * bl2.basis.dual.mul
            bl1.basis.dual!.unDualMul = undualMultiplier;
            bl2.basis.dual!.unDualMul = undualMultiplier;
          }
        }
      }
    }

    // order by grade
    bs.gradeOrder = [];
    for (let g = 0; g < bs.grades.length; ++g) {
      for (let i = 0; i < bs.grades[g].length; ++i) {
        bs.gradeOrder.push(bs.grades[g][i]);
      }
    }
  }

  function setDual(this: BasisSet, basis: Basis, dualBasis: Basis, sign: number) {
    // NOT PURE: mutates passed-in objects (`basis`, and potentially `dualBasis.dual`) by setting `dual` and `unDualMul` fields.
    basis.dual = this.newBlade(sign, dualBasis);

    // if the dual is already set for the dual basis then set the undual multiplier for both
    if (dualBasis.dual) {
      basis.dual!.unDualMul = dualBasis.dual.mul;
      dualBasis.dual.unDualMul = basis.dual!.mul;
    }
  }

  function cayleyHtml(options?: CayleyHtmlOptions) {
    let idx: Basis[] = [];
    if (options && options.order) {
      for (let i = 0; i < options.order.length; ++i) idx.push(bs.basisById[options.order[i]]);
    } else if (bs.gradeOrder) {
      idx = bs.gradeOrder;
    } else {
      // default to blade order
      for (let g = 0; g < bs.grades.length; ++g) {
        for (let i = 0; i < bs.grades[g].length; ++i) idx.push(bs.grades[g][i]);
      }
    }

    const s: string[] = [];
    let blade: Blade;
    s.push('<table class="cayley">');
    for (let i = 0; i < idx.length; ++i) {
      s.push('<tr>');
      for (let j = 0; j < idx.length; ++j) {
        blade = bs.cayley[idx[i].bsIdx][idx[j].bsIdx];
        s.push('<td>');
        s.push(blade.html());
        s.push('</td>');
      }
      s.push('</tr>');
    }
    s.push('</table>');
    return s.join('');
  }

  // s = 1e2 + 4e12 - 5e23
  function multiVector(s?: string | MultiVectorDefinition): MultiVector {
    // NOT PURE (conditional): logs to console on parse / lookup failures ("Basis not found").
    const mv: MultiVector = {
      isA: 'mv',
      bs: bs,
      gradeStored: -1,
      opt: {},
      blades: [],
      bladeIdx: {},

      pushBlade(bl: Blade) {
        // NOT PURE: mutates the receiver multivector (`this.blades`, `this.bladeIdx`, dynamic `this[...]`, `this.gradeStored`).
        // May also mutate an existing stored blade via `targetBlade.mul += ...`.
        // does this blade already exist?
        const targetBlade = this.bladeIdx[bl.basis.id];
        if (targetBlade) {
          targetBlade.mul += bl.mul;
        } else {
          this.blades.push(bl);
          this.bladeIdx[bl.basis.id] = bl;

          // 2024-04-24 - put the blades straight into the mv
          this[stripUnderscores(bl.basis.id)] = bl;
        }

        this.gradeStored = -1;
      },

      // Return a string representation of the multivector
      toStr(label?: string) {
        const sBits: string[] = [];
        if (label) {
          sBits.push(label);
        }
        let bl: Blade; // blade
        const idx = bs.gradeOrder ? bs.gradeOrder : (this.blades as any);
        for (let i = 0; i < idx.length; ++i) {
          bl = this.bladeIdx[idx[i].id];

          // is this blade a member of the mv?
          if (bl) {
            if (Math.abs(bl.mul) > 0.01) {
              if (bl.mul >= 0) {
                sBits.push('+' + bl.mul.toFixed(2) + bl.basis.id);
              } else {
                sBits.push(bl.mul.toFixed(2) + bl.basis.id);
              }
            } else {
              // too small
              sBits.push('.....'.substr(0, bl.basis.grade));
            }
          }
        }
        return sBits.join(' ');
      },

      // Log a formatted string and return the multivector
      strLog(label?: string) {
        // NOT PURE: logs to console.
        console.log(this.toStr(label));
        return this;
      },

      grade(refreshGrade?: boolean) {
        // NOT PURE: mutates the receiver cache (`this.gradeStored`).
        if (this.gradeStored == -1 || refreshGrade) {
          this.gradeStored = -1;

          // recalculate grade
          let blade: Blade;
          for (let i = 0; i < this.blades.length; ++i) {
            blade = this.blades[i];
            if (!isEffectivelyZero(blade.mul)) {
              if (this.gradeStored == -1) {
                // first grade. init.
                this.gradeStored = blade.basis.grade;
              } else if (this.gradeStored == blade.basis.grade) {
                // the grades match. carry on
              } else {
                // mixed grade
                // the grade is a str eg. '0,2,4'
                if (((',' + this.gradeStored + ',') as any).indexOf(',' + blade.basis.grade + ',') == -1) {
                  this.gradeStored = (this.gradeStored as any) + ',' + blade.basis.grade;
                }
              }
            }
          }
        }
        return this.gradeStored;
      },

      getGrades() {
        const grades = new Set<number>();
        for (let i = 0; i < this.blades.length; ++i) {
          const blade = this.blades[i];
          if (!isEffectivelyZero(blade.mul)) {
            grades.add(blade.basis.grade);
          }
        }
        return grades;
      },

      bl(basisId: string) {
        return this.bladeIdx[basisId];
      },

      bVal(basisId: string) {
        return this.basisSVal(basisId);
      },

      basisSVal(basisId: string) {
        const bl = this.bladeIdx[basisId];
        if (!bl) {
          return 0;
        } else {
          return bl.mul;
        }
      },

      // Returns true if all blade coefficients are ~0 within the given epsilon.
      // Intentionally does not call `grade()` to avoid mutating the grade cache.
      isZero(epsilon = 1e-4) {
        for (let i = 0; i < this.blades.length; ++i) {
          if (!isEffectivelyZero(this.blades[i].mul, epsilon)) {
            return false;
          }
        }
        return true;
      },

      gp(mv2: MultiVector) {
        const mv1 = this;
        const mvResult = bs.multiVector('');
        let bladeResult: Blade;
        for (let i = 0; i < mv1.blades.length; ++i) {
          if ((mv2 as any).blades) {
            for (let j = 0; j < (mv2 as any).blades.length; ++j) {
              bladeResult = bs.gpBlades(mv1.blades[i], (mv2 as any).blades[j]);
              mvResult.pushBlade(bladeResult);
            }
          }
        }
        return mvResult;
      },

      cross(mv2: MultiVector) {
        const res = this.gp(mv2).add(mv2.gp(this).smul(-1)).smul(0.5);
        res.grade(true); // recalc the grade
        return res;
      },

      selectGrade(grade: number) {
        const mvSelf = this;
        const mvResult = bs.multiVector('');
        for (let i = 0; i < mvSelf.blades.length; ++i) {
          if (mvSelf.blades[i].basis.grade == grade) {
            mvResult.pushBlade(mvSelf.blades[i]);
          }
        }
        mvResult.gradeStored = grade;
        return mvResult;
      },

      reverse() {
        const mvResult = this.copy();
        let g: number;
        for (let i = 0; i < mvResult.blades.length; ++i) {
          g = mvResult.blades[i].basis.grade;
          mvResult.blades[i].mul *= Math.pow(-1, (g * (g - 1)) / 2);
        }
        return mvResult;
      },

      involute() {
        const mvResult = this.copy();
        let g: number;
        for (let i = 0; i < mvResult.blades.length; ++i) {
          g = mvResult.blades[i].basis.grade;
          mvResult.blades[i].mul *= Math.pow(-1, g);
        }
        return mvResult;
      },

      conjugate() {
        const mvResult = this.copy();
        let g: number;
        for (let i = 0; i < mvResult.blades.length; ++i) {
          g = mvResult.blades[i].basis.grade;
          mvResult.blades[i].mul *= Math.pow(-1, (g * (g + 1)) / 2);
        }
        return mvResult;
      },

      scalarProduct(rhs: MultiVector) {
        let bladeSum = 0;
        let rhsBlade: Blade | undefined, thisBlade: Blade;
        for (let i = 0; i < this.blades.length; ++i) {
          thisBlade = this.blades[i];
          rhsBlade = rhs.bl(thisBlade.basis.id);
          if (rhsBlade) {
            bladeSum += thisBlade.mul * rhsBlade.mul * rhsBlade.basis.sq;
          }
        }
        return bladeSum;
      },

      sq() {
        return this.scalarProduct(this);
      },

      normSq() {
        const mvResult = this.gp(this.reverse());
        return (mvResult.bladeIdx[bs.bases[0].id]?.mul ?? 0) as number;
      },

      norm() {
        return Math.pow(Math.abs(this.normSq()), 0.5);
      },

      inorm() {
        return Math.pow(this.dual().normSq(), 0.5);
      },

      normalize() {
        return this.smul(1 / this.norm());
      },

      inverse() {
        return this.reverse().smul(1 / this.normSq());
      },

      rotorSqrt() {
        // NOT PURE: calls `strLog(...)` (console logging).
        const scalarExists = this.bladeIdx[bs.bases[0].id];
        let scalar = 0;
        if (scalarExists) {
          scalar = Math.sign(this.bVal('e_'));
        }
        if (scalar == 0) {
          scalar = 1;
        }
        return this.sadd(scalar).strLog('sadd(' + scalar + ') : ').normalize();
      },

      // helper function to calculate the taylor series. used by exp() and motor()
      exp(alpha: number) {
        const n = this.smul(alpha);
        const sq = n.gp(n);
        if ((sq.grade() as any) <= 0) {
          const sq_val = sq.basisSVal('e_');
          if (sq_val < 0) {
            const a = Math.sqrt(-sq_val);
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            return n.smul(sin / a).sadd(cos);
          } else if (sq_val > 0) {
            const a = Math.sqrt(sq_val);
            const cosh = Math.cosh(a);
            const sinh = Math.sinh(a);
            return n.smul(sinh / a).sadd(cosh);
          } else {
            return n.sadd(1);
          }
        }

        // local helper
        function taylorSeries(n: MultiVector, sq: MultiVector, numTerms = 11) {
          let nPow = sq.smul(0.5); // n^2 / 2!
          let even_terms = (nPow as any).add(1);
          let odd_terms = n;

          for (let i = 3; i < numTerms; ++i) {
            nPow = nPow.gp(n).smul(1 / i);
            if ((i & 1) === 0) {
              even_terms = (even_terms as any).add(nPow);
            } else {
              odd_terms = (odd_terms as any).add(nPow);
            }
          }
          return (even_terms as any).add(odd_terms);
        }

        return taylorSeries(n, sq);
      },

      // enki's exponential
      eexp(alpha: number) {
        const B = [
          this.bVal('e_01') * alpha,
          this.bVal('e_02') * alpha,
          this.bVal('e_03') * alpha,
          this.bVal('e_12') * alpha,
          this.bVal('e_13') * alpha * -1,
          this.bVal('e_23') * alpha
        ];
        const l = B[3] * B[3] + B[4] * B[4] + B[5] * B[5];

        const mvResult = bs.multiVector('');
        if (l == 0) {
          mvResult.pushBlade(bs.newBlade(1, (bs as any).e));
          mvResult.pushBlade(bs.newBlade(B[0], (bs as any).e01));
          mvResult.pushBlade(bs.newBlade(B[1], (bs as any).e02));
          mvResult.pushBlade(bs.newBlade(B[2], (bs as any).e03));
          return mvResult;
        }
        const m = B[0] * B[5] + B[1] * B[4] + B[2] * B[3];
        const a = Math.sqrt(l);
        const c = Math.cos(a);
        const s = Math.sin(a) / a;
        const t = (m / l) * (c - s);

        mvResult.pushBlade(bs.newBlade(c, (bs as any).e));
        mvResult.pushBlade(bs.newBlade(s * B[0] + t * B[5], (bs as any).e01));
        mvResult.pushBlade(bs.newBlade(s * B[1] + t * B[4], (bs as any).e02));
        mvResult.pushBlade(bs.newBlade(s * B[2] + t * B[3], (bs as any).e03));
        mvResult.pushBlade(bs.newBlade(s * B[3], (bs as any).e12));
        mvResult.pushBlade(bs.newBlade(s * B[4] * -1, (bs as any).e13));
        mvResult.pushBlade(bs.newBlade(s * B[5], (bs as any).e23));
        mvResult.pushBlade(bs.newBlade(m * s, (bs as any).e0123));
        return mvResult;
      },

      motor() {
        const sq = this.gp(this);
        if ((sq.grade() as any) <= 0) {
          const sq_val = sq.basisSVal('e_');
          if (sq_val < 0) {
            const norm = Math.sqrt(-sq_val);
            return (alpha: number) => {
              const theta = alpha * norm;
              return this.smul(Math.sin(theta)).sadd(Math.cos(theta));
            };
          } else if (sq_val > 0) {
            const norm = Math.sqrt(sq_val);
            return (alpha: number) => {
              const theta = alpha * norm;
              return this.smul(Math.sinh(theta)).sadd(Math.cosh(theta));
            };
          } else {
            return (alpha: number) => this.smul(alpha).sadd(1);
          }
        } else {
          return (alpha: number) => {
            const n = this.smul(alpha);
            // local helper
            function taylorSeries(n: MultiVector, sq: MultiVector, numTerms = 11) {
              let nPow = sq.smul(0.5);
              let even_terms = (nPow as any).add(1);
              let odd_terms = n;
              for (let i = 3; i < numTerms; ++i) {
                nPow = nPow.gp(n).smul(1 / i);
                if ((i & 1) === 0) {
                  even_terms = (even_terms as any).add(nPow);
                } else {
                  odd_terms = (odd_terms as any).add(nPow);
                }
              }
              return (even_terms as any).add(odd_terms);
            }
            return taylorSeries(n, n.gp(n));
          };
        }
      },

      add(mv2: MultiVector) {
        const mvResult = this.copy();
        let bladeResult: Blade | undefined, mv2Blade: Blade;
        for (let i = 0; i < mv2.blades.length; ++i) {
          mv2Blade = mv2.blades[i];
          bladeResult = mvResult.bladeIdx[mv2Blade.basis.id];
          if (bladeResult) {
            bladeResult.mul += mv2Blade.mul;
          } else {
            mvResult.pushBlade(mv2Blade.copy());
          }
        }
        return mvResult;
      },

      sub(mv2: MultiVector) {
        const mvResult = this.copy();
        let bladeResult: Blade | undefined, mv2Blade: Blade;
        for (let i = 0; i < mv2.blades.length; ++i) {
          mv2Blade = mv2.blades[i];
          bladeResult = mvResult.bladeIdx[mv2Blade.basis.id];
          if (bladeResult) {
            bladeResult.mul -= mv2Blade.mul;
          } else {
            const negatedBlade = mv2Blade.copy();
            negatedBlade.mul = -negatedBlade.mul;
            mvResult.pushBlade(negatedBlade);
          }
        }
        return mvResult;
      },

      sadd(mul: number) {
        const mvCopy = this.copy();
        const scalarBasis = this.bs.bases[0];

        if (!mvCopy.bladeIdx[scalarBasis.id]) {
          mvCopy.pushBlade(bs.newBlade(mul, scalarBasis));
        } else {
          mvCopy.bladeIdx[scalarBasis.id].mul += mul;
        }
        return mvCopy;
      },

      smul(mul: number) {
        const mvCopy = this.copy();
        for (let i = 0; i < mvCopy.blades.length; ++i) {
          mvCopy.blades[i].mul *= mul;
        }
        if (this.components) {
          for (let i = 0; i < this.components.length; ++i) {
            (mvCopy.components ??= []).push(this.components[i].smul(mul));
          }
        }

        return mvCopy;
      },

      copy() {
        const mvResult = bs.multiVector('');
        if (this.components) {
          mvResult.components = [];
          for (let i = 0; i < this.components.length; ++i) {
            mvResult.components.push(this.components[i].copy());
          }
        }
        for (let i = 0; i < this.blades.length; ++i) {
          mvResult.pushBlade(this.blades[i].copy());
        }
        if (this.renderStuff) {
          mvResult.renderStuff = this.renderStuff;
        }

        return mvResult;
      },

      updateCopy(copyFrom: MultiVector) {
        // NOT PURE: mutates the receiver in-place to match `copyFrom`.
        this.blades = [];
        this.bladeIdx = {};

        if (copyFrom.components) {
          this.components = [];
          for (let i = 0; i < copyFrom.components.length; ++i) {
            this.components.push(copyFrom.components[i].copy());
          }
        }
        for (let i = 0; i < copyFrom.blades.length; ++i) {
          this.pushBlade(copyFrom.blades[i].copy());
        }
      },

      dual() {
        const mvResult = bs.multiVector('');
        let dualBlade: Blade;
        for (let i = 0; i < this.blades.length; ++i) {
          if (!this.blades[i].basis.dual) continue;
          dualBlade = this.blades[i].basis.dual.copy();
          dualBlade.mul *= this.blades[i].mul;
          mvResult.pushBlade(dualBlade);
        }
        return mvResult;
      },

      unDual() {
        const mvResult = bs.multiVector('');
        let dualBlade: Blade;
        let blDual: Blade;
        for (let i = 0; i < this.blades.length; ++i) {
          blDual = this.blades[i].basis.dual as any;
          if (!blDual) continue;
          dualBlade = blDual.copy();
          dualBlade.mul = this.blades[i].mul * (blDual.unDualMul ?? 1);
          mvResult.pushBlade(dualBlade);
        }
        return mvResult;
      },

      onClick(event: Event) {
        // NOT PURE: mutates the receiver (`lastEvent`) and logs via `strLog`.
        if ((event as any) == (this as any).lastEvent) {
          return;
        }
        (this as any).lastEvent = event;
        if (this.id) this.strLog(this.id + ': ');
        else this.strLog();
      },

      classify() {
        // NOT PURE (not guaranteed): delegates to external `bs.helpers.classify`, which may have side effects.
        if ((this.bs as any).helpers && (this.bs as any).helpers.classify) {
          return (this.bs as any).helpers.classify(this);
        }
        return null;
      },

      //--------------
      // *** geometry
      //--------------

      dot(b: MultiVector) {
        const mvResult = bs.multiVector('');

        for (let i = 0; i < this.blades.length; ++i) {
          const aBlade = this.blades[i];
          const r = aBlade.basis.grade;

          for (let j = 0; j < b.blades.length; ++j) {
            const bBlade = b.blades[j];
            const s = bBlade.basis.grade;

            const prod = bs.gpBlades(aBlade, bBlade);
            if (prod.basis.grade === Math.abs(s - r)) {
              mvResult.pushBlade(prod);
            }
          }
        }
        return mvResult;
      },

      // Left contraction
      lDot(b: MultiVector) {
        const mvResult = bs.multiVector('');

        for (let i = 0; i < this.blades.length; ++i) {
          const aBlade = this.blades[i];
          const r = aBlade.basis.grade;

          for (let j = 0; j < b.blades.length; ++j) {
            const bBlade = b.blades[j];
            const s = bBlade.basis.grade;

            if (s >= r) {
              const prod = bs.gpBlades(aBlade, bBlade);
              if (prod.basis.grade === s - r) {
                mvResult.pushBlade(prod);
              }
            }
          }
        }
        return mvResult;
      },

      // Right contraction
      rDot(b: MultiVector) {
        const mvResult = bs.multiVector('');

        for (let i = 0; i < this.blades.length; ++i) {
          const aBlade = this.blades[i];
          const r = aBlade.basis.grade;

          for (let j = 0; j < b.blades.length; ++j) {
            const bBlade = b.blades[j];
            const s = bBlade.basis.grade;

            if (r >= s) {
              const prod = bs.gpBlades(aBlade, bBlade);
              if (prod.basis.grade === r - s) {
                mvResult.pushBlade(prod);
              }
            }
          }
        }
        return mvResult;
      },

      projectOnto(b: MultiVector) {
        const bSquared = b.gp(b);
        const dot = this.dot(b);
        const bInverse = b.smul(1 / bSquared.basisSVal('e_'));
        const res = dot.gp(bInverse);
        return res;
      },

      // outer product
      op(b: MultiVector) {
        const res = this.gp(b).selectGrade((this.grade() as any) + (b.grade() as any));
        return res;
      },

      join(b: MultiVector) {
        const g1 = this.grade() as any;
        const g2 = b.grade() as any;
        const sign = Math.pow(-1, g1 * g2);
        const res = this.dual().op(b.dual()).unDual().smul(sign);
        res.components = [];
        res.copyComponents(this);
        res.copyComponents(b);
        return res;
      },

      // sandwich product
      sandwich(target: MultiVector) {
        return this.gp(target).gp(this.reverse());
      },

      copyComponents(b: MultiVector) {
        // NOT PURE: mutates the receiver (`this.components`) by appending references (not deep copies).
        if ((b as any).components) {
          for (let i = 0; i < (b as any).components.length; ++i) {
            (this.components ??= []).push((b as any).components[i]);
          }
        } else {
          (this.components ??= []).push(b);
        }
      },

      // move here VVV
      move(rotor: MultiVector, target?: MultiVector) {
        // NOT PURE: if `target` is provided, mutates that passed-in multivector via `target.updateCopy(...)`.
        const rotorInverse = rotor.reverse();

        const resMV = rotor.gp(this.gp(rotorInverse)).selectGrade(this.grade() as any);
        if (this.opt) {
          Object.keys(this.opt).forEach((k) => ((resMV as any).opt[k] = (this.opt as any)[k]));
        }

        if (this.components) {
          (resMV as any).components = [];
          for (let i = 0; i < this.components.length; ++i) {
            const comp = this.components[i];
            const compCopy = comp.copy();
            compCopy.move(rotor, compCopy);
            (resMV as any).components.push(compCopy);
          }
        }

        if (target) {
          target.updateCopy(resMV);
        }

        return resMV;
      },

      //--------------
      // *** rendering
      //--------------
      render(options?: MultiVectorRenderOptions) {
        // NOT PURE: triggers external rendering (side effects) and may call `alert(...)`.
        if ((this.bs as any).interpretation) {
          (this.bs as any).interpretation.renderMV(this, options);
        } else {
          alert('no renderer found');
        }
        return this;
      }
    };

    if (typeof s === 'string') {
      // process the mv string
      if (s.trim().length > 0) {
        s = s.replace(/-/g, '+-');
        s = s.replace(/ /g, '');
        const bladesBits = s.split('+');
        let bBits: string[] = [];
        let basis: Basis | undefined, basisId: string;
        const grade0Id = bs.bases[0].id;
        for (let i = 0; i < bladesBits.length; ++i) {
          if (bladesBits[i] != '') {
            // a - at the start of the string produces an empty bladesBits[0]
            bBits = bladesBits[i].split(grade0Id);
            basisId = grade0Id + bBits[1];
            basis = bs.basisById[basisId];
            if (!basis) {
              console.log('!***** Basis not found: ' + basisId + '(' + s + ')');
            } else {
              mv.pushBlade(bs.newBlade((bBits[0] as any) - 0, basis));
            }
          }
        }
      }
    } else if (typeof s === 'object' && s) {
      // assume s is an object with blade keys eg { e_01: 2, e_23: -5 }
      for (const [basisId, value] of Object.entries(s)) {
        const basis = bs.basisById[basisId];
        if (!basis) {
          console.log('!***** Basis not found: ' + basisId);
        } else {
          mv.pushBlade(bs.newBlade((value as any) - 0, basis));
        }
      }
    }

    return mv;
  }

  const scalarBasis = bs.basisSet_basis('e_', 1, '');
  bs.bases.push(scalarBasis);
  bs.grades[0] = [scalarBasis];
  bs.e = scalarBasis;
  bs.basisById[scalarBasis.id] = scalarBasis;

  return bs;
}
