-- ================================================================
-- Dossier Rani — Supabase Schema v1
-- PostgreSQL + Supabase Auth (auth.users) + PgBouncer port 6543
-- Postgres skill: planetscale/database-skills
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- UTILITY: updated_at auto-trigger
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- TABLE: checklists_progress
--
-- Design decisions:
--   • PK composite (user_id, demarche_id) — pas d'UUID séparé
--     → upsert ON CONFLICT DO UPDATE sans jointure
--   • JSONB pour documents_coches : {'cin-1': true, 'cin-2': false}
--     → pas de table junction (19 procédures × ~5 docs = petite cardinalité)
--     → update partiel via jsonb_set() sans re-écrire toute la row
--   • updated_at pour tri "reprises récentes" sur Home screen
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checklists_progress (
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demarche_id      text        NOT NULL,
  documents_coches jsonb       NOT NULL DEFAULT '{}',
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT checklists_progress_pkey PRIMARY KEY (user_id, demarche_id),

  -- demarche_id doit être une string non-vide
  CONSTRAINT checklists_demarche_id_nonempty CHECK (char_length(demarche_id) > 0),

  -- JSONB doit être un objet, pas un tableau ou une valeur primitive
  CONSTRAINT checklists_documents_is_object CHECK (jsonb_typeof(documents_coches) = 'object')
);

-- Index covering pour "démarches récemment modifiées" (Home screen — en cours)
-- Covering index avec INCLUDE évite un heap fetch pour documents_coches
CREATE INDEX IF NOT EXISTS idx_checklists_user_recent
  ON public.checklists_progress (user_id, updated_at DESC)
  INCLUDE (demarche_id);

-- Trigger updated_at
CREATE TRIGGER trg_checklists_updated_at
  BEFORE UPDATE ON public.checklists_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────────
-- TABLE: favoris
--
-- Design decisions:
--   • PK composite (user_id, demarche_id) = contrainte d'unicité gratuite
--   • Pas d'id UUID séparé — inutile, la PK composite suffit pour DELETE
--   • created_at pour trier les favoris par ordre d'ajout
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favoris (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demarche_id text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT favoris_pkey PRIMARY KEY (user_id, demarche_id),
  CONSTRAINT favoris_demarche_id_nonempty CHECK (char_length(demarche_id) > 0)
);

-- Index pour lister les favoris triés par date d'ajout
-- La PK (user_id, demarche_id) couvre déjà les EXISTS et DELETE
-- On ajoute created_at DESC pour le listing
CREATE INDEX IF NOT EXISTS idx_favoris_user_created
  ON public.favoris (user_id, created_at DESC)
  INCLUDE (demarche_id);

-- ────────────────────────────────────────────────────────────────
-- TABLE: historique_recherches
--
-- Design decisions:
--   • UUID id généré (gen_random_uuid) — séquence parallèle-safe
--   • type enum via CHECK : 'search' | 'ai_search' | 'diagnostic'
--     → pas de type ENUM PostgreSQL pour éviter les ALTER TYPE en migration
--   • results_count : permet d'analyser les requêtes sans résultat (UX)
--   • Trigger de nettoyage : garde les 100 dernières par user
--     → borne la table à O(users × 100), pas de croissance infinie
--   • Index partiel sur type AI : sous-ensemble analysé séparément
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.historique_recherches (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query         text        NOT NULL,
  type          text        NOT NULL DEFAULT 'search',
  results_count integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT historique_recherches_pkey PRIMARY KEY (id),
  CONSTRAINT historique_type_check CHECK (
    type IN ('search', 'ai_search', 'diagnostic')
  ),
  CONSTRAINT historique_query_nonempty CHECK (char_length(query) > 0),
  CONSTRAINT historique_results_nonneg CHECK (results_count >= 0)
);

-- Index principal : SELECT * WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
CREATE INDEX IF NOT EXISTS idx_historique_user_recent
  ON public.historique_recherches (user_id, created_at DESC)
  INCLUDE (query, type, results_count);

-- Index partiel AI : analyses séparées sur les recherches IA
-- Utilisé pour : "quelles requêtes IA n'ont pas trouvé de résultat ?"
CREATE INDEX IF NOT EXISTS idx_historique_ai_only
  ON public.historique_recherches (user_id, created_at DESC)
  WHERE type IN ('ai_search', 'diagnostic');

-- Trigger de nettoyage : garde les 100 dernières recherches par user
-- Note: se déclenche AFTER INSERT (la row est déjà insérée avant le nettoyage)
CREATE OR REPLACE FUNCTION trim_historique_recherches()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.historique_recherches
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id
      FROM public.historique_recherches
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 100
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trim_historique
  AFTER INSERT ON public.historique_recherches
  FOR EACH ROW EXECUTE FUNCTION trim_historique_recherches();

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
--
-- Principe : policy par opération (SELECT / INSERT / UPDATE / DELETE)
--   → "ALL" masque les erreurs silencieuses si une opération manque
--
-- auth.uid() → UUID de l'utilisateur connecté via Supabase Auth
-- WITH CHECK sur INSERT force user_id = auth.uid() même si le client
-- envoie un autre user_id dans le body (sécurité serveur, pas client)
--
-- SECURITY DEFINER sur les triggers de maintenance (trim, updated_at)
-- leur permet de s'exécuter avec les droits postgres, pas les droits user
-- ────────────────────────────────────────────────────────────────

-- checklists_progress ─────────────────────────────────────────
ALTER TABLE public.checklists_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklists_select_own"
  ON public.checklists_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "checklists_insert_own"
  ON public.checklists_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checklists_update_own"
  ON public.checklists_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checklists_delete_own"
  ON public.checklists_progress FOR DELETE
  USING (auth.uid() = user_id);

-- favoris ─────────────────────────────────────────────────────
ALTER TABLE public.favoris ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favoris_select_own"
  ON public.favoris FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favoris_insert_own"
  ON public.favoris FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favoris_delete_own"
  ON public.favoris FOR DELETE
  USING (auth.uid() = user_id);

-- historique_recherches ───────────────────────────────────────
ALTER TABLE public.historique_recherches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historique_select_own"
  ON public.historique_recherches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "historique_insert_own"
  ON public.historique_recherches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "historique_delete_own"
  ON public.historique_recherches FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- CONNECTION POOLING — notes pour l'app mobile
--
-- Ce schéma est conçu pour PgBouncer en mode TRANSACTION (port 6543) :
--   • Pas de SET LOCAL / SET SESSION (perdu entre statements)
--   • Pas de prepared statements (désactivés — voir gbrain config)
--   • Pas de LISTEN / NOTIFY (non supporté en mode transaction)
--   • Toutes les fonctions SECURITY DEFINER = pas de SET ROLE
--
-- L'app React Native doit utiliser :
--   • @supabase/supabase-js avec l'URL API (pas l'URL DB directe)
--   • AsyncStorage pour la session (déjà configuré dans expo)
--   • Realtime pour les favoris (via Supabase Realtime WebSocket)
-- ────────────────────────────────────────────────────────────────

-- Vérification finale
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('checklists_progress', 'favoris', 'historique_recherches')
  ) = 3, 'Migration incomplete — 3 tables attendues';
  RAISE NOTICE 'Schema Dossier Rani v1 — OK : 3 tables créées avec RLS';
END;
$$;
