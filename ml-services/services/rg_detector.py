"""
Responsible Gaming Detector
ML-based detection of problem gambling patterns
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter()

class UserBehavior(BaseModel):
    userId: str
    bets: List[dict]
    deposits: List[dict]
    sessions: List[dict]
    timeframe: str  # "24h", "7d", "30d"

class RGAlert(BaseModel):
    type: str
    severity: str
    description: str
    userId: str
    recommendation: str
    confidence: float
    timestamp: datetime

class RGDetector:
    def __init__(self):
        # In production, load trained ML models
        pass
    
    def detect_problem_gambling(self, behavior: UserBehavior) -> List[RGAlert]:
        """
        Detect problem gambling patterns using ML
        """
        alerts = []
        
        # Pattern 1: Loss Chasing
        loss_chasing = self._detect_loss_chasing(behavior.bets)
        if loss_chasing:
            alerts.append(RGAlert(
                type="LOSS_CHASING",
                severity="HIGH",
                description="Pattern of increasing bets after losses detected",
                userId=behavior.userId,
                recommendation="Consider setting loss limits or taking a break",
                confidence=loss_chasing["confidence"],
                timestamp=datetime.now()
            ))
        
        # Pattern 2: Late Night Gambling
        late_night = self._detect_late_night(behavior.sessions)
        if late_night:
            alerts.append(RGAlert(
                type="LATE_NIGHT",
                severity="MEDIUM",
                description="Frequent gambling during late night hours (2-6 AM)",
                userId=behavior.userId,
                recommendation="Set session time limits",
                confidence=0.75,
                timestamp=datetime.now()
            ))
        
        # Pattern 3: Rapid Betting
        rapid = self._detect_rapid_betting(behavior.bets)
        if rapid:
            alerts.append(RGAlert(
                type="RAPID_BETTING",
                severity="MEDIUM",
                description=f"Rapid betting pattern: {rapid['count']} bets in {rapid['minutes']} minutes",
                userId=behavior.userId,
                recommendation="Consider setting session time limits",
                confidence=0.70,
                timestamp=datetime.now()
            ))
        
        # Pattern 4: Excessive Deposits
        excessive = self._detect_excessive_deposits(behavior.deposits)
        if excessive:
            alerts.append(RGAlert(
                type="EXCESSIVE_DEPOSITS",
                severity="HIGH",
                description=f"Multiple deposits detected: ${excessive['total']} in {behavior.timeframe}",
                userId=behavior.userId,
                recommendation="Set deposit limits",
                confidence=0.80,
                timestamp=datetime.now()
            ))
        
        # Pattern 5: Chasing Losses with Large Bets
        chasing_large = self._detect_chasing_large_bets(behavior.bets)
        if chasing_large:
            alerts.append(RGAlert(
                type="CHASING_LARGE",
                severity="CRITICAL",
                description="Large bets placed after losses, indicating loss chasing",
                userId=behavior.userId,
                recommendation="Immediate intervention recommended",
                confidence=0.85,
                timestamp=datetime.now()
            ))
        
        return alerts
    
    def _detect_loss_chasing(self, bets: List[dict]) -> Optional[dict]:
        """Detect loss chasing pattern"""
        if len(bets) < 3:
            return None
        
        # Sort by timestamp
        sorted_bets = sorted(bets, key=lambda x: x.get("timestamp", datetime.min))
        
        # Check for pattern: loss followed by larger bet
        for i in range(len(sorted_bets) - 1):
            current = sorted_bets[i]
            next_bet = sorted_bets[i + 1]
            
            if current.get("status") == "LOST" and next_bet.get("stake", 0) > current.get("stake", 0) * 1.5:
                # Loss chasing detected
                return {
                    "confidence": 0.80,
                    "pattern": "increasing_stakes_after_loss"
                }
        
        return None
    
    def _detect_late_night(self, sessions: List[dict]) -> bool:
        """Detect late night gambling (2-6 AM)"""
        late_night_count = 0
        for session in sessions:
            start_time = session.get("startTime")
            if start_time:
                hour = start_time.hour if isinstance(start_time, datetime) else datetime.fromisoformat(str(start_time)).hour
                if 2 <= hour <= 6:
                    late_night_count += 1
        
        return late_night_count >= 3  # 3 or more late night sessions
    
    def _detect_rapid_betting(self, bets: List[dict]) -> Optional[dict]:
        """Detect rapid betting pattern"""
        if len(bets) < 5:
            return None
        
        sorted_bets = sorted(bets, key=lambda x: x.get("timestamp", datetime.min))
        
        # Check last 10 bets
        recent = sorted_bets[-10:]
        if len(recent) < 5:
            return None
        
        first_time = recent[0].get("timestamp")
        last_time = recent[-1].get("timestamp")
        
        if first_time and last_time:
            if isinstance(first_time, str):
                first_time = datetime.fromisoformat(first_time)
            if isinstance(last_time, str):
                last_time = datetime.fromisoformat(last_time)
            
            minutes = (last_time - first_time).total_seconds() / 60
            
            if minutes < 10 and len(recent) >= 5:
                return {
                    "count": len(recent),
                    "minutes": round(minutes, 1),
                }
        
        return None
    
    def _detect_excessive_deposits(self, deposits: List[dict]) -> Optional[dict]:
        """Detect excessive deposit pattern"""
        if len(deposits) < 3:
            return None
        
        total = sum(d.get("amount", 0) for d in deposits)
        count = len(deposits)
        
        # More than 5 deposits or total > $5000
        if count > 5 or total > 5000:
            return {
                "total": total,
                "count": count,
            }
        
        return None
    
    def _detect_chasing_large_bets(self, bets: List[dict]) -> bool:
        """Detect large bets after losses"""
        if len(bets) < 2:
            return False
        
        sorted_bets = sorted(bets, key=lambda x: x.get("timestamp", datetime.min))
        
        for i in range(len(sorted_bets) - 1):
            current = sorted_bets[i]
            next_bet = sorted_bets[i + 1]
            
            # If lost and next bet is large (>$1000)
            if current.get("status") == "LOST" and next_bet.get("stake", 0) > 1000:
                return True
        
        return False
    
    def calculate_risk_score(self, behavior: UserBehavior) -> dict:
        """
        Calculate overall risk score for responsible gaming
        """
        alerts = self.detect_problem_gambling(behavior)
        
        # Calculate risk score (0-100)
        risk_score = 0
        
        for alert in alerts:
            if alert.severity == "CRITICAL":
                risk_score += 30
            elif alert.severity == "HIGH":
                risk_score += 20
            elif alert.severity == "MEDIUM":
                risk_score += 10
        
        # Cap at 100
        risk_score = min(risk_score, 100)
        
        # Determine risk level
        if risk_score >= 70:
            level = "HIGH"
        elif risk_score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"
        
        return {
            "userId": behavior.userId,
            "riskScore": risk_score,
            "riskLevel": level,
            "alerts": len(alerts),
            "recommendations": self._get_recommendations(alerts),
        }
    
    def _get_recommendations(self, alerts: List[RGAlert]) -> List[str]:
        """Get recommendations based on alerts"""
        recommendations = set()
        
        for alert in alerts:
            recommendations.add(alert.recommendation)
        
        return list(recommendations)

detector = RGDetector()

@router.post("/detect", response_model=List[RGAlert])
async def detect_problem_gambling(behavior: UserBehavior):
    """Detect problem gambling patterns"""
    return detector.detect_problem_gambling(behavior)

@router.post("/risk-score")
async def calculate_risk_score(behavior: UserBehavior):
    """Calculate overall risk score"""
    return detector.calculate_risk_score(behavior)

