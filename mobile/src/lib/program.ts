import { Exercise, SessionType } from './types';

const sessionA: Exercise[] = [
  { id: 'a1', name: 'Hack Squat', sets: 4, repsMin: 6, repsMax: 8, rest: 120, rir: '1-2' },
  { id: 'a2', name: 'Développé couché machine', sets: 4, repsMin: 6, repsMax: 10, rest: 90, rir: '1' },
  { id: 'a3', name: 'Pec Deck', sets: 3, repsMin: 12, repsMax: 15, rest: 60, rir: '1' },
  { id: 'a4', name: 'Développé épaules Smith machine', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1-2' },
  { id: 'a5', name: 'Élévations latérales poulie', sets: 4, repsMin: 12, repsMax: 20, rest: 60, rir: '1' },
  { id: 'a6', name: 'Extension triceps corde', sets: 3, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
  { id: 'a7', name: 'Mollet', sets: 2, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
];

const sessionB: Exercise[] = [
  { id: 'b1', name: 'Traction', sets: 4, repsMin: 6, repsMax: 10, rest: 90, rir: '1-2' },
  { id: 'b2', name: 'Rowing convergent', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1-2' },
  { id: 'b3', name: 'Hip Thrust', sets: 3, repsMin: 6, repsMax: 10, rest: 120, rir: '1' },
  { id: 'b4', name: 'Leg curl assis', sets: 3, repsMin: 10, repsMax: 15, rest: 75, rir: '1' },
  { id: 'b5', name: 'Curl incliné haltères', sets: 3, repsMin: 8, repsMax: 12, rest: 75, rir: '1' },
  { id: 'b6', name: 'Curl pupitre machine', sets: 3, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
  { id: 'b7', name: 'Rear Deck', sets: 3, repsMin: 15, repsMax: 20, rest: 60, rir: '1-2' },
];

const sessionC: Exercise[] = [
  { id: 'c1', name: 'Développé couché machine', sets: 4, repsMin: 6, repsMax: 10, rest: 90, rir: '1' },
  { id: 'c2', name: 'Pec Deck', sets: 3, repsMin: 12, repsMax: 20, rest: 60, rir: '1' },
  { id: 'c3', name: 'Élévations latérales poulie', sets: 3, repsMin: 15, repsMax: 20, rest: 50, rir: '1' },
  { id: 'c4', name: 'Dips assistés', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1' },
  { id: 'c5', name: 'Extension triceps corde', sets: 3, repsMin: 12, repsMax: 15, rest: 60, rir: '1' },
  { id: 'c6', name: 'Curl EZ barre', sets: 3, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
  { id: 'c7', name: 'Leg curl extension', sets: 3, repsMin: 12, repsMax: 15, rest: 60, rir: '1' },
];

export const sessions: Record<SessionType, Exercise[]> = {
  A: sessionA,
  B: sessionB,
  C: sessionC,
};

// IDs that get +1 set in Block 2 (shoulders, arms, face pull, dips)
const block2ExtraSetIds = new Set([
  'a4', 'a5', 'a6', // épaules + triceps
  'b5', 'b6', 'b7', // curls + rear delt
  'c3', 'c4', 'c5', 'c6', // latérales, dips, triceps, curl
]);

// IDs for first exercise of each session (Block 3: change rep range to 4-6)
const block3FirstExerciseIds = new Set(['a1', 'b1', 'c1']);

/**
 * Initialise les exercices custom à partir des exercices par défaut.
 * Appelé une seule fois quand customExercises est undefined dans l'état.
 */
export function initCustomExercises(): Record<SessionType, Exercise[]> {
  return {
    A: sessionA.map((ex) => ({ ...ex })),
    B: sessionB.map((ex) => ({ ...ex })),
    C: sessionC.map((ex) => ({ ...ex })),
  };
}

/**
 * Génère un ID unique pour un nouvel exercice dans une session.
 * Format: {session_prefix}{next_number}, ex: "a8", "b9"
 */
export function generateExerciseId(
  session: SessionType,
  existingExercises: Exercise[]
): string {
  const prefix = session.toLowerCase();
  const existingNumbers = existingExercises
    .map((ex) => {
      const match = ex.id.match(new RegExp(`^${prefix}(\\d+)$`));
      return match ? parseInt(match[1]) : 0;
    })
    .filter((n) => n > 0);
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${nextNumber}`;
}

export function getExercisesForSession(
  session: SessionType,
  block: 1 | 2 | 3,
  customExercises?: Record<SessionType, Exercise[]>
): Exercise[] {
  const base = customExercises?.[session] ?? sessions[session];
  return base.map((ex) => {
    let adjusted = { ...ex };

    // Block 2: +1 set on specified exercises
    if (block >= 2 && block2ExtraSetIds.has(ex.id)) {
      adjusted.sets = ex.sets + 1;
    }

    // Block 3: First exercise of each session → 4-6 reps
    if (block === 3 && block3FirstExerciseIds.has(ex.id)) {
      adjusted.repsMin = 4;
      adjusted.repsMax = 6;
    }

    return adjusted;
  });
}

export interface CatalogEntry {
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rest: number;
  rir: string;
  sessions: SessionType[]; // which sessions contain this exercise
}

/**
 * Collects all unique exercises across all sessions into a catalog.
 * Deduplicated by name (case-insensitive). Shows which sessions contain each.
 */
export function getAllExerciseCatalog(
  customExercises?: Record<SessionType, Exercise[]>
): CatalogEntry[] {
  const source = customExercises ?? sessions;
  const map = new Map<string, CatalogEntry>();

  for (const session of ['A', 'B', 'C'] as SessionType[]) {
    for (const ex of source[session]) {
      const key = ex.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        if (!existing.sessions.includes(session)) {
          existing.sessions.push(session);
        }
      } else {
        map.set(key, {
          name: ex.name,
          sets: ex.sets,
          repsMin: ex.repsMin,
          repsMax: ex.repsMax,
          rest: ex.rest,
          rir: ex.rir,
          sessions: [session],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
