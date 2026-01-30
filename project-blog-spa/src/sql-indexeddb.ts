/**
 * 🗄️ Viand Web SQL Driver (IndexedDB)
 * A simple persistence layer that maps SQL-like labels to IndexedDB.
 */

export class IndexedDBDriver {
  private dbName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = "viand_db") {
    this.dbName = dbName;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("records")) {
          db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async execute(label: string, ...args: any[]): Promise<any> {
    if (!this.db) await this.init();
    
    // Naive mapping of SQL-like labels to IndexedDB operations
    if (label.toLowerCase().includes("loadall") || label.toLowerCase().includes("getall")) {
      return this.getAll();
    }
    
    if (label.toLowerCase().includes("save") || label.toLowerCase().includes("add") || label.toLowerCase().includes("insert")) {
      // If first arg is a string, wrap it in an object
      const data = typeof args[0] === 'string' ? { text: args[0], created_at: new Date() } : args[0];
      return this.add(data);
    }

    console.warn(`[IndexedDB Driver] No mapping found for label: ${label}. Defaulting to empty result.`);
    return [];
  }

  private getAll(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readonly");
      const store = transaction.objectStore("records");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private add(data: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readwrite");
      const store = transaction.objectStore("records");
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }
}

export const createWebSQLDriver = (dbName?: string) => {
    const driver = new IndexedDBDriver(dbName);
    return (label: string, ...args: any[]) => driver.execute(label, ...args);
};
