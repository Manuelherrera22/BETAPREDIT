"""
Script to train models using AutoML with data from provider
Automatically finds best model and hyperparameters
"""
import sys
import os
import asyncio
from datetime import datetime
from typing import List, Dict
import numpy as np

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.automl_trainer import AutoMLTrainer, TrainingRequest
from services.advanced_feature_engineering import AdvancedFeatureEngineering
from dotenv import load_dotenv
import httpx
import os

# Load .env from multiple possible locations
load_dotenv()  # Current directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))  # Root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))  # ml-services directory

class AutoMLTrainingScript:
    """
    Script to train models using AutoML with provider data
    """
    
    def __init__(self):
        self.trainer = AutoMLTrainer()
        self.feature_engineer = AdvancedFeatureEngineering()
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    async def fetch_training_data(self, limit: int = 1000, min_confidence: float = 0.0) -> List[Dict]:
        """
        Fetch training data from Supabase with real prediction outcomes
        """
        print(f"📊 Fetching training data from Supabase (limit: {limit}, min_confidence: {min_confidence})...")
        
        try:
            # Try Supabase
            if self.supabase_url and self.supabase_key:
                async with httpx.AsyncClient() as client:
                    # Get predictions with actual results from finished events
                    response = await client.post(
                        f"{self.supabase_url}/rest/v1/rpc/get_predictions_for_training",
                        headers={
                            "apikey": self.supabase_key,
                            "Authorization": f"Bearer {self.supabase_key}",
                            "Content-Type": "application/json",
                            "Prefer": "return=representation"
                        },
                        json={
                            "limit_count": limit,
                            "min_confidence": min_confidence,
                            "start_date": None,
                            "end_date": None
                        },
                        timeout=60.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if isinstance(data, list) and len(data) > 0:
                            print(f"✅ Fetched {len(data)} real prediction samples from Supabase")
                            formatted = self._format_training_data(data)
                            print(f"✅ Formatted {len(formatted)} training samples")
                            return formatted
                        else:
                            print(f"⚠️ No data returned from Supabase (empty result)")
                    else:
                        print(f"⚠️ Supabase returned status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            print(f"⚠️ Error fetching from Supabase: {e}")
            import traceback
            traceback.print_exc()
        
        # Fallback: generate synthetic data for initial training
        print("📊 Generating synthetic training data (fallback)...")
        return self._generate_synthetic_data(limit)
    
    def _format_training_data(self, raw_data: List[Dict]) -> List[Dict]:
        """
        Format raw data from Supabase for AutoML training
        Extracts features from real prediction data
        """
        training_data = []
        
        for item in raw_data:
            # Extract features
            features = {}
            
            # 1. Predicted probability and confidence (core features)
            if item.get("predicted_probability") is not None:
                features["predicted_probability"] = float(item["predicted_probability"])
            if item.get("confidence") is not None:
                features["confidence"] = float(item["confidence"])
            
            # 2. Market odds (if available)
            avg_odds = item.get("avg_odds")
            if avg_odds is not None and avg_odds > 0:
                features["market_avg"] = 1.0 / float(avg_odds)  # Convert odds to probability
            else:
                # Try to extract from market_odds JSON
                market_odds = item.get("market_odds")
                if market_odds and isinstance(market_odds, list) and len(market_odds) > 0:
                    odds_values = [float(o.get("decimal", 0)) for o in market_odds if o.get("decimal")]
                    if odds_values:
                        probs = [1.0 / o for o in odds_values if o > 0]
                        features["market_avg"] = np.mean(probs) if probs else 0.5
                        features["market_std"] = np.std(probs) if len(probs) > 1 else 0.1
                else:
                    features["market_avg"] = 0.5  # Default
                    features["market_std"] = 0.1
            
            # 3. Factors from JSON (if available) - EXTRACT ALL ADVANCED FEATURES
            factors = item.get("factors")
            if factors:
                if isinstance(factors, str):
                    try:
                        import json
                        factors = json.loads(factors)
                    except:
                        factors = {}
                
                if isinstance(factors, dict):
                    # Basic factors
                    features.update({
                        "trend": float(factors.get("trend", 0.0)),
                        "volatility": float(factors.get("volatility", 0.5)),
                        "momentum": float(factors.get("momentum", 0.0)),
                        "consensus": float(factors.get("consensus", 0.7)),
                    })
                    
                    # Market intelligence features
                    if "market" in factors and isinstance(factors["market"], dict):
                        market = factors["market"]
                        features.update({
                            "market_consensus": float(market.get("consensus", 0.7)),
                            "market_efficiency": float(market.get("efficiency", 0.9)),
                            "sharp_money_indicator": float(market.get("sharpMoneyIndicator", 0.5)),
                            "value_opportunity": float(market.get("valueOpportunity", 0.02)),
                            "odds_spread": float(market.get("oddsSpread", 0.1)),
                        })
                    
                    # Home team form features
                    if "homeForm" in factors and isinstance(factors["homeForm"], dict):
                        home_form = factors["homeForm"]
                        features.update({
                            "home_win_rate_5": float(home_form.get("winRate5", 0.5)),
                            "home_win_rate_10": float(home_form.get("winRate10", 0.5)),
                            "home_goals_for_avg_5": float(home_form.get("goalsForAvg5", 1.5)),
                            "home_goals_against_avg_5": float(home_form.get("goalsAgainstAvg5", 1.5)),
                            "home_current_streak": float(home_form.get("currentStreak", 0.0)),
                            "home_form_trend": float(home_form.get("formTrend", 0.0)),
                        })
                    
                    # Away team form features
                    if "awayForm" in factors and isinstance(factors["awayForm"], dict):
                        away_form = factors["awayForm"]
                        features.update({
                            "away_win_rate_5": float(away_form.get("winRate5", 0.5)),
                            "away_win_rate_10": float(away_form.get("winRate10", 0.5)),
                            "away_goals_for_avg_5": float(away_form.get("goalsForAvg5", 1.5)),
                            "away_goals_against_avg_5": float(away_form.get("goalsAgainstAvg5", 1.5)),
                            "away_current_streak": float(away_form.get("currentStreak", 0.0)),
                            "away_form_trend": float(away_form.get("formTrend", 0.0)),
                        })
                    
                    # H2H features
                    if "h2h" in factors and isinstance(factors["h2h"], dict):
                        h2h = factors["h2h"]
                        features.update({
                            "h2h_win_rate_team1": float(h2h.get("team1WinRate", 0.5)),
                            "h2h_draw_rate": float(h2h.get("drawRate", 0.25)),
                            "h2h_total_goals_avg": float(h2h.get("totalGoalsAvg", 3.0)),
                            "h2h_recent_trend": float(h2h.get("recentTrend", 0.0)),
                        })
                    
                    # Relative features
                    features.update({
                        "form_advantage": float(factors.get("formAdvantage", 0.0)),
                        "goals_advantage": float(factors.get("goalsAdvantage", 0.0)),
                        "defense_advantage": float(factors.get("defenseAdvantage", 0.0)),
                    })
                    
                    # Market average from factors (if available)
                    if "marketAverage" in factors:
                        features["market_avg_from_factors"] = float(factors["marketAverage"])
                    if "marketConsensus" in factors:
                        features["market_consensus_from_factors"] = float(factors["marketConsensus"])
                    if "valueAdjustment" in factors:
                        features["value_adjustment"] = float(factors["valueAdjustment"])
            
            # 4. Time-based features
            if item.get("days_until_event") is not None:
                features["days_until_event"] = float(item["days_until_event"])
            
            # 5. Market type (encoded)
            market_type = item.get("market_type", "")
            features["is_match_winner"] = 1.0 if market_type == "MATCH_WINNER" else 0.0
            features["is_over_under"] = 1.0 if market_type == "OVER_UNDER" else 0.0
            
            # 6. Accuracy (if available, can be used as feature)
            if item.get("accuracy") is not None:
                features["historical_accuracy"] = float(item["accuracy"])
            
            # Outcome (label) - MUST have this for training
            outcome = None
            if item.get("was_correct") is not None:
                outcome = 1.0 if item["was_correct"] else 0.0
            elif item.get("actual_result"):
                outcome = 1.0 if item["actual_result"] == "WON" else 0.0
            
            # Only include if we have a valid outcome
            if outcome is not None:
                training_data.append({
                    "features": features,
                    "outcome": outcome,
                    "label": outcome,
                    "probability": outcome,
                })
        
        return training_data
    
    def _generate_synthetic_data(self, count: int) -> List[Dict]:
        """
        Generate synthetic training data
        """
        data = []
        
        for i in range(count):
            # Simulate realistic features
            market_avg = np.random.uniform(0.3, 0.7)
            market_std = np.random.uniform(0.05, 0.2)
            trend = np.random.uniform(-0.3, 0.3)
            volatility = np.random.uniform(0.1, 0.5)
            momentum = np.random.uniform(-0.2, 0.2)
            consensus = np.random.uniform(0.5, 0.9)
            confidence = np.random.uniform(0.6, 0.95)
            
            # Simulate outcome based on features (realistic relationship)
            base_prob = market_avg
            adjusted_prob = base_prob + trend * 0.2 + momentum * 0.1
            adjusted_prob = np.clip(adjusted_prob, 0.0, 1.0)
            
            # Add some noise
            outcome = 1.0 if np.random.random() < adjusted_prob else 0.0
            
            data.append({
                "features": {
                    "market_avg": market_avg,
                    "market_std": market_std,
                    "trend": trend,
                    "volatility": volatility,
                    "momentum": momentum,
                    "consensus": consensus,
                    "confidence": confidence,
                },
                "outcome": outcome,
                "label": outcome,
                "probability": adjusted_prob,
            })
        
        return data
    
    async def train_sports_model(self, framework: str = "autogluon", time_limit: int = 3600, samples: int = 1000, min_confidence: float = 0.0):
        """
        Train sports prediction model using AutoML
        """
        print("=" * 60)
        print("AutoML Training - Sports Domain")
        print("=" * 60)
        print(f"Framework: {framework}")
        print(f"Time limit: {time_limit} seconds ({time_limit//60} minutes)")
        print(f"Samples: {samples}")
        print(f"Min confidence: {min_confidence}")
        print()
        
        # Step 1: Fetch data
        training_data = await self.fetch_training_data(limit=samples, min_confidence=min_confidence)
        
        if len(training_data) < 50:
            print("⚠️ Warning: Less than 50 samples. Results may not be optimal.")
        
        print(f"📊 Training with {len(training_data)} samples")
        print()
        
        # Step 2: Train
        print("🚀 Starting AutoML training...")
        print("   This will automatically:")
        print("   - Try multiple algorithms")
        print("   - Optimize hyperparameters")
        print("   - Create ensembles")
        print("   - Select best model")
        print()
        
        request = TrainingRequest(
            framework=framework,
            domain="sports",
            trainingData=training_data,
            task="classification",
            timeLimit=time_limit,
        )
        
        result = await self.trainer.train(request)
        
        # Step 3: Results
        print()
        print("=" * 60)
        print("✅ Training Completed!")
        print("=" * 60)
        print(f"Framework: {result.framework}")
        print(f"Accuracy: {result.accuracy:.4f} ({result.accuracy*100:.2f}%)")
        print(f"Training time: {result.trainingTime:.1f} seconds")
        print(f"Best model: {result.bestModel[:100]}...")
        print(f"Model saved: {result.modelPath}")
        print(f"Features used: {len(result.features)}")
        print()
        
        return result

async def main():
    """
    Main training script
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Train models with AutoML")
    parser.add_argument(
        "--framework",
        choices=["autogluon", "autosklearn", "tpot"],
        default="autogluon",
        help="AutoML framework to use"
    )
    parser.add_argument(
        "--time-limit",
        type=int,
        default=3600,
        help="Time limit in seconds (default: 3600 = 1 hour)"
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=1000,
        help="Number of training samples (default: 1000)"
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.0,
        help="Minimum confidence threshold for predictions (default: 0.0)"
    )
    
    args = parser.parse_args()
    
    script = AutoMLTrainingScript()
    result = await script.train_sports_model(
        framework=args.framework,
        time_limit=args.time_limit,
        samples=args.samples,
        min_confidence=args.min_confidence
    )
    
    print("🎉 Training complete! Model is ready to use.")
    print(f"   Use the model via: /api/automl/predict?framework={result.framework}&domain=sports")

if __name__ == "__main__":
    asyncio.run(main())

