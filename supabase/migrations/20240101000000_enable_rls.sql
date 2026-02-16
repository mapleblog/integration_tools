-- Enable RLS
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own history records
CREATE POLICY "Users can view own history" ON history
FOR SELECT USING (auth.uid()::text = userId);

-- Policy: Users can only delete their own history records
CREATE POLICY "Users can delete own history" ON history
FOR DELETE USING (auth.uid()::text = userId);

-- Enable RLS for Stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own stats
CREATE POLICY "Users can view own stats" ON user_stats
FOR SELECT USING (auth.uid()::text = userId);
