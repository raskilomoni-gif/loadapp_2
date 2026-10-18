/*
# Fix mutable search_path on update_trip_updated_at function

Sets an explicit search_path on the trigger function so it is not vulnerable
to search_path hijacking. This is a security hardening fix only — no logic change.
*/

DROP TRIGGER IF EXISTS trg_trips_updated_at ON public.trips;
DROP FUNCTION IF EXISTS public.update_trip_updated_at();

CREATE FUNCTION public.update_trip_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_updated_at();