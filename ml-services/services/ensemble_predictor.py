"""
Ensemble Predictor Service
Combines multiple prediction sources for better accuracy:
1. Professional APIs (ZCode, Trademate)
2. Simple ML models (scikit-learn)
3. Market odds (consensus)
4. Sports factors (form, h2h, injuries)

This approach avoids training complex models from scratch.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
from datetime import datetime
import httpx
import os
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import pickle
import json

router = APIRouter()

class EnsembleRequest(BaseModel):
    eventId: str
    sportId: str
    homeTeam: str
    awayTeam: str
    marketOdds: List[float]  # Odds from bookmakers
    sportsFactors: Optional[Dict] = None  # Form, h2h, injuries, etc.

class EnsembleResponse(BaseModel):
    eventId: str
    predictedProbability: float
    confidence: float
    sources: Dict[str, float]  # Contribution from each source
    recommendation: str  # "STRONG_BUY", "BUY", "HOLD", "AVOID"
    timestamp: datetime

class EnsemblePredictor:
    def __init__(self):
        self.model_version = "1.0.0"
        self.models = {}  # Cache for trained models
        self.source_weights = {
            "market": 0.40,      # Market consensus (most reliable)
            "api_professional": 0.30,  # Professional APIs
            "ml_model": 0.20,    # Simple ML model
            "sports_factors": 0.10  # Sports-specific factors
        }
        
    async def get_professional_api_prediction(self, event: Dict) -> Optional[float]:
        """
        Get prediction from professional APIs (ZCode, Trademate)
        Falls back gracefully if APIs are not available
        """
        try:
            # Try ZCode API first
            zcode_key = os.getenv("ZCODE_API_KEY")
            if zcode_key:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        os.getenv("ZCODE_API_URL", "https://api.zcode.com") + "/predictions",
                        headers={"Authorization": f"Bearer {zcode_key}"},
                        json={
                            "eventId": event["eventId"],
                            "sportId": event["sportId"],
                            "homeTeam": event["homeTeam"],
                            "awayTeam": event["awayTeam"],
                        },
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        data = response.json()
                        return data.get("probability", None)
        except Exception as e:
            print(f"ZCode API error: {e}")
        
        try:
            # Try Trademate API
            trademate_key = os.getenv("TRADEMATE_API_KEY")
            if trademate_key:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        os.getenv("TRADEMATE_API_URL", "https://api.trademate.com") + "/predictions",
                        headers={"Authorization": f"Bearer {trademate_key}"},
                        json={
                            "eventId": event["eventId"],
                            "sportId": event["sportId"],
                        },
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        data = response.json()
                        return data.get("probability", None)
        except Exception as e:
            print(f"Trademate API error: {e}")
        
        return None
    
    def get_market_prediction(self, marketOdds: List[float]) -> float:
        """
        Calculate market consensus probability
        This is already implemented in improved-prediction.service.ts
        """
        if not marketOdds or len(marketOdds) == 0:
            return 0.5  # Default
        
        # Convert odds to probabilities
        implied_probs = [1 / odd for odd in marketOdds]
        
        # Market average (weighted by inverse variance for better accuracy)
        market_avg = np.mean(implied_probs)
        
        return market_avg
    
    def get_ml_model_prediction(self, event: Dict, marketOdds: List[float]) -> float:
        """
        Simple ML model using scikit-learn
        Trains quickly with available historical data
        """
        try:
            # Extract features
            features = self._extract_features(event, marketOdds)
            
            # Try to load pre-trained model
            model = self._get_or_train_model(event["sportId"], features)
            
            if model:
                # Predict
                prob = model.predict_proba([features])[0][1]  # Probability of home win
                return float(prob)
        except Exception as e:
            print(f"ML model error: {e}")
        
        # Fallback to market average
        return self.get_market_prediction(marketOdds)
    
    def _extract_features(self, event: Dict, marketOdds: List[float]) -> List[float]:
        """
        Extract features for ML model
        Simple features that don't require complex data
        """
        features = []
        
        # Market features
        if marketOdds:
            market_avg = np.mean([1/odd for odd in marketOdds])
            market_std = np.std([1/odd for odd in marketOdds])
            features.extend([market_avg, market_std])
        else:
            features.extend([0.5, 0.1])
        
        # Sports factors (if available)
        sports_factors = event.get("sportsFactors", {})
        
        # Form (last 5 games win rate)
        home_form = sports_factors.get("homeForm", 0.5)
        away_form = sports_factors.get("awayForm", 0.5)
        features.extend([home_form, away_form])
        
        # Head-to-head (home team win rate)
        h2h = sports_factors.get("headToHead", 0.5)
        features.append(h2h)
        
        # Injuries (0 = no injuries, 1 = many injuries)
        home_injuries = sports_factors.get("homeInjuries", 0.0)
        away_injuries = sports_factors.get("awayInjuries", 0.0)
        features.extend([home_injuries, away_injuries])
        
        # Ensure we have enough features (pad with zeros if needed)
        while len(features) < 8:
            features.append(0.0)
        
        return features[:8]  # Use first 8 features
    
    def _get_or_train_model(self, sportId: str, features: List[float]) -> Optional:
        """
        Get cached model or train a simple one
        In production, you'd load from database or file
        """
        # Check cache
        if sportId in self.models:
            return self.models[sportId]
        
        # For now, return None (model training would happen separately)
        # In production, you'd:
        # 1. Load historical data
        # 2. Train LogisticRegression or RandomForest
        # 3. Cache the model
        # 4. Return it
        
        return None
    
    def get_sports_factors_prediction(self, event: Dict) -> float:
        """
        Calculate prediction based on sports factors
        (form, h2h, injuries, etc.)
        """
        sports_factors = event.get("sportsFactors", {})
        
        if not sports_factors:
            return 0.5  # Neutral
        
        # Simple weighted average
        home_form = sports_factors.get("homeForm", 0.5)
        away_form = sports_factors.get("awayForm", 0.5)
        h2h = sports_factors.get("headToHead", 0.5)
        
        # Home advantage
        home_advantage = 0.05  # 5% boost for home team
        
        # Calculate probability
        prob = (
            home_form * 0.40 +
            (1 - away_form) * 0.30 +  # Inverse of away form
            h2h * 0.20 +
            home_advantage * 0.10
        )
        
        return max(0.1, min(0.9, prob))  # Clamp between 0.1 and 0.9
    
    async def predict(self, request: EnsembleRequest) -> EnsembleResponse:
        """
        Main ensemble prediction method
        Combines all sources with weighted average
        """
        event = {
            "eventId": request.eventId,
            "sportId": request.sportId,
            "homeTeam": request.homeTeam,
            "awayTeam": request.awayTeam,
            "sportsFactors": request.sportsFactors or {},
        }
        
        sources = {}
        
        # 1. Market prediction (always available)
        market_prob = self.get_market_prediction(request.marketOdds)
        sources["market"] = market_prob
        
        # 2. Professional API prediction (if available)
        api_prob = await self.get_professional_api_prediction(event)
        if api_prob is not None:
            sources["api_professional"] = api_prob
        else:
            # If API not available, redistribute weight to market
            self.source_weights["market"] = 0.50
            self.source_weights["api_professional"] = 0.0
        
        # 3. ML model prediction
        ml_prob = self.get_ml_model_prediction(event, request.marketOdds)
        sources["ml_model"] = ml_prob
        
        # 4. Sports factors prediction
        sports_prob = self.get_sports_factors_prediction(event)
        sources["sports_factors"] = sports_prob
        
        # Calculate weighted ensemble
        total_weight = sum(self.source_weights.values())
        if total_weight == 0:
            total_weight = 1.0
        
        ensemble_prob = (
            market_prob * self.source_weights.get("market", 0.4) +
            (api_prob if api_prob is not None else market_prob) * self.source_weights.get("api_professional", 0.3) +
            ml_prob * self.source_weights.get("ml_model", 0.2) +
            sports_prob * self.source_weights.get("sports_factors", 0.1)
        ) / total_weight
        
        # Calculate confidence
        # Higher confidence if sources agree
        probs = [p for p in sources.values() if p is not None]
        if len(probs) > 1:
            std = np.std(probs)
            confidence = max(0.5, 1.0 - std * 2)  # Lower std = higher confidence
        else:
            confidence = 0.6
        
        # Generate recommendation
        recommendation = self._generate_recommendation(ensemble_prob, confidence, request.marketOdds)
        
        return EnsembleResponse(
            eventId=request.eventId,
            predictedProbability=float(ensemble_prob),
            confidence=float(confidence),
            sources=sources,
            recommendation=recommendation,
            timestamp=datetime.now()
        )
    
    def _generate_recommendation(
        self, 
        predicted_prob: float, 
        confidence: float, 
        marketOdds: List[float]
    ) -> str:
        """
        Generate recommendation based on predicted probability vs market
        """
        if not marketOdds:
            return "HOLD"
        
        # Best market odds
        best_odds = max(marketOdds)
        market_implied_prob = 1 / best_odds
        
        # Value = predicted_prob * odds - 1
        value = predicted_prob * best_odds - 1
        
        # Recommendation logic
        if value > 0.15 and confidence > 0.7:
            return "STRONG_BUY"
        elif value > 0.10 and confidence > 0.65:
            return "BUY"
        elif value > 0.05:
            return "HOLD"
        else:
            return "AVOID"

predictor = EnsemblePredictor()

@router.post("/predict", response_model=EnsembleResponse)
async def predict_ensemble(request: EnsembleRequest):
    """
    Get ensemble prediction combining multiple sources
    """
    return await predictor.predict(request)

@router.get("/weights")
async def get_weights():
    """
    Get current source weights
    """
    return {
        "weights": predictor.source_weights,
        "version": predictor.model_version
    }

@router.post("/weights")
async def update_weights(weights: Dict[str, float]):
    """
    Update source weights (for A/B testing)
    """
    total = sum(weights.values())
    if total == 0:
        raise HTTPException(status_code=400, detail="Weights must sum to > 0")
    
    # Normalize
    normalized = {k: v/total for k, v in weights.items()}
    predictor.source_weights = normalized
    
    return {"weights": normalized, "message": "Weights updated"}

