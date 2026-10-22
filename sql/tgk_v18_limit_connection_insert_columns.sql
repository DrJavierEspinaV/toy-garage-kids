-- Actual migration applied to Supabase: tgk_v18_limit_connection_insert_columns (20261022220734)
-- Do not re-run against this project.
BEGIN; REVOKE INSERT ON public.tgk_connections FROM authenticated; GRANT INSERT(from_store_id,to_store_id) ON public.tgk_connections TO authenticated; COMMIT;