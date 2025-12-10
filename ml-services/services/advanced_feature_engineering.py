"""
Advanced Feature Engineering for Sports Predictions
Creates sophisticated features to make our system the most advanced in the market
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import math

class AdvancedFeatureEngineering:
    """
    Advanced feature engineering for sports predictions
    Creates features that give us competitive advantage
    """
    
    def __init__(self):
        self.feature_cache = {}
    
    def calculate_technical_indicators(self, odds_history: List[float]) -> Dict[str, float]:
        """
        Calculate advanced technical indicators from odds history
        Similar to stock market technical analysis
        """
        if not odds_history or len(odds_history) < 2:
            return {
                'rsi': 50.0,
                'macd': 0.0,
                'macd_signal': 0.0,
                'bollinger_upper': 0.0,
                'bollinger_lower': 0.0,
                'bollinger_middle': 0.0,
                'momentum_14': 0.0,
                'stochastic': 50.0,
            }
        
        # Convert odds to probabilities for analysis
        probs = [1.0 / odd for odd in odds_history if odd > 0]
        if len(probs) < 2:
            probs = [0.5, 0.5]
        
        features = {}
        
        # 1. RSI (Relative Strength Index) - 14 period
        features['rsi'] = self._calculate_rsi(probs, period=min(14, len(probs)))
        
        # 2. MACD (Moving Average Convergence Divergence)
        macd_result = self._calculate_macd(probs)
        features['macd'] = macd_result['macd']
        features['macd_signal'] = macd_result['signal']
        features['macd_histogram'] = macd_result['histogram']
        
        # 3. Bollinger Bands
        bb = self._calculate_bollinger_bands(probs, period=min(20, len(probs)))
        features['bollinger_upper'] = bb['upper']
        features['bollinger_lower'] = bb['lower']
        features['bollinger_middle'] = bb['middle']
        features['bollinger_width'] = bb['width']
        features['bollinger_position'] = bb['position']  # Where current price is in band (0-1)
        
        # 4. Momentum (14 period)
        features['momentum_14'] = self._calculate_momentum(probs, period=min(14, len(probs)))
        
        # 5. Stochastic Oscillator
        features['stochastic'] = self._calculate_stochastic(probs, period=min(14, len(probs)))
        
        # 6. Support and Resistance levels
        sr = self._calculate_support_resistance(probs)
        features['support_level'] = sr['support']
        features['resistance_level'] = sr['resistance']
        features['distance_to_support'] = sr['distance_to_support']
        features['distance_to_resistance'] = sr['distance_to_resistance']
        
        # 7. Volume Profile (if we had volume data)
        # For now, use odds count as proxy
        features['market_activity'] = len(odds_history) / 100.0  # Normalize
        
        return features
    
    def calculate_market_intelligence(self, 
                                     all_odds: List[float],
                                     bookmaker_weights: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        """
        Advanced market intelligence features
        Detects sharp money, line movement, market efficiency
        """
        if not all_odds or len(all_odds) == 0:
            return self._default_market_features()
        
        probs = [1.0 / odd for odd in all_odds if odd > 0]
        if len(probs) == 0:
            return self._default_market_features()
        
        features = {}
        
        # 1. Market Consensus (how much bookmakers agree)
        mean_prob = np.mean(probs)
        std_prob = np.std(probs)
        features['market_consensus'] = 1.0 - min(std_prob * 2, 0.5)  # 0-1 scale
        features['market_std'] = std_prob
        
        # 2. Sharp Money Detection
        # Sharp bettors typically bet on value, causing line movement
        # If odds are moving in one direction, sharp money might be involved
        features['sharp_money_indicator'] = self._detect_sharp_money(probs)
        
        # 3. Market Efficiency Score
        # How efficient is the market? (lower = more inefficiency = more opportunity)
        features['market_efficiency'] = 1.0 - std_prob  # Inverse of std
        
        # 4. Value Concentration
        # Are odds clustered around certain values? (indicates market confidence)
        features['value_concentration'] = self._calculate_value_concentration(probs)
        
        # 5. Bookmaker Disagreement
        # High disagreement = opportunity
        features['bookmaker_disagreement'] = std_prob * 2  # Amplify for visibility
        
        # 6. Market Depth
        # How many bookmakers are offering odds? (more = more reliable)
        features['market_depth'] = min(len(all_odds) / 20.0, 1.0)  # Normalize to 0-1
        
        # 7. Best vs Worst Odds Spread
        if len(all_odds) > 1:
            best_odd = max(all_odds)
            worst_odd = min(all_odds)
            features['odds_spread'] = (best_odd - worst_odd) / worst_odd
            features['value_opportunity'] = features['odds_spread'] * features['bookmaker_disagreement']
        else:
            features['odds_spread'] = 0.0
            features['value_opportunity'] = 0.0
        
        # 8. Implied Probability Range
        features['prob_min'] = min(probs)
        features['prob_max'] = max(probs)
        features['prob_range'] = features['prob_max'] - features['prob_min']
        
        # 9. Median vs Mean (detects skew)
        median_prob = np.median(probs)
        features['prob_skew'] = mean_prob - median_prob
        features['prob_skew_abs'] = abs(features['prob_skew'])
        
        # 10. Market Confidence (combination of consensus and depth)
        features['market_confidence'] = (features['market_consensus'] * 0.7) + (features['market_depth'] * 0.3)
        
        return features
    
    def calculate_team_form_features(self,
                                    recent_results: List[Dict],
                                    team_name: str,
                                    is_home: bool = True) -> Dict[str, float]:
        """
        Calculate team form features from recent results
        """
        if not recent_results or len(recent_results) == 0:
            return self._default_form_features()
        
        # Filter last 10 matches
        recent = recent_results[:10]
        
        features = {}
        
        # 1. Win Rate (last 5, 10 matches)
        wins_5 = sum(1 for r in recent[:5] if self._is_win(r, team_name, is_home))
        wins_10 = sum(1 for r in recent if self._is_win(r, team_name, is_home))
        features['win_rate_5'] = wins_5 / min(5, len(recent))
        features['win_rate_10'] = wins_10 / len(recent)
        
        # 2. Goals For/Against
        goals_for_5 = sum(self._get_goals_for(r, team_name, is_home) for r in recent[:5])
        goals_against_5 = sum(self._get_goals_against(r, team_name, is_home) for r in recent[:5])
        features['goals_for_avg_5'] = goals_for_5 / min(5, len(recent))
        features['goals_against_avg_5'] = goals_against_5 / min(5, len(recent))
        features['goal_difference_5'] = features['goals_for_avg_5'] - features['goals_against_avg_5']
        
        # 3. Current Streak
        features['current_streak'] = self._calculate_streak(recent, team_name, is_home)
        features['is_winning_streak'] = 1.0 if features['current_streak'] > 0 else 0.0
        features['is_losing_streak'] = 1.0 if features['current_streak'] < 0 else 0.0
        
        # 4. Form Trend (improving or declining)
        if len(recent) >= 5:
            recent_5_wins = wins_5
            older_5_wins = sum(1 for r in recent[5:10] if self._is_win(r, team_name, is_home))
            features['form_trend'] = (recent_5_wins - older_5_wins) / 5.0  # -1 to 1
        else:
            features['form_trend'] = 0.0
        
        # 5. Home/Away Performance (if applicable)
        if is_home:
            home_matches = [r for r in recent if r.get('is_home', False)]
            if home_matches:
                features['home_win_rate'] = sum(1 for r in home_matches if self._is_win(r, team_name, True)) / len(home_matches)
            else:
                features['home_win_rate'] = 0.5
        else:
            away_matches = [r for r in recent if not r.get('is_home', True)]
            if away_matches:
                features['away_win_rate'] = sum(1 for r in away_matches if self._is_win(r, team_name, False)) / len(away_matches)
            else:
                features['away_win_rate'] = 0.5
        
        # 6. Clean Sheets (for football)
        clean_sheets_5 = sum(1 for r in recent[:5] if self._get_goals_against(r, team_name, is_home) == 0)
        features['clean_sheet_rate_5'] = clean_sheets_5 / min(5, len(recent))
        
        # 7. Over/Under Performance
        features['over_2_5_rate'] = sum(1 for r in recent[:5] if self._total_goals(r) > 2.5) / min(5, len(recent))
        
        return features
    
    def calculate_head_to_head_features(self,
                                       h2h_history: List[Dict],
                                       team1: str,
                                       team2: str) -> Dict[str, float]:
        """
        Calculate head-to-head historical features
        """
        if not h2h_history or len(h2h_history) == 0:
            return self._default_h2h_features()
        
        features = {}
        
        # Filter last 10 H2H matches
        recent_h2h = h2h_history[:10]
        
        # 1. Win Rate for Team 1
        team1_wins = sum(1 for match in recent_h2h if self._team_won(match, team1))
        features['h2h_win_rate_team1'] = team1_wins / len(recent_h2h)
        features['h2h_win_rate_team2'] = 1.0 - features['h2h_win_rate_team1']
        
        # 2. Draw Rate
        draws = sum(1 for match in recent_h2h if self._is_draw(match))
        features['h2h_draw_rate'] = draws / len(recent_h2h)
        
        # 3. Average Goals
        team1_goals_avg = np.mean([self._get_team_goals(match, team1) for match in recent_h2h])
        team2_goals_avg = np.mean([self._get_team_goals(match, team2) for match in recent_h2h])
        features['h2h_goals_team1_avg'] = team1_goals_avg
        features['h2h_goals_team2_avg'] = team2_goals_avg
        features['h2h_total_goals_avg'] = team1_goals_avg + team2_goals_avg
        
        # 4. Recent Trend (last 3 matches)
        if len(recent_h2h) >= 3:
            recent_3_wins = sum(1 for match in recent_h2h[:3] if self._team_won(match, team1))
            features['h2h_recent_trend'] = (recent_3_wins - 1.5) / 1.5  # -1 to 1
        else:
            features['h2h_recent_trend'] = 0.0
        
        # 5. Home Advantage in H2H
        home_wins = sum(1 for match in recent_h2h if match.get('is_home', False) and self._team_won(match, team1))
        home_matches = sum(1 for match in recent_h2h if match.get('is_home', False))
        if home_matches > 0:
            features['h2h_home_advantage'] = home_wins / home_matches
        else:
            features['h2h_home_advantage'] = 0.5
        
        return features
    
    def calculate_contextual_features(self,
                                    event: Dict,
                                    prediction_time: datetime) -> Dict[str, float]:
        """
        Calculate contextual features (time, importance, etc.)
        """
        features = {}
        
        # 1. Days until event
        start_time = event.get('startTime')
        if start_time:
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            days_until = (start_time - prediction_time).total_seconds() / 86400.0
            features['days_until_event'] = days_until
            features['hours_until_event'] = days_until * 24
            features['is_imminent'] = 1.0 if days_until < 1 else 0.0
            features['is_far_future'] = 1.0 if days_until > 7 else 0.0
        else:
            features['days_until_event'] = 0.0
            features['hours_until_event'] = 0.0
            features['is_imminent'] = 0.0
            features['is_far_future'] = 0.0
        
        # 2. Event Importance (if available)
        importance = event.get('importance', 0.5)
        features['event_importance'] = importance
        
        # 3. Day of Week (some teams perform better on certain days)
        if start_time:
            features['day_of_week'] = start_time.weekday() / 6.0  # 0-1 scale
            features['is_weekend'] = 1.0 if start_time.weekday() >= 5 else 0.0
        else:
            features['day_of_week'] = 0.5
            features['is_weekend'] = 0.0
        
        # 4. Time of Day
        if start_time:
            hour = start_time.hour
            features['hour_of_day'] = hour / 23.0  # 0-1 scale
            features['is_evening'] = 1.0 if 18 <= hour <= 22 else 0.0
        else:
            features['hour_of_day'] = 0.5
            features['is_evening'] = 0.0
        
        return features
    
    def create_all_features(self,
                           event: Dict,
                           odds_history: List[float],
                           all_odds: List[float],
                           team1_form: Optional[List[Dict]] = None,
                           team2_form: Optional[List[Dict]] = None,
                           h2h_history: Optional[List[Dict]] = None,
                           prediction_time: Optional[datetime] = None) -> Dict[str, float]:
        """
        Create all advanced features for a prediction
        This is the main method that combines everything
        """
        if prediction_time is None:
            prediction_time = datetime.now()
        
        features = {}
        
        # 1. Technical Indicators
        tech_features = self.calculate_technical_indicators(odds_history)
        features.update(tech_features)
        
        # 2. Market Intelligence
        market_features = self.calculate_market_intelligence(all_odds)
        features.update(market_features)
        
        # 3. Team Form
        team1_name = event.get('homeTeam', '')
        team2_name = event.get('awayTeam', '')
        
        if team1_form:
            team1_form_features = self.calculate_team_form_features(team1_form, team1_name, is_home=True)
            # Prefix with home_
            for key, value in team1_form_features.items():
                features[f'home_{key}'] = value
        
        if team2_form:
            team2_form_features = self.calculate_team_form_features(team2_form, team2_name, is_home=False)
            # Prefix with away_
            for key, value in team2_form_features.items():
                features[f'away_{key}'] = value
        
        # 4. Head-to-Head
        if h2h_history and team1_name and team2_name:
            h2h_features = self.calculate_head_to_head_features(h2h_history, team1_name, team2_name)
            features.update(h2h_features)
        
        # 5. Contextual Features
        contextual_features = self.calculate_contextual_features(event, prediction_time)
        features.update(contextual_features)
        
        # 6. Relative Features (comparisons between teams)
        if team1_form and team2_form:
            team1_form_features = self.calculate_team_form_features(team1_form, team1_name, is_home=True)
            team2_form_features = self.calculate_team_form_features(team2_form, team2_name, is_home=False)
            
            features['form_advantage'] = team1_form_features.get('win_rate_5', 0.5) - team2_form_features.get('win_rate_5', 0.5)
            features['goals_advantage'] = team1_form_features.get('goals_for_avg_5', 0) - team2_form_features.get('goals_for_avg_5', 0)
            features['defense_advantage'] = team2_form_features.get('goals_against_avg_5', 0) - team1_form_features.get('goals_against_avg_5', 0)
        
        return features
    
    # Helper methods for technical indicators
    def _calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate RSI (Relative Strength Index)"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def _calculate_macd(self, prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, float]:
        """Calculate MACD"""
        if len(prices) < slow:
            return {'macd': 0.0, 'signal': 0.0, 'histogram': 0.0}
        
        ema_fast = self._ema(prices, fast)
        ema_slow = self._ema(prices, slow)
        macd_line = ema_fast - ema_slow
        
        # Signal line (EMA of MACD)
        macd_values = [macd_line] * len(prices)  # Simplified
        signal_line = self._ema(macd_values, signal) if len(macd_values) >= signal else macd_line
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': macd_line - signal_line
        }
    
    def _calculate_bollinger_bands(self, prices: List[float], period: int = 20, std_dev: float = 2.0) -> Dict[str, float]:
        """Calculate Bollinger Bands"""
        if len(prices) < period:
            period = len(prices)
        
        recent = prices[-period:]
        middle = np.mean(recent)
        std = np.std(recent)
        
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        width = (upper - lower) / middle if middle > 0 else 0
        
        # Position of current price in band (0 = lower, 1 = upper)
        current = prices[-1] if prices else middle
        position = (current - lower) / (upper - lower) if (upper - lower) > 0 else 0.5
        
        return {
            'upper': upper,
            'lower': lower,
            'middle': middle,
            'width': width,
            'position': position
        }
    
    def _calculate_momentum(self, prices: List[float], period: int = 14) -> float:
        """Calculate momentum"""
        if len(prices) < period + 1:
            return 0.0
        return prices[-1] - prices[-period-1]
    
    def _calculate_stochastic(self, prices: List[float], period: int = 14) -> float:
        """Calculate Stochastic Oscillator"""
        if len(prices) < period:
            return 50.0
        
        recent = prices[-period:]
        high = max(recent)
        low = min(recent)
        current = prices[-1]
        
        if high == low:
            return 50.0
        
        stoch = ((current - low) / (high - low)) * 100
        return stoch
    
    def _calculate_support_resistance(self, prices: List[float]) -> Dict[str, float]:
        """Calculate support and resistance levels"""
        if len(prices) < 5:
            return {
                'support': min(prices) if prices else 0.0,
                'resistance': max(prices) if prices else 1.0,
                'distance_to_support': 0.0,
                'distance_to_resistance': 0.0
            }
        
        # Simple: support = recent low, resistance = recent high
        support = min(prices[-20:]) if len(prices) >= 20 else min(prices)
        resistance = max(prices[-20:]) if len(prices) >= 20 else max(prices)
        current = prices[-1]
        
        return {
            'support': support,
            'resistance': resistance,
            'distance_to_support': (current - support) / (resistance - support) if (resistance - support) > 0 else 0.5,
            'distance_to_resistance': (resistance - current) / (resistance - support) if (resistance - support) > 0 else 0.5
        }
    
    def _ema(self, prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return np.mean(prices) if prices else 0.0
        
        multiplier = 2.0 / (period + 1)
        ema = prices[0]
        
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def _detect_sharp_money(self, probs: List[float]) -> float:
        """Detect sharp money indicators"""
        if len(probs) < 2:
            return 0.5
        
        # Sharp money often causes odds to move in one direction
        # If there's a clear trend, it might indicate sharp action
        trend = probs[-1] - probs[0]
        trend_strength = abs(trend)
        
        # Normalize to 0-1
        return min(trend_strength * 10, 1.0)
    
    def _calculate_value_concentration(self, probs: List[float]) -> float:
        """Calculate how concentrated values are"""
        if len(probs) < 2:
            return 1.0
        
        # Use coefficient of variation (CV)
        mean = np.mean(probs)
        std = np.std(probs)
        cv = std / mean if mean > 0 else 0
        
        # Lower CV = more concentrated = higher score
        return 1.0 - min(cv, 1.0)
    
    def _default_market_features(self) -> Dict[str, float]:
        """Default market features when data is missing"""
        return {
            'market_consensus': 0.7,
            'market_std': 0.1,
            'sharp_money_indicator': 0.5,
            'market_efficiency': 0.9,
            'value_concentration': 0.8,
            'bookmaker_disagreement': 0.2,
            'market_depth': 0.5,
            'odds_spread': 0.1,
            'value_opportunity': 0.02,
            'prob_min': 0.3,
            'prob_max': 0.7,
            'prob_range': 0.4,
            'prob_skew': 0.0,
            'prob_skew_abs': 0.0,
            'market_confidence': 0.7,
        }
    
    def _default_form_features(self) -> Dict[str, float]:
        """Default form features when data is missing"""
        return {
            'win_rate_5': 0.5,
            'win_rate_10': 0.5,
            'goals_for_avg_5': 1.5,
            'goals_against_avg_5': 1.5,
            'goal_difference_5': 0.0,
            'current_streak': 0.0,
            'is_winning_streak': 0.0,
            'is_losing_streak': 0.0,
            'form_trend': 0.0,
            'home_win_rate': 0.5,
            'away_win_rate': 0.5,
            'clean_sheet_rate_5': 0.3,
            'over_2_5_rate': 0.5,
        }
    
    def _default_h2h_features(self) -> Dict[str, float]:
        """Default H2H features when data is missing"""
        return {
            'h2h_win_rate_team1': 0.5,
            'h2h_win_rate_team2': 0.5,
            'h2h_draw_rate': 0.25,
            'h2h_goals_team1_avg': 1.5,
            'h2h_goals_team2_avg': 1.5,
            'h2h_total_goals_avg': 3.0,
            'h2h_recent_trend': 0.0,
            'h2h_home_advantage': 0.5,
        }
    
    # Helper methods for form calculation
    def _is_win(self, result: Dict, team_name: str, is_home: bool) -> bool:
        """Check if team won"""
        home_score = result.get('homeScore', 0)
        away_score = result.get('awayScore', 0)
        home_team = result.get('homeTeam', '')
        away_team = result.get('awayTeam', '')
        
        if is_home:
            return home_team == team_name and home_score > away_score
        else:
            return away_team == team_name and away_score > home_score
    
    def _get_goals_for(self, result: Dict, team_name: str, is_home: bool) -> int:
        """Get goals scored by team"""
        home_team = result.get('homeTeam', '')
        away_team = result.get('awayTeam', '')
        
        if is_home and home_team == team_name:
            return result.get('homeScore', 0)
        elif not is_home and away_team == team_name:
            return result.get('awayScore', 0)
        return 0
    
    def _get_goals_against(self, result: Dict, team_name: str, is_home: bool) -> int:
        """Get goals conceded by team"""
        home_team = result.get('homeTeam', '')
        away_team = result.get('awayTeam', '')
        
        if is_home and home_team == team_name:
            return result.get('awayScore', 0)
        elif not is_home and away_team == team_name:
            return result.get('homeScore', 0)
        return 0
    
    def _total_goals(self, result: Dict) -> float:
        """Get total goals in match"""
        return result.get('homeScore', 0) + result.get('awayScore', 0)
    
    def _calculate_streak(self, results: List[Dict], team_name: str, is_home: bool) -> float:
        """Calculate current win/loss streak"""
        streak = 0
        for result in results:
            if self._is_win(result, team_name, is_home):
                if streak >= 0:
                    streak += 1
                else:
                    break
            else:
                if streak <= 0:
                    streak -= 1
                else:
                    break
        return float(streak)
    
    def _team_won(self, match: Dict, team_name: str) -> bool:
        """Check if team won in H2H match"""
        home_team = match.get('homeTeam', '')
        away_team = match.get('awayTeam', '')
        home_score = match.get('homeScore', 0)
        away_score = match.get('awayScore', 0)
        
        if home_team == team_name:
            return home_score > away_score
        elif away_team == team_name:
            return away_score > home_score
        return False
    
    def _is_draw(self, match: Dict) -> bool:
        """Check if match was a draw"""
        return match.get('homeScore', 0) == match.get('awayScore', 0)
    
    def _get_team_goals(self, match: Dict, team_name: str) -> int:
        """Get goals scored by team in H2H match"""
        home_team = match.get('homeTeam', '')
        away_team = match.get('awayTeam', '')
        
        if home_team == team_name:
            return match.get('homeScore', 0)
        elif away_team == team_name:
            return match.get('awayScore', 0)
        return 0

