declare global {
  interface Window {
    _paq: Array<Array<string | number | undefined>>;
  }
}

export function trackEvent(
  category: string,
  action: string,
  name?: string,
  value?: number,
) {
  if (window._paq) {
    window._paq.push(["trackEvent", category, action, name, value]);
  }
}
