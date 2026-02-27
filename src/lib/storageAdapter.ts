/**
 * storageAdapter — Couche d'abstraction MMKV / mémoire
 *
 * En build natif (expo run:ios / run:android / EAS) → MMKV (NitroModules C++).
 * En Expo Go où NitroModules ne sont pas supportés → store mémoire pur JS.
 *
 * L'API est volontairement minimale (get / set / remove) pour rester simple.
 * Les fichiers consumers (TimerContext, sessionStorage) n'importent plus MMKV
 * directement : ils passent par createStorageInstance().
 */

// ─── Interface commune ────────────────────────────────────────────────────────

interface StorageInstance {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
    remove(key: string): void;
}

// ─── Fallback mémoire (Expo Go) ───────────────────────────────────────────────

function createMemoryStorage(): StorageInstance {
    const store = new Map<string, string>();
    return {
        getString: (key) => store.get(key),
        set: (key, value) => { store.set(key, value); },
        remove: (key) => { store.delete(key); },
    };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Crée une instance de stockage synchrone.
 * Tente d'instancier MMKV ; en cas d'échec (Expo Go), bascule sur mémoire.
 *
 * @param id  Identifiant unique de l'instance (ex : 'iron-timer')
 */
export function createStorageInstance(id: string): StorageInstance {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
        const mmkv = createMMKV({ id });
        // Adaptateur : harmonise remove() (notre API) avec remove() (MMKV v4)
        return {
            getString: (key) => mmkv.getString(key),
            set: (key, value) => mmkv.set(key, value),
            remove: (key) => { mmkv.remove(key); },
        };
    } catch {
        // NitroModules non disponibles (Expo Go) → mémoire pure
        console.warn(`[storageAdapter] MMKV non disponible (${id}), fallback mémoire.`);
        return createMemoryStorage();
    }
}
