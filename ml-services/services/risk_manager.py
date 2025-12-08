"""
Risk Management Service
ML-based risk assessment and exposure management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from datetime import datetime

router = APIRouter()

class ExposureRequest(BaseModel):
    eventId: str
    marketId: str
    currentExposure: dict
    recentBets: List[dict]

class RiskAssessment(BaseModel):
    eventId: str
    riskLevel: str  # LOW, MEDIUM, HIGH, CRITICAL
    exposure: float
    recommendedAction: str
    confidence: float

class RiskManager:
    def __init__(self):
        self.risk_thresholds = {
            "LOW": 1000,
            "MEDIUM": 5000,
            "HIGH": 20000,
            "CRITICAL": 50000,
        }
    
    def assess_risk(self, request: ExposureRequest) -> RiskAssessment:
        """
        Assess risk for an event/market based on current exposure
        """
        total_exposure = sum(request.currentExposure.values())
        
        # Determine risk level
        if total_exposure < self.risk_thresholds["LOW"]:
            risk_level = "LOW"
            action = "NONE"
        elif total_exposure < self.risk_thresholds["MEDIUM"]:
            risk_level = "MEDIUM"
            action = "MONITOR"
        elif total_exposure < self.risk_thresholds["HIGH"]:
            risk_level = "HIGH"
            action = "ADJUST_ODDS"
        else:
            risk_level = "CRITICAL"
            action = "SUSPEND_MARKET"
        
        # Analyze bet patterns
        if len(request.recentBets) > 10:
            # Check for unusual betting patterns
            large_bets = [b for b in request.recentBets if b.get("stake", 0) > 1000]
            if len(large_bets) > 5:
                risk_level = "HIGH"
                action = "ADJUST_ODDS"
        
        return RiskAssessment(
            eventId=request.eventId,
            riskLevel=risk_level,
            exposure=total_exposure,
            recommendedAction=action,
            confidence=0.9,
        )
    
    def calculate_optimal_margin(self, eventId: str, marketType: str) -> float:
        """
        Calculate optimal margin based on market conditions
        """
        # In production, this would use ML to determine optimal margin
        # based on volatility, competition, etc.
        base_margin = 0.05  # 5%
        
        # Adjust based on market type
        if marketType == "MATCH_WINNER":
            return base_margin
        elif marketType == "OVER_UNDER":
            return base_margin + 0.02  # Higher margin for O/U
        else:
            return base_margin + 0.03
    
    def suggest_odds_adjustment(self, eventId: str, selection: str, currentOdds: float, exposure: float) -> dict:
        """
        Suggest how to adjust odds to balance exposure
        """
        # If exposure is high on one side, reduce odds (increase probability)
        # to discourage more bets
        
        if exposure > 10000:
            # Reduce odds by 5-10%
            adjustment_factor = 0.90
            new_odds = currentOdds * adjustment_factor
        elif exposure > 5000:
            adjustment_factor = 0.95
            new_odds = currentOdds * adjustment_factor
        else:
            adjustment_factor = 1.0
            new_odds = currentOdds
        
        return {
            "selection": selection,
            "currentOdds": currentOdds,
            "suggestedOdds": round(new_odds, 2),
            "adjustmentFactor": adjustment_factor,
            "reason": f"Exposure: ${exposure:,.2f}",
        }

risk_manager = RiskManager()

@router.post("/assess", response_model=RiskAssessment)
async def assess_risk(request: ExposureRequest):
    """Assess risk for an event"""
    return risk_manager.assess_risk(request)

@router.get("/margin/{eventId}")
async def get_optimal_margin(eventId: str, marketType: str):
    """Get optimal margin for a market"""
    margin = risk_manager.calculate_optimal_margin(eventId, marketType)
    return {
        "eventId": eventId,
        "marketType": marketType,
        "optimalMargin": margin,
        "timestamp": datetime.now().isoformat(),
    }

@router.post("/suggest-adjustment")
async def suggest_odds_adjustment(eventId: str, selection: str, currentOdds: float, exposure: float):
    """Suggest odds adjustment based on exposure"""
    return risk_manager.suggest_odds_adjustment(eventId, selection, currentOdds, exposure)

