/**
 * Shared scene controls state - pause, theme, reset
 */

// Theme state
let _theme = $state<'light' | 'dark'>('light');
export const theme = {
  get current() { return _theme; }
  , set current(v: 'light' | 'dark') { _theme = v; }
  , toggle() { _theme = _theme === 'light' ? 'dark' : 'light'; }
};

// Pause state
let _paused = $state(false);
export const paused = {
  get current() { return _paused; }
  , set current(v: boolean) { _paused = v; }
  , toggle() { _paused = !_paused; }
};

// Reset key - increment to trigger scene reset
let _resetKey = $state(0);
export const resetKey = {
  get current() { return _resetKey; }
  , increment() { _resetKey++; }
};

// Config panel visibility
let _configExpanded = $state(true);
export const configExpanded = {
  get current() { return _configExpanded; }
  , set current(v: boolean) { _configExpanded = v; }
  , toggle() { _configExpanded = !_configExpanded; }
};
