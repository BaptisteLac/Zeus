-- Table pour stocker l'état complet de l'application par utilisateur
CREATE TABLE workout_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX idx_workout_states_user_id ON workout_states(user_id);
CREATE INDEX idx_workout_states_updated_at ON workout_states(updated_at DESC);

-- Fonction pour auto-update du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_states_updated_at
  BEFORE UPDATE ON workout_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE workout_states ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateur peut lire uniquement ses données
CREATE POLICY "Users can read own state"
  ON workout_states FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : utilisateur peut insérer ses données
CREATE POLICY "Users can insert own state"
  ON workout_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : utilisateur peut mettre à jour ses données
CREATE POLICY "Users can update own state"
  ON workout_states FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : utilisateur peut supprimer ses données
CREATE POLICY "Users can delete own state"
  ON workout_states FOR DELETE
  USING (auth.uid() = user_id);
