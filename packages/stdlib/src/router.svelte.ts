/**
 * 🛣️ Viand Isomorphic Router
 * Handles SPA navigation, SSR seeding, and UI Testing.
 */

const isBrowser = typeof window !== 'undefined';

class Router {
  // Current URL state
  #url = $state(this.#normalize(isBrowser ? window.location.pathname : '/'));
  
  // Public reactive accessors
  get path() { return this.#url; }

  #normalize(p: string) {
    if (p === '/') return p;
    return p.endsWith('/') ? p.slice(0, -1) : p;
  }
  
  /**
   * Navigate to a new path.
   * If in browser, updates history. If in test/ssr, updates state only.
   */
  goto(newPath: string) {
    const normalized = this.#normalize(newPath);
    this.#url = normalized;
    
    if (isBrowser && this.#normalize(window.location.pathname) !== normalized) {
      window.history.pushState({}, '', normalized);
    }
  }

  /**
   * Internal: Listen for browser back/forward buttons
   */
  init() {
    if (!isBrowser) return;
    
    window.addEventListener('popstate', () => {
      this.#url = window.location.pathname;
    });

    // Intercept <a> tag clicks for seamless navigation
    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && 
          link.href && 
          link.origin === window.location.origin && 
          !link.hasAttribute('download') &&
          link.target !== '_blank') {
        e.preventDefault();
        this.goto(link.pathname);
      }
    });
  }
}

// Export a singleton instance
export const router = new Router();
if (isBrowser) router.init();
