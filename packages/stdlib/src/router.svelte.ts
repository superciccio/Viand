/**
 * 🛣️ Viand Isomorphic Router
 * Handles SPA navigation using Svelte Stores for total stability.
 */

import { writable, get } from "svelte/store";

const isBrowser = typeof window !== 'undefined';

function createRouter() {
  const _url = writable(isBrowser ? window.location.pathname : '/');

  function normalize(p) {
    if (p === '/') return p;
    return p.endsWith('/') ? p.slice(0, -1) : p;
  }

  // Initial normalization
  _url.update(p => normalize(p));

  return {
    // Svelte 5 handles store access via $router.path if we export the store,
    // but for our logic bridge we use a getter.
    get path() {
      return get(_url);
    },

    // To make it reactive in Svelte 5 templates easily:
    subscribe: _url.subscribe,

    goto(newPath) {
      const p = normalize(newPath);
      _url.set(p);
      if (isBrowser && window.location.pathname !== p) {
        window.history.pushState({}, '', p);
      }
    },

    enableSPA() {
      if (!isBrowser) return;
      window.addEventListener('click', (e) => {
        const target = e.target;
        const link = target.closest('a');
        if (link && link.href && link.origin === window.location.origin) {
          e.preventDefault();
          this.goto(link.pathname);
        }
      });
    }
  };
}

export const router = createRouter();