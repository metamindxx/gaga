import * as THREE from 'three';

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
  smul(scale: number): Blade;
  copy(): Blade;
  s(): string;
  html(): string;
  unDualMul?: number;
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
  [key: string]: unknown;
  pushBlade(blade: Blade): void;
  toStr(label?: string): string;
  strLog(label?: string): MultiVector;
  grade(refresh?: boolean): number | string;
  bl(basisId: string): Blade | undefined;
  bVal(basisId: string): number;
  basisSVal(basisId: string): number;
  gp(other: MultiVector): MultiVector;
  cross(other: MultiVector): MultiVector;
  op(other: MultiVector): MultiVector;
  dot(other: MultiVector): MultiVector;
  projectOnto(other: MultiVector): MultiVector;
  join(other: MultiVector): MultiVector;
  selectGrade(grade: number): MultiVector;
  reverse(): MultiVector;
  involute(): MultiVector;
  conjugate(): MultiVector;
  render(options?: MultiVectorRenderOptions): this;
  move(rotor: MultiVector, target?: MultiVector): MultiVector;
  dual(): MultiVector;
  unDual(): MultiVector;
  onClick(event: Event): void;
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
  asMotor(options?: { scale?: number }): Motor;
  add(mv: MultiVector): MultiVector;
  sub(mv: MultiVector): MultiVector;
  sadd(scalar: number): MultiVector;
  smul(scalar: number): MultiVector;
  copy(): MultiVector;
  updateCopy(copyFrom: MultiVector): void;
  copyComponents(source: MultiVector): void;
}

export interface GpOptions {
  log?: boolean;
}

export interface CayleyHtmlOptions {
  order?: string[];
}

export interface BasisSet {
  isA: 'basisSet';
  bases: Basis[];
  basisIdx: Record<string, number>;
  basisById: Record<string, Basis>;
  grades: Basis[][];
  cayley: Blade[][];
  gradeOrder: Basis[] | null;
  interpretation: CgaBasis | PgaBasis | null;
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
  [key: string]: unknown;
}

export interface Motor {
  isA: 'motor';
  generator: MultiVector;
  readonly scale: number;
  evaluate(scale?: number, target?: MultiVector): MultiVector;
  scaleTo(scale: number): Motor;
  toMultiVector(): MultiVector;
  move(target: MultiVector): MultiVector;
}

export interface CgaBasis {
  isA: 'cgaBasis';
  scene: THREE.Scene;
  bs: BasisSet;
  opt: Record<string, unknown>;
  n0: MultiVector;
  ni: MultiVector;
  I5: MultiVector;
  pt(x: number, y: number, z: number): MultiVector;
  pointXYZ(mv: MultiVector): { x: number; y: number; z: number };
  renderMV(mv: MultiVector, options?: MultiVectorRenderOptions): void;
}

export interface PgaBasis {
  isA: 'pgaBasis';
  scene: THREE.Scene;
  bs: BasisSet;
  opt: Record<string, unknown>;
  I3: MultiVector;
  I4: MultiVector;
  pt(x: number, y: number, z: number): MultiVector;
  pointXYZ(mv: MultiVector): { x: number; y: number; z: number };
  renderMV(mv: MultiVector, options?: MultiVectorRenderOptions): void;
  logMV(mv: MultiVector, options?: { label?: string }): void;
}

export function createBasisSet(p?: number, q?: number, r?: number): BasisSet;
export function createMotor(generator: MultiVector, options?: { scale?: number }): Motor;
