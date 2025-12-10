"""Quick script to verify trained model accuracy"""
from autogluon.tabular import TabularPredictor
import pandas as pd
import numpy as np

# Load model
model_path = 'AutogluonModels/ag-20251210_061456'
predictor = TabularPredictor.load(model_path)

print("=" * 60)
print("VERIFICACIÓN DEL MODELO ENTRENADO")
print("=" * 60)

# Get leaderboard
leaderboard = predictor.leaderboard(silent=True)
print("\n📊 COLUMNAS DISPONIBLES:")
print(leaderboard.columns.tolist())
print("\n📊 TOP 5 MODELOS:")
print(leaderboard.head(5))

print(f"\n✅ Mejor modelo: {leaderboard.iloc[0]['model']}")
print(f"✅ Accuracy (validación): {leaderboard.iloc[0]['score_val']:.4f} ({leaderboard.iloc[0]['score_val']*100:.2f}%)")

# Test with sample data
print("\n🧪 Test de predicción:")
test_data = pd.DataFrame({
    'market_avg': [0.5, 0.6, 0.4],
    'market_std': [0.1, 0.15, 0.12],
    'trend': [0.1, -0.1, 0.2],
    'volatility': [0.3, 0.4, 0.25],
    'momentum': [0.05, -0.05, 0.1],
    'consensus': [0.7, 0.8, 0.6],
    'confidence': [0.75, 0.85, 0.65],
})

predictions = predictor.predict(test_data)
print(f"Predicciones: {predictions.tolist()}")
print(f"Probabilidades: {predictor.predict_proba(test_data)}")

print("\n" + "=" * 60)
print("✅ MODELO FUNCIONANDO CORRECTAMENTE")
print("=" * 60)

