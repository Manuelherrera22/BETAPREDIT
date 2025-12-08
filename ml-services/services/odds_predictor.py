"""
Odds Predictor Service
Uses ML models to predict and set odds for sports events
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from datetime import datetime
import httpx
import os

router = APIRouter()

class OddsRequest(BaseModel):
    eventId: str
    sportId: str
    homeTeam: str
    awayTeam: str
    historicalData: Optional[dict] = None
    playerData: Optional[dict] = None

class OddsResponse(BaseModel):
    eventId: str
    marketId: str
    selections: List[dict]
    confidence: float
    modelVersion: str
    timestamp: datetime

class OddsPredictor:
    def __init__(self):
        self.model_version = "1.0.0"
        # In production, load trained models here
        # self.model = load_model('models/odds_predictor.h5')
    
    def predict_odds(self, request: OddsRequest) -> OddsResponse:
        """
        Predict odds for an event using ML models
        """
        try:
            # Simulate ML prediction
            # In production, this would:
            # 1. Load historical data
            # 2. Extract features (team stats, player stats, etc.)
            # 3. Run through ML model
            # 4. Calculate probabilities
            # 5. Convert to decimal odds with margin
            
            # Mock prediction for now
            home_prob = 0.45
            draw_prob = 0.25
            away_prob = 0.30
            
            # Apply margin (5%)
            margin = 0.05
            home_prob *= (1 - margin)
            draw_prob *= (1 - margin)
            away_prob *= (1 - margin)
            
            # Convert to decimal odds
            home_odds = 1 / home_prob if home_prob > 0 else 100
            draw_odds = 1 / draw_prob if draw_prob > 0 else 100
            away_odds = 1 / away_prob if away_prob > 0 else 100
            
            selections = [
                {
                    "selection": "home",
                    "decimal": round(home_odds, 2),
                    "probability": round(home_prob, 4),
                    "american": self._decimal_to_american(home_odds),
                },
                {
                    "selection": "draw",
                    "decimal": round(draw_odds, 2),
                    "probability": round(draw_prob, 4),
                    "american": self._decimal_to_american(draw_odds),
                },
                {
                    "selection": "away",
                    "decimal": round(away_odds, 2),
                    "probability": round(away_prob, 4),
                    "american": self._decimal_to_american(away_odds),
                },
            ]
            
            return OddsResponse(
                eventId=request.eventId,
                marketId="match_winner",
                selections=selections,
                confidence=0.85,  # Model confidence
                modelVersion=self.model_version,
                timestamp=datetime.now()
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
    
    def predict_over_under(self, eventId: str, line: float) -> dict:
        """
        Predict over/under odds for a specific line
        """
        # Mock prediction
        over_prob = 0.52
        under_prob = 0.48
        
        margin = 0.05
        over_prob *= (1 - margin)
        under_prob *= (1 - margin)
        
        return {
            "line": line,
            "over": {
                "decimal": round(1 / over_prob, 2),
                "probability": round(over_prob, 4),
            },
            "under": {
                "decimal": round(1 / under_prob, 2),
                "probability": round(under_prob, 4),
            },
        }
    
    def update_odds_live(self, eventId: str, currentScore: dict, timeElapsed: int) -> dict:
        """
        Update odds in real-time based on live match data
        """
        # In production, this would use a live model that adjusts probabilities
        # based on current score, time remaining, etc.
        
        # Mock live adjustment
        home_advantage = 0.1 if currentScore.get("home", 0) > currentScore.get("away", 0) else -0.1
        
        return {
            "eventId": eventId,
            "adjustment": home_advantage,
            "timestamp": datetime.now().isoformat(),
        }
    
    def _decimal_to_american(self, decimal: float) -> int:
        """Convert decimal odds to American format"""
        if decimal >= 2.0:
            return int((decimal - 1) * 100)
        else:
            return int(-100 / (decimal - 1))

predictor = OddsPredictor()

@router.post("/predict", response_model=OddsResponse)
async def predict_odds(request: OddsRequest):
    """Predict odds for an event"""
    return predictor.predict_odds(request)

@router.post("/over-under")
async def predict_over_under(eventId: str, line: float):
    """Predict over/under odds"""
    return predictor.predict_over_under(eventId, line)

@router.post("/live-update")
async def update_odds_live(eventId: str, currentScore: dict, timeElapsed: int):
    """Update odds in real-time"""
    return predictor.update_odds_live(eventId, currentScore, timeElapsed)

@router.get("/model-info")
async def get_model_info():
    """Get information about the current ML model"""
    return {
        "version": predictor.model_version,
        "type": "Neural Network",
        "features": [
            "team_stats",
            "player_stats",
            "head_to_head",
            "home_away_form",
            "injuries",
            "weather",
        ],
        "last_trained": "2024-01-01T00:00:00Z",
    }

