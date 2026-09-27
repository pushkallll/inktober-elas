-- 0004_user_moderation_feedback.sql
-- Allow users to view moderation actions on their own submissions (e.g. feedback for revisions)

CREATE POLICY "Users can view moderation actions on their submissions" ON public.moderation_actions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.submissions 
        WHERE id = target_submission_id AND user_id = auth.uid()
    )
);

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
