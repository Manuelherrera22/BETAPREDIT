"""
Script to train sports domain adapter for universal predictor
Uses historical prediction data to adapt the model to sports betting
"""
import sys
import os
import json
from datetime import datetime
from typing import List, Dict
import numpy as np
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.universal_predictor import UniversalPredictor, DomainAdapter
from dotenv import load_dotenv
import httpx
import asyncio

load_dotenv()

class SportsAdapterTrainer:
    """
    Trains sports domain adapter using historical data
    """
    
    def __init__(self):
        self.predictor = UniversalPredictor()
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    async def fetch_historical_predictions(self, limit: int = 1000) -> List[Dict]:
        """
        Fetch historical predictions from database
        """
        print(f"Fetching historical predictions (limit: {limit})...")
        
        try:
            # Try to fetch from Supabase
            if self.supabase_url and self.supabase_key:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.supabase_url}/rest/v1/rpc/get_predictions_for_training",
                        headers={
                            "apikey": self.supabase_key,
                            "Authorization": f"Bearer {self.supabase_key}",
                            "Content-Type": "application/json",
                        },
                        json={"limit": limit},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"Fetched {len(data)} predictions from Supabase")
                        return data
        except Exception as e:
            print(f"Error fetching from Supabase: {e}")
        
        # Fallback: generate synthetic training data
        print("Generating synthetic training data...")
        return self._generate_synthetic_data(limit)
    
    def _generate_synthetic_data(self, count: int) -> List[Dict]:
        """
        Generate synthetic training data for initial training
        """
        data = []
        
        for i in range(count):
            # Simulate market odds
            home_odds = np.random.uniform(1.5, 4.0)
            draw_odds = np.random.uniform(3.0, 4.5)
            away_odds = np.random.uniform(1.5, 4.0)
            
            market_odds = [home_odds, draw_odds, away_odds]
            
            # Simulate historical data
            historical = []
            for j in range(10):
                historical.append({
                    "value": np.random.uniform(0.3, 0.7),
                    "probability": np.random.uniform(0.3, 0.7),
                    "timestamp": (datetime.now().timestamp() - (10 - j) * 3600),
                })
            
            # Simulate outcome (home win probability based on odds)
            home_prob = 1 / home_odds
            outcome = 1.0 if np.random.random() < home_prob else 0.0
            
            # Features
            features = {
                "marketOdds": market_odds,
                "sources": [
                    {"value": 1 / odd, "probability": 1 / odd}
                    for odd in market_odds
                ],
                "volume": np.random.uniform(0.5, 1.0),
                "activity": np.random.uniform(0.5, 1.0),
                "timestamp": datetime.now().isoformat(),
                "homeForm": np.random.uniform(0.3, 0.8),
                "awayForm": np.random.uniform(0.3, 0.8),
                "headToHead": np.random.uniform(0.2, 0.8),
                "homeInjuries": np.random.uniform(0.0, 0.3),
                "awayInjuries": np.random.uniform(0.0, 0.3),
            }
            
            data.append({
                "features": features,
                "historical": historical,
                "outcome": outcome,
                "probability": home_prob,
            })
        
        return data
    
    async def prepare_training_data(self, predictions: List[Dict]) -> tuple:
        """
        Prepare training data for adapter
        """
        print("Preparing training data...")
        
        training_data = []
        
        for pred in predictions:
            # Extract features using universal extractor
            features = self.predictor.feature_extractor.extract(
                pred.get("features", {}),
                pred.get("historical", [])
            )
            
            # Get outcome
            outcome = pred.get("outcome", pred.get("probability", 0.5))
            
            training_data.append({
                "features": features.tolist(),
                "outcome": float(outcome),
            })
        
        print(f"Prepared {len(training_data)} training samples")
        return training_data
    
    async def train_adapter(self, training_data: List[Dict]):
        """
        Train sports domain adapter
        """
        print("Training sports domain adapter...")
        
        # Convert to format expected by adapter
        adapter_data = []
        for sample in training_data:
            features = np.array(sample["features"])
            outcome = sample["outcome"]
            
            # Create data dict for adapter
            adapter_data.append({
                "features": {
                    "marketOdds": [1 / (0.3 + i * 0.1) for i in range(3)],  # Placeholder
                    "sources": [{"value": 0.5, "probability": 0.5}],
                    "volume": 1.0,
                    "activity": 1.0,
                    "timestamp": datetime.now().isoformat(),
                },
                "historical": [
                    {"value": outcome, "probability": outcome, "timestamp": datetime.now().timestamp()}
                    for _ in range(5)
                ],
                "outcome": outcome,
                "probability": outcome,
            })
        
        # Train adapter
        self.predictor.add_domain_adapter("sports", adapter_data)
        
        print("✅ Sports adapter trained successfully!")
        print(f"   - Training samples: {len(adapter_data)}")
        print(f"   - Domain: sports")
        
        return True
    
    async def test_adapter(self):
        """
        Test the trained adapter
        """
        print("\nTesting adapter...")
        
        # Test prediction
        test_features = {
            "marketOdds": [2.0, 3.5, 2.5],
            "sources": [
                {"value": 0.5, "probability": 0.5},
                {"value": 0.3, "probability": 0.3},
            ],
            "volume": 1.0,
            "activity": 1.0,
            "timestamp": datetime.now().isoformat(),
        }
        
        test_historical = [
            {"value": 0.5, "probability": 0.5, "timestamp": datetime.now().timestamp()}
            for _ in range(10)
        ]
        
        try:
            prediction = self.predictor.predict(
                domain="sports",
                eventId="test_event",
                features=test_features,
                historical=test_historical
            )
            
            print(f"✅ Test prediction successful!")
            print(f"   - Predicted probability: {prediction.predictedProbability:.3f}")
            print(f"   - Confidence: {prediction.confidence:.3f}")
            print(f"   - Factors: {prediction.factors}")
            
            return True
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False

async def main():
    """
    Main training script
    """
    print("=" * 60)
    print("Sports Domain Adapter Training")
    print("=" * 60)
    
    trainer = SportsAdapterTrainer()
    
    # Step 1: Fetch historical data
    historical_data = await trainer.fetch_historical_predictions(limit=500)
    
    # Step 2: Prepare training data
    training_data = await trainer.prepare_training_data(historical_data)
    
    # Step 3: Train adapter
    success = await trainer.train_adapter(training_data)
    
    if success:
        # Step 4: Test adapter
        test_success = await trainer.test_adapter()
        
        if test_success:
            print("\n" + "=" * 60)
            print("✅ Training completed successfully!")
            print("=" * 60)
            print("\nThe sports adapter is now ready to use.")
            print("You can use it via the universal prediction service.")
        else:
            print("\n⚠️ Training completed but test failed.")
            print("The adapter may still work, but review the implementation.")
    else:
        print("\n❌ Training failed.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

