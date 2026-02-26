/**
 * useAutoSave — Orchestration de la sauvegarde automatique
 * Phase 9: Auto-Save & Persistance
 *
 * Stratégie à deux vitesses :
 *   Fast path  : MMKV synchrone via sessionStorage (crash-safe, ~0.1ms)
 *   Slow path  : AsyncStorage + Supabase via saveState() (async, ~50-200ms)
 *
 * ┌───────────────────────────┬──────────────┬─────────────────────────────┐
 * │ Déclencheur               │ Méthode      │ Comportement                │
 * ├───────────────────────────┼──────────────┼─────────────────────────────┤
 * │ Frappe clavier            │ saveDebounced│ Debounce 400ms → fast+slow  │
 * │ Validation série / swipe  │ saveImmediate│ Fast+slow immédiat          │
 * │ Lancement timer           │ saveImmediate│ Fast+slow immédiat          │
 * │ App → background          │ flush()      │ Auto, force save en attente │
 * │ Démontage composant       │ flush()      │ Auto, cleanup timer         │
 * └───────────────────────────┴──────────────┴─────────────────────────────┘
 *
 * Crash recovery :
 *   Au mount, le hook vérifie MMKV. Si un snapshot valide (< 24h) existe,
 *   pendingSession est non-null. Le parent peut afficher un bottom sheet
 *   "Reprendre / Abandonner" basé sur cette valeur.
 *
 *   dismissPending() → clearActiveSession() + reset pendingSession à null
 *   (appeler sur "Abandonner" ou après restauration réussie)
 *
 * Pattern AppState listener :
 *   Identique à TimerContext — useRef(flush) évite la re-registration
 *   à chaque render. Une seule subscription pour toute la durée de vie.
 *
 * Usage :
 *   const { saveImmediate, saveDebounced, flush, pendingSession, dismissPending }
 *     = useAutoSave();
 *
 *   // Frappe clavier (charge, reps) :
 *   onChange={(v) => saveDebounced({ ...state, currentSessionData: { ... } })}
 *
 *   // Validation série (swipe-to-done) :
 *   const handleValidate = () => {
 *     const updated = applyValidation(state);
 *     saveImmediate(updated);
 *   };
 *
 *   // Crash recovery (dans l'écran principal) :
 *   if (pendingSession) {
 *     showResumeSheet({ pendingSession, onResume: restoreFrom, onAbandon: dismissPending });
 *   }
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { AppState } from '@/lib/types';
import { saveState } from '@/lib/storage';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  isSessionValid,
  snapshotFromAppState,
  ActiveSessionSnapshot,
} from '@/services/sessionStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Délai de debounce pour la saisie clavier (ms) */
const DEBOUNCE_MS = 400;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAutoSaveReturn {
  /**
   * Sauvegarde immédiate : MMKV sync + AsyncStorage/Supabase async.
   * À utiliser sur validation de série, lancement timer, action critique.
   */
  saveImmediate: (state: AppState) => void;

  /**
   * Sauvegarde avec debounce 400ms.
   * À utiliser sur chaque frappe clavier (charge, reps, RIR).
   * Réinitialise le timer à chaque appel — la sauvegarde n'a lieu
   * qu'après 400ms de silence.
   */
  saveDebounced: (state: AppState) => void;

  /**
   * Annule le debounce en cours et force une sauvegarde immédiate
   * si un état est en attente.
   * Appelé automatiquement : background AppState, démontage composant.
   * Peut aussi être appelé manuellement avant navigation.
   */
  flush: () => void;

  /**
   * Snapshot MMKV détecté au démarrage — non-null si crash récupérable.
   * La valeur est stable après le mount initial.
   * Afficher un bottom sheet "Reprendre / Abandonner" si non-null.
   */
  pendingSession: ActiveSessionSnapshot | null;

  /**
   * Efface le snapshot MMKV et réinitialise pendingSession à null.
   * À appeler quand l'utilisateur choisit "Abandonner",
   * ou après restauration réussie de la séance.
   */
  dismissPending: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutoSave(): UseAutoSaveReturn {
  // ─── Crash recovery state ──────────────────────────────────────────────────
  const [pendingSession, setPendingSession] =
    useState<ActiveSessionSnapshot | null>(null);

  // ─── Debounce internals ────────────────────────────────────────────────────
  // Timer ID du debounce en cours (null = aucun timer actif)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dernier AppState passé à saveDebounced (pour flush)
  const pendingState = useRef<AppState | null>(null);

  // ─── saveImmediate ─────────────────────────────────────────────────────────
  const saveImmediate = useCallback((state: AppState) => {
    // 1. Fast path : MMKV synchrone (~0.1ms) — crash-safe
    saveActiveSession(snapshotFromAppState(state));

    // 2. Slow path : async, fire-and-forget — MMKV est le filet de sécurité
    void saveState(state).catch(() => {
      // Erreur non fatale : le snapshot MMKV est déjà sauvegardé
    });
  }, []);

  // ─── flush ─────────────────────────────────────────────────────────────────
  const flush = useCallback(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (pendingState.current !== null) {
      saveImmediate(pendingState.current);
      pendingState.current = null;
    }
  }, [saveImmediate]);

  // ─── saveDebounced ─────────────────────────────────────────────────────────
  const saveDebounced = useCallback(
    (state: AppState) => {
      // Toujours garder l'état le plus récent pour le flush
      pendingState.current = state;

      // Réinitialiser le timer à chaque frappe
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        if (pendingState.current !== null) {
          saveImmediate(pendingState.current);
          pendingState.current = null;
        }
      }, DEBOUNCE_MS);
    },
    [saveImmediate],
  );

  // ─── dismissPending ────────────────────────────────────────────────────────
  const dismissPending = useCallback(() => {
    clearActiveSession();
    setPendingSession(null);
  }, []);

  // ─── Effet principal : crash recovery + AppState listener ─────────────────
  //
  // Pattern identique à TimerContext :
  //   flushRef.current = flush → toujours la version la plus récente,
  //   sans re-registration du listener à chaque render.
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    // ── Crash recovery : vérifier MMKV au démarrage ────────────────────────
    const snapshot = loadActiveSession();
    if (snapshot && isSessionValid(snapshot)) {
      setPendingSession(snapshot);
    }

    // ── AppState listener : flush automatique en background ────────────────
    const subscription = RNAppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          // L'app peut être tuée par l'OS à tout moment en background
          // → flush immédiat pour ne rien perdre
          flushRef.current();
        }
        // Retour en foreground : pendingSession déjà chargé au mount initial
        // Pas d'action supplémentaire nécessaire ici
      },
    );

    return () => {
      // Cleanup : flush le debounce en cours avant démontage
      flushRef.current();
      subscription.remove();
    };
  }, []); // Registration unique — flushRef garantit l'accès à la dernière version

  return { saveImmediate, saveDebounced, flush, pendingSession, dismissPending };
}
