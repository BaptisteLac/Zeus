import { Exercise, SessionType } from './types';

const sessionA: Exercise[] = [
  { id: 'a1', name: 'Hack Squat', sets: 4, repsMin: 6, repsMax: 8, rest: 120, rir: '1-2' },
  { id: 'a2', name: 'Développé incliné machine', sets: 4, repsMin: 6, repsMax: 10, rest: 90, rir: '1' },
  { id: 'a3', name: 'Développé épaules machine', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1-2' },
  { id: 'a4', name: 'Élévations latérales machine', sets: 4, repsMin: 12, repsMax: 20, rest: 60, rir: '1' },
  { id: 'a5', name: 'Extension triceps corde', sets: 3, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
];

const sessionB: Exercise[] = [
  { id: 'b1', name: 'Tirage vertical', sets: 4, repsMin: 6, repsMax: 10, rest: 90, rir: '1-2' },
  { id: 'b2', name: 'Rowing convergent', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1-2' },
  { id: 'b3', name: 'Hip Thrust', sets: 3, repsMin: 6, repsMax: 10, rest: 120, rir: '1' },
  { id: 'b4', name: 'Leg curl assis', sets: 3, repsMin: 10, repsMax: 15, rest: 75, rir: '1' },
  { id: 'b5', name: 'Curl incliné haltères', sets: 3, repsMin: 8, repsMax: 12, rest: 75, rir: '1' },
  { id: 'b6', name: 'Curl pupitre machine', sets: 3, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
  { id: 'b7', name: 'Face pull', sets: 2, repsMin: 15, repsMax: 20, rest: 60, rir: '1-2' },
];

const sessionC: Exercise[] = [
  { id: 'c1', name: 'Presse convergente poitrine', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1' },
  { id: 'c2', name: 'Écarté machine', sets: 3, repsMin: 12, repsMax: 20, rest: 60, rir: '1' },
  { id: 'c3', name: 'Élévations latérales poulie', sets: 4, repsMin: 15, repsMax: 20, rest: 50, rir: '1' },
  { id: 'c4', name: 'Oiseau machine', sets: 3, repsMin: 15, repsMax: 20, rest: 60, rir: '1' },
  { id: 'c5', name: 'Dips assistés', sets: 3, repsMin: 8, repsMax: 12, rest: 90, rir: '1' },
  { id: 'c6', name: 'Extension triceps overhead corde', sets: 2, repsMin: 12, repsMax: 15, rest: 60, rir: '1' },
  { id: 'c7', name: 'Curl câble barre', sets: 3, repsMin: 10, repsMax: 15, rest: 60, rir: '1' },
  { id: 'c8', name: 'Leg extension', sets: 3, repsMin: 12, repsMax: 15, rest: 60, rir: '1' },
];

export const sessions: Record<SessionType, Exercise[]> = {
  A: sessionA,
  B: sessionB,
  C: sessionC,
};

// IDs that get +1 set in Block 2 (shoulders, arms, face pull, dips)
const block2ExtraSetIds = new Set([
  'a3', 'a4', 'a5', // épaules + triceps
  'b5', 'b6', 'b7', // curls + face pull
  'c3', 'c4', 'c5', 'c6', 'c7', // latérales, oiseau, dips, triceps, curl
]);

// IDs for first exercise of each session (Block 3: change rep range to 4-6)
const block3FirstExerciseIds = new Set(['a1', 'b1', 'c1']);

export function getExercisesForSession(
  session: SessionType,
  block: 1 | 2 | 3
): Exercise[] {
  return sessions[session].map((ex) => {
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
