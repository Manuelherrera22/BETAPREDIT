"""Check latest trained model"""
from autogluon.tabular import TabularPredictor
import os

models_dir = 'AutogluonModels'
models = [d for d in os.listdir(models_dir) if os.path.isdir(os.path.join(models_dir, d))]
latest = max(models, key=lambda x: os.path.getmtime(os.path.join(models_dir, x)))

predictor = TabularPredictor.load(f'{models_dir}/{latest}')
leaderboard = predictor.leaderboard(silent=True)

print('='*60)
print('MEJOR MODELO CON MODELOS ADICIONALES')
print('='*60)
print(f'Modelo: {latest}')
print(f'Mejor: {leaderboard.iloc[0]["model"]}')
print(f'Accuracy: {leaderboard.iloc[0]["score_val"]:.4f} ({leaderboard.iloc[0]["score_val"]*100:.2f}%)')
print()
print('TOP 5 MODELOS:')
for i in range(min(5, len(leaderboard))):
    print(f'{i+1}. {leaderboard.iloc[i]["model"]}: {leaderboard.iloc[i]["score_val"]*100:.2f}%')

