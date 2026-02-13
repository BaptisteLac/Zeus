import { supabase } from './supabase';
import { AppState } from './types';

export interface SyncResult {
    success: boolean;
    error?: string;
    synced?: boolean;
}

/**
 * Récupère l'état depuis Supabase pour l'utilisateur connecté
 */
export async function syncFromCloud(): Promise<{ state: AppState | null; timestamp: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { state: null, timestamp: null };
        }

        const { data, error } = await supabase
            .from('workout_states')
            .select('state, updated_at')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // Si pas de données (première fois), c'est normal
            if (error.code === 'PGRST116') {
                return { state: null, timestamp: null };
            }
            console.error('Error syncing from cloud:', error);
            return { state: null, timestamp: null };
        }

        return {
            state: data.state as AppState,
            timestamp: data.updated_at,
        };
    } catch (error) {
        console.error('Error in syncFromCloud:', error);
        return { state: null, timestamp: null };
    }
}

/**
 * Sauvegarde l'état vers Supabase
 */
export async function syncToCloud(state: AppState): Promise<SyncResult> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Upsert : insert si nouveau, update si existe
        const { error } = await supabase
            .from('workout_states')
            .upsert({
                user_id: user.id,
                state: state,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });

        if (error) {
            console.error('Error syncing to cloud:', error);
            return { success: false, error: error.message };
        }

        return { success: true, synced: true };
    } catch (error) {
        console.error('Error in syncToCloud:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export async function isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
}

/**
 * Récupère l'utilisateur actuel
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Connexion avec email (magic link)
 */
export async function signInWithEmail(email: string): Promise<SyncResult> {
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<SyncResult> {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Écoute les changements d'état d'authentification
 */
export function onAuthStateChange(callback: (authenticated: boolean, email?: string) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(!!session?.user, session?.user?.email);
    });
}
