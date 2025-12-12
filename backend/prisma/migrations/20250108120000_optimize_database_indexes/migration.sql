-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bet_userId_status_idx" ON "Bet"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bet_userId_createdAt_idx" ON "Bet"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bet_eventId_status_idx" ON "Bet"("eventId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExternalBet_userId_status_idx" ON "ExternalBet"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExternalBet_userId_platform_idx" ON "ExternalBet"("userId", "platform");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExternalBet_userId_betPlacedAt_idx" ON "ExternalBet"("userId", "betPlacedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExternalBet_status_betPlacedAt_idx" ON "ExternalBet"("status", "betPlacedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ValueBetAlert_userId_status_idx" ON "ValueBetAlert"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ValueBetAlert_userId_valuePercentage_idx" ON "ValueBetAlert"("userId", "valuePercentage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ValueBetAlert_status_expiresAt_idx" ON "ValueBetAlert"("status", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ValueBetAlert_status_valuePercentage_idx" ON "ValueBetAlert"("status", "valuePercentage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ValueBetAlert_eventId_status_idx" ON "ValueBetAlert"("eventId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prediction_modelVersion_wasCorrect_idx" ON "Prediction"("modelVersion", "wasCorrect");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prediction_createdAt_wasCorrect_idx" ON "Prediction"("createdAt", "wasCorrect");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prediction_eventId_marketId_selection_idx" ON "Prediction"("eventId", "marketId", "selection");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserStatistics_userId_period_idx" ON "UserStatistics"("userId", "period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserStatistics_period_periodStart_idx" ON "UserStatistics"("period", "periodStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification"("userId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Odds_eventId_marketId_idx" ON "Odds"("eventId", "marketId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Odds_eventId_isActive_idx" ON "Odds"("eventId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Odds_marketId_isActive_idx" ON "Odds"("marketId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OddsHistory_eventId_timestamp_idx" ON "OddsHistory"("eventId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OddsHistory_eventId_marketId_selection_idx" ON "OddsHistory"("eventId", "marketId", "selection");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OddsHistory_marketId_selection_timestamp_idx" ON "OddsHistory"("marketId", "selection", "timestamp");

