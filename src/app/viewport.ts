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
  return window.matchMedia('(pointer: coarse)').matches;
}
