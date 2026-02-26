/**
 * sessionStorage — Persistance MMKV pour la séance active
 * Phase 9: Auto-Save & Persistance
 *
 * Stocke un snapshot synchrone de la séance en cours dans MMKV.
 * Permet la récupération immédiate après crash / fermeture brutale.
 *
 * Séparé de 'iron-timer' (TimerContext) pour isolation des responsabilités.
 * Instance MMKV : 'iron-session'
 * Clé              : 'active_session'
 *
 * Cycle de vie :
 *   saveActiveSession()  ← à chaque modification (sync, ~0.1ms)
 *   loadActiveSession()  ← au démarrage (détection de crash)
 *   clearActiveSession() ← fin de séance ou abandon
 *
 * Note sur la durée de validité :
 *   Un snapshot > 24h est considéré comme une ancienne séance abandonnée,
 *   pas un crash récent → ignoré silencieusement.
 */

import { MMKV } from 'react-native-mmkv';
import { AppState, ExerciseInput, SessionType } from '@/lib/types';

// ─── MMKV instance ────────────────────────────────────────────────────────────

const storage = new MMKV({ id: 'iron-session' });
const SESSION_KEY = 'active_session';

/** Durée maximale de validité d'un snapshot (24h en ms) */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Snapshot minimal de la séance active.
 * Extrait de AppState.currentSessionData + currentSession.
 *
 * Conçu pour être petit (< 1 KB typique) — serialisation JSON rapide.
 */
export interface ActiveSessionSnapshot {
  /** Type de séance en cours (A / B / C) */
  sessionType: SessionType;
  /** Saisies en cours par exercice (charge, séries, RIR) */
  exerciseInputs: Record<string, ExerciseInput>;
  /** IDs des exercices validés dans cette séance */
  savedExercises: string[];
  /** Unix ms timestamp — pour calcul d'âge et affichage */
  savedAt: number;
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Sauvegarde synchrone du snapshot en MMKV (~0.1ms).
 * À appeler avant toute persistence asynchrone (AsyncStorage / Supabase).
 */
export function saveActiveSession(snapshot: ActiveSessionSnapshot): void {
  storage.set(SESSION_KEY, JSON.stringify(snapshot));
}

/**
 * Charge le snapshot MMKV.
 * Retourne null si aucune séance active ou si les données sont corrompues.
 */
export function loadActiveSession(): ActiveSessionSnapshot | null {
  const raw = storage.getString(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveSessionSnapshot;
  } catch {
    // Données corrompues → nettoyage silencieux
    storage.delete(SESSION_KEY);
    return null;
  }
}

/**
 * Supprime le snapshot MMKV.
 * À appeler en fin de séance (terminée) ou sur abandon explicite.
 */
export function clearActiveSession(): void {
  storage.delete(SESSION_KEY);
}

/**
 * Vérifie si un snapshot est encore récent (< 24h).
 * Un snapshot trop ancien correspond à une séance non terminée il y a
 * longtemps — ne mérite pas une proposition de reprise.
 */
export function isSessionValid(snapshot: ActiveSessionSnapshot): boolean {
  return Date.now() - snapshot.savedAt < MAX_AGE_MS;
}

/**
 * Construit un ActiveSessionSnapshot depuis un AppState complet.
 * Centralise l'extraction pour éviter la duplication dans le hook.
 */
export function snapshotFromAppState(state: AppState): ActiveSessionSnapshot {
  return {
    sessionType: state.currentSession,
    exerciseInputs: state.currentSessionData?.exerciseInputs ?? {},
    savedExercises: state.currentSessionData?.savedExercises ?? [],
    savedAt: Date.now(),
  };
}
