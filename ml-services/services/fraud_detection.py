"""
Fraud Detection Service
ML-based detection of match-fixing, arbitrage, collusion, etc.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from datetime import datetime, timedelta

router = APIRouter()

class BetPattern(BaseModel):
    userId: str
    bets: List[dict]
    timeframe: str  # "1h", "24h", "7d"

class FraudAlert(BaseModel):
    type: str
    severity: str
    description: str
    userId: Optional[str] = None
    eventId: Optional[str] = None
    confidence: float
    timestamp: datetime

class FraudDetector:
    def __init__(self):
        # In production, load trained ML models
        pass
    
    def detect_match_fixing(self, eventId: str, betPatterns: List[BetPattern]) -> List[FraudAlert]:
        """
        Detect potential match-fixing based on betting patterns
        """
        alerts = []
        
        # Pattern 1: Unusual betting volume on unlikely outcome
        for pattern in betPatterns:
            if len(pattern.bets) > 0:
                # Check for large bets on high odds
                large_high_odds = [
                    b for b in pattern.bets
                    if b.get("stake", 0) > 5000 and b.get("odds", 0) > 5
                ]
                
                if len(large_high_odds) > 3:
                    alerts.append(FraudAlert(
                        type="MATCH_FIXING",
                        severity="HIGH",
                        description=f"Multiple large bets on high odds detected",
                        userId=pattern.userId,
                        eventId=eventId,
                        confidence=0.75,
                        timestamp=datetime.now()
                    ))
        
        # Pattern 2: Coordinated betting (multiple users, same selection)
        if len(betPatterns) > 5:
            # Check if many users bet on same unlikely outcome
            selections = {}
            for pattern in betPatterns:
                for bet in pattern.bets:
                    selection = bet.get("selection")
                    if selection:
                        if selection not in selections:
                            selections[selection] = []
                        selections[selection].append(pattern.userId)
            
            for selection, users in selections.items():
                if len(users) > 10:
                    # Check if odds are high (unlikely outcome)
                    # This would require odds data
                    alerts.append(FraudAlert(
                        type="COLLUSION",
                        severity="MEDIUM",
                        description=f"{len(users)} users bet on same selection: {selection}",
                        eventId=eventId,
                        confidence=0.65,
                        timestamp=datetime.now()
                    ))
        
        return alerts
    
    def detect_arbitrage(self, userId: str, bets: List[dict]) -> List[FraudAlert]:
        """
        Detect arbitrage betting patterns
        """
        alerts = []
        
        # Pattern: Many small bets across different outcomes of same event
        event_bets = {}
        for bet in bets:
            event_id = bet.get("eventId")
            if event_id:
                if event_id not in event_bets:
                    event_bets[event_id] = []
                event_bets[event_id].append(bet)
        
        for event_id, event_bet_list in event_bets.items():
            if len(event_bet_list) >= 3:
                # Check if betting on multiple outcomes
                selections = set(b.get("selection") for b in event_bet_list)
                if len(selections) >= 3:
                    # Potential arbitrage
                    total_stake = sum(b.get("stake", 0) for b in event_bet_list)
                    alerts.append(FraudAlert(
                        type="ARBITRAGE",
                        severity="MEDIUM",
                        description=f"Potential arbitrage: betting on {len(selections)} outcomes of same event",
                        userId=userId,
                        eventId=event_id,
                        confidence=0.70,
                        timestamp=datetime.now()
                    ))
        
        return alerts
    
    def detect_account_fraud(self, userId: str, accountData: dict) -> List[FraudAlert]:
        """
        Detect account-level fraud
        """
        alerts = []
        
        # Pattern 1: Rapid account creation and betting
        account_age_days = accountData.get("ageDays", 0)
        total_bets = accountData.get("totalBets", 0)
        
        if account_age_days < 1 and total_bets > 20:
            alerts.append(FraudAlert(
                type="ACCOUNT_FRAUD",
                severity="HIGH",
                description="New account with suspiciously high betting activity",
                userId=userId,
                confidence=0.80,
                timestamp=datetime.now()
            ))
        
        # Pattern 2: Unusual deposit/withdrawal patterns
        deposits = accountData.get("deposits", [])
        withdrawals = accountData.get("withdrawals", [])
        
        if len(withdrawals) > len(deposits) * 2:
            alerts.append(FraudAlert(
                type="ACCOUNT_FRAUD",
                severity="MEDIUM",
                description="Unusual withdrawal pattern detected",
                userId=userId,
                confidence=0.65,
                timestamp=datetime.now()
            ))
        
        return alerts
    
    def analyze_bet_pattern(self, pattern: BetPattern) -> List[FraudAlert]:
        """
        Comprehensive bet pattern analysis
        """
        alerts = []
        
        # Check for rapid betting
        if len(pattern.bets) > 50:
            time_span = self._calculate_time_span(pattern.bets)
            if time_span < 3600:  # Less than 1 hour
                alerts.append(FraudAlert(
                    type="RAPID_BETTING",
                    severity="MEDIUM",
                    description=f"{len(pattern.bets)} bets in {time_span}s",
                    userId=pattern.userId,
                    confidence=0.70,
                    timestamp=datetime.now()
                ))
        
        # Check for arbitrage
        arbitrage_alerts = self.detect_arbitrage(pattern.userId, pattern.bets)
        alerts.extend(arbitrage_alerts)
        
        return alerts
    
    def _calculate_time_span(self, bets: List[dict]) -> int:
        """Calculate time span of bets in seconds"""
        if len(bets) < 2:
            return 0
        
        timestamps = [b.get("timestamp") for b in bets if b.get("timestamp")]
        if len(timestamps) < 2:
            return 0
        
        timestamps.sort()
        return (timestamps[-1] - timestamps[0]).total_seconds()

detector = FraudDetector()

@router.post("/match-fixing")
async def detect_match_fixing(eventId: str, betPatterns: List[BetPattern]):
    """Detect potential match-fixing"""
    return detector.detect_match_fixing(eventId, betPatterns)

@router.post("/arbitrage")
async def detect_arbitrage(userId: str, bets: List[dict]):
    """Detect arbitrage patterns"""
    return detector.detect_arbitrage(userId, bets)

@router.post("/account-fraud")
async def detect_account_fraud(userId: str, accountData: dict):
    """Detect account-level fraud"""
    return detector.detect_account_fraud(userId, accountData)

@router.post("/analyze-pattern")
async def analyze_bet_pattern(pattern: BetPattern):
    """Comprehensive bet pattern analysis"""
    return detector.analyze_bet_pattern(pattern)

