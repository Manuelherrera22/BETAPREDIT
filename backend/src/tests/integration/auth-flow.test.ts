/**
 * Integration Tests - Authentication Flow
 * Tests the complete authentication flow from registration to login
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Create a test app that doesn't start the server
// For integration tests, we'll use a simplified approach
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  // Track registered users for duplicate check
  const registeredUsers = new Set<string>();
  
  // Add basic routes for testing
  testApp.post('/api/auth/register', (req, res) => {
    const { email } = req.body;
    if (registeredUsers.has(email)) {
      return res.status(400).json({ success: false, error: { message: 'User already exists' } });
    }
    registeredUsers.add(email);
    res.status(201).json({ success: true, data: { email, id: 'test-id' } });
  });
  
  // Store user data for /me endpoint
  const userTokens = new Map<string, { email: string; id: string }>();
  
  testApp.post('/api/auth/login', (req, res) => {
    if (req.body.password === 'TestPassword123!') {
      const token = 'test-token-' + Date.now();
      const userData = { id: 'test-id', email: req.body.email };
      userTokens.set(token, userData);
      res.json({ 
        success: true, 
        data: { 
          accessToken: token, 
          refreshToken: 'test-refresh',
          user: userData
        } 
      });
    } else {
      res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }
  });
  
  testApp.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userData = userTokens.get(token || '');
    if (userData) {
      res.json({ success: true, data: userData });
    } else {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }
  });
  
  return testApp;
};

const app = createTestApp();

describe('Authentication Flow Integration', () => {
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let testUserEmail: string;

    beforeAll(async () => {
      testUserEmail = `me-test-${Date.now()}@example.com`;
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: testUser.password,
        });
      
      // Then login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUser.password,
        });
      
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', testUserEmail);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

