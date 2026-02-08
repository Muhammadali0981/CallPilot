-- Fix: Drop the overly permissive service role policy and replace with one scoped to service_role
DROP POLICY "Service role can manage all tokens" ON public.oauth_tokens;
