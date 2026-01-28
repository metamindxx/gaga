/** Orbit Control State - disable during drag */

let _enabled = $state(true);

export const orbitEnabled = {
  get current() {
    return _enabled;
  }
};
export function disableOrbit() {
  _enabled = false;
}
export function enableOrbit() {
  _enabled = true;
}
