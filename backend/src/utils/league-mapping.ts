/**
 * League Mapping Utility
 * Maps sport slugs to API-Football league IDs and seasons
 */

export interface LeagueInfo {
  leagueId: number;
  season: number;
  name: string;
}

/**
 * Map sport slug to API-Football league ID and current season
 */
export function getLeagueInfo(sportSlug: string): LeagueInfo | null {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  // Determine season based on month (most leagues start in August/September)
  // For 2024-2025 season, use 2024 if before August, otherwise use current year
  const season = currentMonth >= 7 ? currentYear : currentYear - 1;

  const leagueMap: Record<string, LeagueInfo> = {
    // Premier League
    'soccer_epl': {
      leagueId: 39,
      season: season,
      name: 'Premier League',
    },
    // La Liga
    'soccer_spain_la_liga': {
      leagueId: 140,
      season: season,
      name: 'La Liga',
    },
    // Serie A
    'soccer_italy_serie_a': {
      leagueId: 135,
      season: season,
      name: 'Serie A',
    },
    // Bundesliga
    'soccer_germany_bundesliga': {
      leagueId: 78,
      season: season,
      name: 'Bundesliga',
    },
    // Ligue 1
    'soccer_france_ligue_one': {
      leagueId: 61,
      season: season,
      name: 'Ligue 1',
    },
    // Champions League
    'soccer_uefa_champs_league': {
      leagueId: 2,
      season: season,
      name: 'Champions League',
    },
    // Europa League
    'soccer_uefa_europa_league': {
      leagueId: 3,
      season: season,
      name: 'Europa League',
    },
    // MLS
    'soccer_usa_mls': {
      leagueId: 253,
      season: currentYear, // MLS uses calendar year
      name: 'MLS',
    },
  };

  // Try exact match first
  if (leagueMap[sportSlug]) {
    return leagueMap[sportSlug];
  }

  // Try partial matches
  if (sportSlug.includes('epl') || sportSlug.includes('premier')) {
    return leagueMap['soccer_epl'];
  }
  if (sportSlug.includes('la_liga') || sportSlug.includes('spain')) {
    return leagueMap['soccer_spain_la_liga'];
  }
  if (sportSlug.includes('serie_a') || sportSlug.includes('italy')) {
    return leagueMap['soccer_italy_serie_a'];
  }
  if (sportSlug.includes('bundesliga') || sportSlug.includes('germany')) {
    return leagueMap['soccer_germany_bundesliga'];
  }
  if (sportSlug.includes('ligue') || sportSlug.includes('france')) {
    return leagueMap['soccer_france_ligue_one'];
  }

  return null;
}

/**
 * Get all supported leagues
 */
export function getSupportedLeagues(): LeagueInfo[] {
  return [
    { leagueId: 39, season: 2024, name: 'Premier League' },
    { leagueId: 140, season: 2024, name: 'La Liga' },
    { leagueId: 135, season: 2024, name: 'Serie A' },
    { leagueId: 78, season: 2024, name: 'Bundesliga' },
    { leagueId: 61, season: 2024, name: 'Ligue 1' },
    { leagueId: 2, season: 2024, name: 'Champions League' },
    { leagueId: 3, season: 2024, name: 'Europa League' },
  ];
}

