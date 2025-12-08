"""
Main entry point for ML Services
Runs FastAPI server with all ML endpoints
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

from services.odds_predictor import router as odds_router
from services.risk_manager import router as risk_router
from services.fraud_detection import router as fraud_router
from services.rg_detector import router as rg_router

load_dotenv()

app = FastAPI(
    title="BETAPREDIT ML Services",
    description="Machine Learning services for odds prediction, risk management, fraud detection, and responsible gaming",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(odds_router, prefix="/api/odds", tags=["Odds Prediction"])
app.include_router(risk_router, prefix="/api/risk", tags=["Risk Management"])
app.include_router(fraud_router, prefix="/api/fraud", tags=["Fraud Detection"])
app.include_router(rg_router, prefix="/api/rg", tags=["Responsible Gaming"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-services",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    port = int(os.getenv("ML_API_PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

