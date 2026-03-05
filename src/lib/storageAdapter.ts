interface StorageInstance {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
    remove(key: string): void;
}

function createMemoryStorage(): StorageInstance {
    const store = new Map<string, string>();
    return {
        getString: (key) => store.get(key),
        set: (key, value) => { store.set(key, value); },
        remove: (key) => { store.delete(key); },
    };
}

/**
 * Creates a synchronous storage instance.
 * Tries to instantiate MMKV; on failure (Expo Go), falls back to in-memory storage.
 */
export function createStorageInstance(id: string): StorageInstance {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
        const mmkv = createMMKV({ id });
        return {
            getString: (key) => mmkv.getString(key),
            set: (key, value) => mmkv.set(key, value),
            remove: (key) => { mmkv.remove(key); },
        };
    } catch {
        console.warn(`[storageAdapter] MMKV unavailable (${id}), falling back to memory.`);
        return createMemoryStorage();
    }
}
