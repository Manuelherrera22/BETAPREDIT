"""
AutoML Trainer Service
Automatically trains and optimizes models using AutoML
Supports multiple AutoML frameworks:
- Auto-sklearn (recommended for structured data)
- AutoGluon (best for tabular data, modern)
- TPOT (genetic programming)

This service automatically:
1. Trains models with best hyperparameters
2. Selects best algorithm
3. Creates ensembles
4. Optimizes for your specific data
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Literal
import numpy as np
import pandas as pd
from datetime import datetime
import os
import pickle
import json

router = APIRouter()

# Try to import AutoML libraries
try:
    import autosklearn.classification
    import autosklearn.regression
    AUTOSKLEARN_AVAILABLE = True
except ImportError:
    AUTOSKLEARN_AVAILABLE = False

try:
    from autogluon.tabular import TabularPredictor
    AUTOGLUON_AVAILABLE = True
except ImportError:
    AUTOGLUON_AVAILABLE = False

try:
    from tpot import TPOTClassifier, TPOTRegressor
    TPOT_AVAILABLE = True
except ImportError:
    TPOT_AVAILABLE = False

class TrainingRequest(BaseModel):
    framework: Literal["autosklearn", "autogluon", "tpot"] = "autogluon"
    domain: str = "sports"
    trainingData: List[Dict]  # Features and labels
    task: Literal["classification", "regression"] = "classification"
    timeLimit: int = 3600  # Time limit in seconds (1 hour default)
    metric: Optional[str] = None  # Metric to optimize

class TrainingResponse(BaseModel):
    success: bool
    framework: str
    domain: str
    modelPath: str
    accuracy: float
    trainingTime: float
    bestModel: str
    features: List[str]
    timestamp: datetime

class AutoMLTrainer:
    """
    AutoML Trainer that automatically finds best models
    """
    
    def __init__(self):
        self.models_dir = os.path.join(os.path.dirname(__file__), "../../models")
        os.makedirs(self.models_dir, exist_ok=True)
        self.trained_models = {}
    
    def prepare_data(self, training_data: List[Dict]) -> tuple:
        """
        Prepare data for training
        Returns: (X, y) where X is features and y is labels
        """
        if not training_data:
            raise ValueError("Training data is empty")
        
        # Extract features and labels
        features_list = []
        labels_list = []
        feature_names = None
        
        for sample in training_data:
            # Get features
            if isinstance(sample.get("features"), dict):
                features = sample["features"]
                if feature_names is None:
                    feature_names = list(features.keys())
                feature_vector = [features.get(name, 0.0) for name in feature_names]
            elif isinstance(sample.get("features"), list):
                feature_vector = sample["features"]
                if feature_names is None:
                    feature_names = [f"feature_{i}" for i in range(len(feature_vector))]
            else:
                raise ValueError("Features must be dict or list")
            
            # Get label
            label = sample.get("outcome", sample.get("label", sample.get("probability", 0.5)))
            
            features_list.append(feature_vector)
            labels_list.append(label)
        
        X = np.array(features_list)
        y = np.array(labels_list)
        
        # For classification, convert to binary if needed
        if len(np.unique(y)) == 2:
            y = (y > 0.5).astype(int)
        
        return X, y, feature_names
    
    def train_autosklearn(
        self,
        X: np.array,
        y: np.array,
        task: str,
        time_limit: int
    ) -> tuple:
        """
        Train using Auto-sklearn
        """
        if not AUTOSKLEARN_AVAILABLE:
            raise ImportError("Auto-sklearn not installed. Install with: pip install auto-sklearn")
        
        start_time = datetime.now()
        
        if task == "classification":
            automl = autosklearn.classification.AutoSklearnClassifier(
                time_left_for_this_task=time_limit,
                per_run_time_limit=time_limit // 10,
                memory_limit=4096,
                n_jobs=-1,
                metric=autosklearn.metrics.accuracy,
            )
        else:
            automl = autosklearn.regression.AutoSklearnRegressor(
                time_left_for_this_task=time_limit,
                per_run_time_limit=time_limit // 10,
                memory_limit=4096,
                n_jobs=-1,
                metric=autosklearn.metrics.r2,
            )
        
        automl.fit(X, y)
        
        training_time = (datetime.now() - start_time).total_seconds()
        score = automl.score(X, y)
        best_model = str(automl.show_models())
        
        return automl, score, training_time, best_model
    
    def train_autogluon(
        self,
        X: np.array,
        y: np.array,
        feature_names: List[str],
        task: str,
        time_limit: int
    ) -> tuple:
        """
        Train using AutoGluon (RECOMMENDED - Best for tabular data)
        """
        if not AUTOGLUON_AVAILABLE:
            raise ImportError("AutoGluon not installed. Install with: pip install autogluon")
        
        start_time = datetime.now()
        
        # Create DataFrame
        df = pd.DataFrame(X, columns=feature_names)
        df['target'] = y
        
        # Determine problem type
        if task == "classification":
            problem_type = "binary" if len(np.unique(y)) == 2 else "multiclass"
        else:
            problem_type = "regression"
        
        # Train
        predictor = TabularPredictor(
            label='target',
            problem_type=problem_type,
            eval_metric='accuracy' if task == "classification" else 'root_mean_squared_error'
        ).fit(
            df,
            time_limit=time_limit,
            presets='best_quality',  # Best quality preset
            verbosity=2
        )
        
        training_time = (datetime.now() - start_time).total_seconds()
        
        # Evaluate - use leaderboard for more accurate score
        leaderboard = predictor.leaderboard(df, silent=True)
        if len(leaderboard) > 0:
            # Get score from best model in leaderboard (more accurate)
            best_model = leaderboard.iloc[0]['model']
            score = leaderboard.iloc[0]['score_val']  # Validation score (more accurate)
        else:
            best_model = "Unknown"
            score = predictor.evaluate(df)
            if isinstance(score, dict):
                score = score.get('accuracy', score.get('root_mean_squared_error', 0.0))
        
        return predictor, score, training_time, best_model
    
    def train_tpot(
        self,
        X: np.array,
        y: np.array,
        task: str,
        time_limit: int
    ) -> tuple:
        """
        Train using TPOT (Genetic Programming)
        """
        if not TPOT_AVAILABLE:
            raise ImportError("TPOT not installed. Install with: pip install tpot")
        
        start_time = datetime.now()
        
        if task == "classification":
            tpot = TPOTClassifier(
                generations=5,
                population_size=20,
                verbosity=2,
                max_time_mins=time_limit // 60,
                n_jobs=-1,
                random_state=42
            )
        else:
            tpot = TPOTRegressor(
                generations=5,
                population_size=20,
                verbosity=2,
                max_time_mins=time_limit // 60,
                n_jobs=-1,
                random_state=42
            )
        
        tpot.fit(X, y)
        
        training_time = (datetime.now() - start_time).total_seconds()
        score = tpot.score(X, y)
        best_model = str(tpot.fitted_pipeline_)
        
        return tpot, score, training_time, best_model
    
    async def train(
        self,
        request: TrainingRequest
    ) -> TrainingResponse:
        """
        Main training method
        Automatically selects and trains best model
        """
        try:
            # Prepare data
            X, y, feature_names = self.prepare_data(request.trainingData)
            
            print(f"Training with {len(X)} samples, {len(feature_names)} features")
            print(f"Framework: {request.framework}, Task: {request.task}")
            
            # Train based on framework
            if request.framework == "autogluon":
                if not AUTOGLUON_AVAILABLE:
                    raise ImportError("AutoGluon not available. Install with: pip install autogluon")
                model, score, training_time, best_model = self.train_autogluon(
                    X, y, feature_names, request.task, request.timeLimit
                )
            elif request.framework == "autosklearn":
                if not AUTOSKLEARN_AVAILABLE:
                    raise ImportError("Auto-sklearn not available. Install with: pip install auto-sklearn")
                model, score, training_time, best_model = self.train_autosklearn(
                    X, y, request.task, request.timeLimit
                )
            elif request.framework == "tpot":
                if not TPOT_AVAILABLE:
                    raise ImportError("TPOT not available. Install with: pip install tpot")
                model, score, training_time, best_model = self.train_tpot(
                    X, y, request.task, request.timeLimit
                )
            else:
                raise ValueError(f"Unknown framework: {request.framework}")
            
            # Save model
            model_path = os.path.join(
                self.models_dir,
                f"{request.framework}_{request.domain}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
            )
            
            if request.framework == "autogluon":
                # AutoGluon saves automatically
                model_path = model.path
            else:
                with open(model_path, 'wb') as f:
                    pickle.dump(model, f)
            
            # Store in memory
            model_key = f"{request.framework}_{request.domain}"
            self.trained_models[model_key] = {
                "model": model,
                "path": model_path,
                "features": feature_names,
                "score": score,
                "trained_at": datetime.now(),
            }
            
            return TrainingResponse(
                success=True,
                framework=request.framework,
                domain=request.domain,
                modelPath=model_path,
                accuracy=float(score),
                trainingTime=training_time,
                bestModel=best_model,
                features=feature_names,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            print(f"Training error: {e}")
            raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
    
    def predict(self, framework: str, domain: str, features: np.array) -> np.array:
        """
        Make predictions with trained model
        """
        model_key = f"{framework}_{domain}"
        if model_key not in self.trained_models:
            raise ValueError(f"No trained model found for {framework}_{domain}")
        
        model_info = self.trained_models[model_key]
        model = model_info["model"]
        
        if framework == "autogluon":
            df = pd.DataFrame(features, columns=model_info["features"])
            predictions = model.predict(df)
        else:
            predictions = model.predict(features)
        
        return predictions

trainer = AutoMLTrainer()

@router.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """
    Train model using AutoML
    Automatically finds best algorithm and hyperparameters
    """
    return await trainer.train(request)

@router.post("/predict")
async def predict_with_automl(
    framework: str,
    domain: str,
    features: List[List[float]]
):
    """
    Make predictions with trained AutoML model
    """
    try:
        X = np.array(features)
        predictions = trainer.predict(framework, domain, X)
        return {
            "success": True,
            "predictions": predictions.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available")
async def get_available_frameworks():
    """
    Get list of available AutoML frameworks
    """
    return {
        "autosklearn": AUTOSKLEARN_AVAILABLE,
        "autogluon": AUTOGLUON_AVAILABLE,
        "tpot": TPOT_AVAILABLE,
        "recommended": "autogluon" if AUTOGLUON_AVAILABLE else "autosklearn" if AUTOSKLEARN_AVAILABLE else "tpot"
    }

@router.get("/models")
async def get_trained_models():
    """
    Get list of trained models
    """
    models = []
    for key, info in trainer.trained_models.items():
        models.append({
            "key": key,
            "path": info["path"],
            "score": info["score"],
            "features": info["features"],
            "trained_at": info["trained_at"].isoformat()
        })
    return {"models": models}

