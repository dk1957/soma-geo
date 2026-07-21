-- ==============================================================
-- 1️⃣  Ensure the onboarding_status enum exists
-- ==============================================================

DO $$
BEGIN
    CREATE TYPE onboarding_status AS ENUM (
        'never_started',
        'in_progress',
        'completed',
        'abandoned'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;   -- already present
END $$;

-- ==============================================================
-- 2️⃣  Extend the public.profiles table (idempotent)
-- ==============================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_status onboarding_status
        DEFAULT 'never_started',
    ADD COLUMN IF NOT EXISTS onboarding_started_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS onboarding_step          INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS onboarding_metadata      JSONB  DEFAULT '{}';

-- ==============================================================
-- 3️⃣  Back‑fill rows that already marked onboarding_completed = true
-- ==============================================================

UPDATE public.profiles
SET
    onboarding_status       = 'completed',
    onboarding_completed_at = COALESCE(updated_at, created_at),
    onboarding_step        = 100
WHERE onboarding_completed = true;

-- ==============================================================
-- 4️⃣  Clean‑up: drop dependent objects in the correct order
-- ==============================================================

-- 4a – drop the trigger that calls handle_new_user()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4b – now drop the functions themselves
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_onboarding_status(uuid, onboarding_status, integer, jsonb);
DROP FUNCTION IF EXISTS public.get_user_onboarding_status(uuid);

-- ==============================================================
-- 5️⃣  Re‑create the functions
-- ==============================================================

/* --------------------------------------------------------------
   5a. update_onboarding_status
   -------------------------------------------------------------- */
CREATE FUNCTION public.update_onboarding_status(
    p_user_id   UUID,
    p_status    onboarding_status,
    p_step      INTEGER DEFAULT NULL,
    p_metadata  JSONB   DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_profile   JSONB;
    current_status   onboarding_status;
BEGIN
    -- current status (needed for transition logic)
    SELECT onboarding_status
      INTO current_status
      FROM public.profiles
     WHERE user_id = p_user_id;

    UPDATE public.profiles
       SET onboarding_status       = p_status,
           onboarding_step         = COALESCE(p_step, onboarding_step),
           onboarding_metadata     = COALESCE(p_metadata, onboarding_metadata),
           onboarding_started_at   = CASE
                                        WHEN p_status = 'in_progress'
                                         AND current_status = 'never_started'
                                        THEN now()
                                        ELSE onboarding_started_at
                                    END,
           onboarding_completed_at = CASE
                                        WHEN p_status = 'completed'
                                        THEN now()
                                        ELSE onboarding_completed_at
                                    END,
           onboarding_completed    = CASE
                                        WHEN p_status = 'completed'
                                        THEN true
                                        ELSE onboarding_completed
                                    END,
           updated_at              = now()
     WHERE user_id = p_user_id
  RETURNING to_jsonb(profiles.*) INTO result_profile;

    RETURN result_profile;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error',   true,
            'message', SQLERRM,
            'code',    SQLSTATE
        );
END;
$$;

/* --------------------------------------------------------------
   5b. get_user_onboarding_status
   -------------------------------------------------------------- */
CREATE FUNCTION public.get_user_onboarding_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_data JSONB;
BEGIN
    SELECT jsonb_build_object(
               'user_id',               user_id,
               'onboarding_status',    onboarding_status,
               'onboarding_step',      onboarding_step,
               'onboarding_started_at',onboarding_started_at,
               'onboarding_completed_at',onboarding_completed_at,
               'onboarding_metadata',  onboarding_metadata,
               'onboarding_completed', onboarding_completed
           )
      INTO profile_data
      FROM public.profiles
     WHERE user_id = p_user_id;

    RETURN COALESCE(
        profile_data,
        jsonb_build_object(
            'error',   true,
            'message', 'User profile not found'
        )
    );
END;
$$;

/* --------------------------------------------------------------
   5c. handle_new_user (trigger function)
   -------------------------------------------------------------- */
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        onboarding_status,
        onboarding_step,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'never_started',
        0,
        now(),
        now()
    );
    RETURN NEW;
END;
$$;

-- ==============================================================
-- 6️⃣  Re‑create the trigger that calls handle_new_user()
-- ==============================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================
-- 7️⃣  Grant execute rights to the authenticated role
-- ==============================================================

GRANT EXECUTE ON FUNCTION public.update_onboarding_status(uuid, onboarding_status, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_onboarding_status(uuid) TO authenticated;

-- ==============================================================
-- 8️⃣  Indexes for fast queries
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status
    ON public.profiles (onboarding_status);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id_onboarding
    ON public.profiles (user_id, onboarding_status);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_dates
    ON public.profiles (onboarding_started_at, onboarding_completed_at);

-- ==============================================================
-- 9️⃣  Row‑Level Security policies
-- ==============================================================

CREATE POLICY "Users can view their own onboarding status"
    ON public.profiles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own onboarding status"
    ON public.profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- ==============================================================
-- 1️⃣0️⃣  View for admin analytics
-- ==============================================================

CREATE OR REPLACE VIEW public.onboarding_analytics AS
SELECT
    onboarding_status,
    COUNT(*)                                                       AS user_count,
    AVG(EXTRACT(EPOCH FROM (onboarding_completed_at - onboarding_started_at)) / 3600)
                                                                    AS avg_completion_hours,
    COUNT(*) FILTER (WHERE onboarding_completed_at IS NOT NULL
                     AND onboarding_started_at IS NOT NULL)    AS completed_count,
    COUNT(*) FILTER (WHERE onboarding_status = 'abandoned')      AS abandoned_count
FROM public.profiles
WHERE onboarding_status != 'never_started'
GROUP BY onboarding_status;

-- ==============================================================
-- 1️⃣1️⃣  Documentation comments
-- ==============================================================

COMMENT ON TABLE public.profiles IS
    'User profiles with enhanced onboarding tracking';

COMMENT ON COLUMN public.profiles.onboarding_status IS
    'Current onboarding state: never_started, in_progress, completed, abandoned';

COMMENT ON COLUMN public.profiles.onboarding_step IS
    'Current step in onboarding process (0‑100)';

COMMENT ON COLUMN public.profiles.onboarding_metadata IS
    'Additional onboarding data like step details, preferences, etc.';

COMMENT ON FUNCTION public.update_onboarding_status IS
    'Updates user onboarding status with proper state transitions and timestamps';

COMMENT ON FUNCTION public.get_user_onboarding_status IS
    'Retrieves comprehensive onboarding status for a user';