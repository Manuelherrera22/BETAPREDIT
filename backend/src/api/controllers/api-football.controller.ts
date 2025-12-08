import { Request, Response, NextFunction } from 'express';
import { getAPIFootballService } from '../../services/integrations/api-football.service';
import { AppError } from '../../middleware/errorHandler';

class APIFootballController {
  async getFixtures(req: Request, res: Response, next: NextFunction) {
    try {
      const apiFootball = getAPIFootballService();
      if (!apiFootball) {
        throw new AppError('API-Football service not configured', 503);
      }

      const { league, season, team, date, next, last } = req.query;

      const fixtures = await apiFootball.getFixtures({
        league: league ? parseInt(league as string) : undefined,
        season: season ? parseInt(season as string) : undefined,
        team: team ? parseInt(team as string) : undefined,
        date: date as string | undefined,
        next: next ? parseInt(next as string) : undefined,
        last: last ? parseInt(last as string) : undefined,
      });

      res.json({ success: true, data: fixtures });
    } catch (error) {
      next(error);
    }
  }

  async getHeadToHead(req: Request, res: Response, next: NextFunction) {
    try {
      const apiFootball = getAPIFootballService();
      if (!apiFootball) {
        throw new AppError('API-Football service not configured', 503);
      }

      const { team1, team2, last } = req.query;

      if (!team1 || !team2) {
        throw new AppError('team1 and team2 are required', 400);
      }

      const h2h = await apiFootball.getHeadToHead(
        parseInt(team1 as string),
        parseInt(team2 as string),
        last ? parseInt(last as string) : 10
      );

      res.json({ success: true, data: h2h });
    } catch (error) {
      next(error);
    }
  }

  async getTeamStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const apiFootball = getAPIFootballService();
      if (!apiFootball) {
        throw new AppError('API-Football service not configured', 503);
      }

      const { teamId, leagueId, season } = req.query;

      if (!teamId || !leagueId || !season) {
        throw new AppError('teamId, leagueId, and season are required', 400);
      }

      const stats = await apiFootball.getTeamStatistics(
        parseInt(teamId as string),
        parseInt(leagueId as string),
        parseInt(season as string)
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getInjuries(req: Request, res: Response, next: NextFunction) {
    try {
      const apiFootball = getAPIFootballService();
      if (!apiFootball) {
        throw new AppError('API-Football service not configured', 503);
      }

      const { league, season, team, date } = req.query;

      const injuries = await apiFootball.getInjuries({
        league: league ? parseInt(league as string) : undefined,
        season: season ? parseInt(season as string) : undefined,
        team: team ? parseInt(team as string) : undefined,
        date: date as string | undefined,
      });

      res.json({ success: true, data: injuries });
    } catch (error) {
      next(error);
    }
  }

  async getStandings(req: Request, res: Response, next: NextFunction) {
    try {
      const apiFootball = getAPIFootballService();
      if (!apiFootball) {
        throw new AppError('API-Football service not configured', 503);
      }

      const { leagueId, season } = req.query;

      if (!leagueId || !season) {
        throw new AppError('leagueId and season are required', 400);
      }

      const standings = await apiFootball.getStandings(
        parseInt(leagueId as string),
        parseInt(season as string)
      );

      res.json({ success: true, data: standings });
    } catch (error) {
      next(error);
    }
  }

  async searchTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const apiFootball = getAPIFootballService();
      if (!apiFootball) {
        throw new AppError('API-Football service not configured', 503);
      }

      const { query } = req.query;

      if (!query) {
        throw new AppError('query parameter is required', 400);
      }

      const teams = await apiFootball.searchTeams(query as string);

      res.json({ success: true, data: teams });
    } catch (error) {
      next(error);
    }
  }
}

export const apiFootballController = new APIFootballController();

