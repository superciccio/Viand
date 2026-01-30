/**
 * 🔔 Viand Standard Notification Interface
 * Unified API for browser toasts and native system notifications.
 */

export interface NotifyAdapter {
  success(msg: string): void;
  error(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
}

/**
 * Default "Kitchen" Implementation
 * Simple, zero-dependency browser-based alerts.
 */
class DefaultNotify implements NotifyAdapter {
  success(msg: string) { 
    console.log("🟢 SUCCESS:", msg); 
    // Basic browser visual
    this.#show(msg, '#10b981');
  }
  error(msg: string) { 
    console.error("🔴 ERROR:", msg); 
    this.#show(msg, '#ef4444');
  }
  info(msg: string) { 
    console.log("🔵 INFO:", msg); 
    this.#show(msg, '#3b82f6');
  }
  warn(msg: string) { 
    console.warn("🟡 WARN:", msg); 
    this.#show(msg, '#f59e0b');
  }

  #show(msg: string, color: string) {
    if (typeof document === 'undefined') return;
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      padding: 12px 24px; border-radius: 8px;
      color: white; font-weight: bold; z-index: 9999;
      background: ${color};
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// The singleton instance
export const notify = new DefaultNotify();
