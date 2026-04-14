import { StateStorage } from "zustand/middleware";
import { get, set, del, clear, promisifyRequest } from "idb-keyval";
import { safeLocalStorage } from "../utils";

const localStorage = safeLocalStorage();

function createStrictStore(dbName: string, storeName: string) {
  let dbp: IDBDatabase | undefined;
  const getDB = (): Promise<IDBDatabase> => {
    if (dbp) return Promise.resolve(dbp);
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    const p = promisifyRequest(request) as Promise<IDBDatabase>;
    p.then(
      (db) => {
        dbp = db;
        db.onclose = () => (dbp = undefined);
      },
      () => {},
    );
    return p;
  };
  return <T>(
    txMode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => T | PromiseLike<T>,
  ): Promise<T> =>
    getDB().then((db) => {
      const tx = db.transaction(storeName, txMode, {
        durability: "strict",
      } as IDBTransactionOptions);
      const store = tx.objectStore(storeName);
      return callback(store) as T;
    });
}

const strictStore = createStrictStore("keyval-store", "keyval");

let flushCount = 0;
let lastFlushLogTime = 0;
const isDev = process.env.NODE_ENV === "development";

class IndexedDBStorage implements StateStorage {
  private pending = new Map<string, string | null>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  private scheduleFlush() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, 1000);
  }

  private async flush() {
    const batch = new Map(this.pending);
    if (batch.size === 0) return;
    this.pending.clear();

    flushCount += batch.size;
    const now = Date.now();
    if (now - lastFlushLogTime >= 1000) {
      if (isDev) {
        const keys = Array.from(batch.keys()).join(", ");
        console.log(
          `[IDB flush] ${flushCount} actual writes in last 1s, keys: [${keys}]`,
        );
      }
      flushCount = 0;
      lastFlushLogTime = now;
    }

    for (const [name, value] of batch) {
      if (value === null) {
        await this._removeItem(name);
      } else {
        await this._setItem(name, value);
      }
    }
  }

  private async _setItem(name: string, value: string) {
    try {
      const _value = JSON.parse(value);
      if (!_value?.state?._hasHydrated) {
        console.warn("skip setItem", name);
        return;
      }
      await set(name, value, strictStore);
    } catch (error) {
      localStorage.setItem(name, value);
    }
  }

  private async _removeItem(name: string) {
    try {
      await del(name, strictStore);
    } catch (error) {
      localStorage.removeItem(name);
    }
  }

  private async _clear() {
    try {
      await clear(strictStore);
    } catch (error) {
      localStorage.clear();
    }
  }

  public async getItem(name: string): Promise<string | null> {
    if (this.pending.has(name)) {
      const value = this.pending.get(name)!;
      return value === null ? null : value;
    }
    try {
      const value =
        (await get<string>(name, strictStore)) ?? localStorage.getItem(name);
      return value ?? null;
    } catch (error) {
      return localStorage.getItem(name);
    }
  }

  public setItem(name: string, value: string): void {
    this.pending.set(name, value);
    this.scheduleFlush();
  }

  public removeItem(name: string): void {
    this.pending.set(name, null);
    this.scheduleFlush();
  }

  public async clear(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending.clear();
    await this._clear();
  }
}

export const indexedDBStorage = new IndexedDBStorage();
