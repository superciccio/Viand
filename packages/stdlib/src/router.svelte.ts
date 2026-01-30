/**
 * 🛣️ Viand Isomorphic Router
 * Handles SPA navigation and reactive path tracking.
 */

const isBrowser = typeof window !== 'undefined';

function createRouter() {
  let _url = $state('/');

  if (isBrowser) {
    _url = window.location.pathname;
    if (_url !== '/' && _url.endsWith('/')) _url = _url.slice(0, -1);
    
    window.addEventListener('popstate', () => {
      let p = window.location.pathname;
      if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
      _url = p;
    });
  }

  return {
    get path() { return _url; },
    
    goto(newPath) {
      let p = newPath;
      if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
      _url = p;
      
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