/**
 * Keeps --app-height and --app-top equal to the visible viewport, so the
 * terminal shrinks above the on-screen keyboard instead of hiding under it
 * (iOS Safari and browsers that ignore interactive-widget=resizes-content).
 */
export function trackVisualViewport(): () => void {
  const root = document.documentElement;
  const vv = window.visualViewport;
  const update = () => {
    root.style.setProperty('--app-height', `${vv?.height ?? window.innerHeight}px`);
    root.style.setProperty('--app-top', `${vv?.offsetTop ?? 0}px`);
  };
  update();
  vv?.addEventListener('resize', update);
  vv?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  return () => {
    vv?.removeEventListener('resize', update);
    vv?.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  };
}

/** True on phones and tablets, where the extra-keys row is useful. */
export function hasTouchKeyboard(): boolean {
  return window.matchMedia(COARSE_POINTER).matches;
}

/**
 * Calls `onChange` when a keyboard or mouse is attached or removed (tablets,
 * foldables, Chromebooks). Returns the function that stops listening.
 */
export function watchTouchKeyboard(onChange: (touch: boolean) => void): () => void {
  const query = window.matchMedia(COARSE_POINTER);
  const listener = (e: MediaQueryListEvent) => onChange(e.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

const COARSE_POINTER = '(pointer: coarse)';
