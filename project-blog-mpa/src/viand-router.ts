/**
 * 🛣️ Viand Isomorphic Router
 * Handles SPA navigation using Signals for total stability.
 */

import { signal } from "@viand/runtime";

const isBrowser = typeof window !== 'undefined';

function createRouter() {
  const _url = signal(isBrowser ? window.location.pathname : '/');

  function normalize(p: string) {
    if (p === '/') return p;
    return p.endsWith('/') ? p.slice(0, -1) : p;
  }

  // Initial normalization
  _url.value = normalize(_url.value);

  return {
    get path() {
      return _url.value;
    },

    goto(newPath: string) {
      const p = normalize(newPath);
      _url.value = p;
      if (isBrowser && window.location.pathname !== p) {
        window.history.pushState({}, '', p);
      }
    },

    enableSPA() {
      if (!isBrowser) return;
      window.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href && link.origin === window.location.origin) {
          e.preventDefault();
          this.goto(link.pathname);
        }
      });
      
      window.addEventListener('popstate', () => {
          _url.value = normalize(window.location.pathname);
      });
    }
  };
}

export const router = createRouter();
