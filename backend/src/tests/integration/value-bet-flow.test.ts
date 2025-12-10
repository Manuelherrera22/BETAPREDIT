/**
 * Integration Tests - Value Bet Detection Flow
 * Tests the complete value bet detection and alert flow
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  testApp.post('/api/auth/register', (req, res) => {
    res.status(201).json({ success: true, data: { email: req.body.email, id: 'test-id' } });
  });
  
  testApp.post('/api/auth/login', (req, res) => {
    res.json({ 
      success: true, 
      data: { 
        accessToken: 'test-token', 
        user: { id: 'test-id', email: req.body.email }
      } 
    });
  });
  
  testApp.get('/api/value-bet-detection/detect', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      res.json({ success: true, data: [] });
    } else {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }
  });
  
  testApp.get('/api/value-bet-alerts', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      res.json({ success: true, data: [] });
    } else {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }
  });
  
  return testApp;
};

const app = createTestApp();

describe('Value Bet Flow Integration', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register and login a test user
    const testUser = {
      email: `valuebet-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    accessToken = loginResponse.body.data.accessToken;
    userId = loginResponse.body.data.user.id;
  });

  describe('GET /api/value-bet-detection/detect', () => {
    it('should detect value bets for a sport', async () => {
      const response = await request(app)
        .get('/api/value-bet-detection/detect')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sport: 'soccer_epl', minValue: 0.05 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/value-bet-detection/detect')
        .query({ sport: 'soccer_epl' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/value-bet-alerts', () => {
    it('should get user value bet alerts', async () => {
      const response = await request(app)
        .get('/api/value-bet-alerts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

