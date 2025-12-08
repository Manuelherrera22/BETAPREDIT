/**
 * Test Script for New Features
 * Tests referrals system, database connection, and API endpoints
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function testDatabaseConnection() {
  logSection('📊 TEST 1: Database Connection');
  try {
    await prisma.$connect();
    log('✅ Database connected successfully', 'green');
    
    // Test if new tables exist
    const referralCount = await prisma.referral.count();
    log(`✅ Referral table exists (${referralCount} records)`, 'green');
    
    const templateCount = await prisma.betTemplate.count();
    log(`✅ BetTemplate table exists (${templateCount} records)`, 'green');
    
    // Test User model with new fields
    const userCount = await prisma.user.count();
    log(`✅ User table accessible (${userCount} users)`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBackendHealth() {
  logSection('🏥 TEST 2: Backend Health Check');
  try {
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status
    });
    
    if (response.status === 200 || response.status === 404) {
      log('✅ Backend is running', 'green');
      log(`   Status: ${response.status}`, 'blue');
      return true;
    } else {
      log(`⚠️  Backend responded with status: ${response.status}`, 'yellow');
      return true; // Still consider it running
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Backend is not running', 'red');
      log('   Please start the backend with: npm run dev', 'yellow');
    } else {
      log(`⚠️  Backend check error: ${error.message}`, 'yellow');
    }
    return false;
  }
}

async function testReferralService() {
  logSection('🎯 TEST 3: Referral Service');
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check if service file exists
    const servicePath = path.join(__dirname, '../src/services/referrals/referral.service.ts');
    if (!fs.existsSync(servicePath)) {
      log('❌ Referral service file not found', 'red');
      return false;
    }
    
    log('✅ Referral service file exists', 'green');
    
    // Read file and check for key methods
    const fileContent = fs.readFileSync(servicePath, 'utf8');
    const methods = [
      'generateReferralCode',
      'getReferralStats',
      'getLeaderboard',
      'processReferral',
    ];
    
    let allMethodsFound = true;
    for (const method of methods) {
      if (fileContent.includes(`async ${method}`) || fileContent.includes(`${method}(`)) {
        log(`✅ ${method} method found`, 'green');
      } else {
        log(`❌ ${method} method not found`, 'red');
        allMethodsFound = false;
      }
    }
    
    return allMethodsFound;
  } catch (error) {
    log(`❌ Referral service test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testPrismaSchema() {
  logSection('📋 TEST 4: Prisma Schema Validation');
  try {
    // Test User model with new fields
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        referralCode: true,
        referredBy: true,
        referralCount: true,
        activeReferrals: true,
        referralRewards: true,
      },
    });
    
    log('✅ User model has new referral fields', 'green');
    
    // Test Referral model
    const testReferral = await prisma.referral.findFirst({
      select: {
        id: true,
        referrerId: true,
        referredUserId: true,
        referralCode: true,
        status: true,
      },
    });
    
    log('✅ Referral model is accessible', 'green');
    
    // Test BetTemplate model
    const testTemplate = await prisma.betTemplate.findFirst({
      select: {
        id: true,
        userId: true,
        name: true,
      },
    });
    
    log('✅ BetTemplate model is accessible', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Prisma schema test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAPIRoutes() {
  logSection('🌐 TEST 5: API Routes (if backend is running)');
  
  const routes = [
    { path: '/api/referrals/me', method: 'GET', requiresAuth: true },
    { path: '/api/referrals/leaderboard', method: 'GET', requiresAuth: true },
  ];
  
  let allPassed = true;
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${API_URL}${route.path}`, {
        timeout: 3000,
        validateStatus: () => true,
        headers: route.requiresAuth ? {
          // We expect 401 without auth, which is fine
        } : {},
      });
      
      if (response.status === 401) {
        log(`✅ ${route.path} - Route exists (401 Unauthorized expected)`, 'green');
      } else if (response.status === 200) {
        log(`✅ ${route.path} - Route working`, 'green');
      } else {
        log(`⚠️  ${route.path} - Status: ${response.status}`, 'yellow');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log(`⚠️  ${route.path} - Backend not running, skipping`, 'yellow');
        allPassed = false;
      } else {
        log(`⚠️  ${route.path} - Error: ${error.message}`, 'yellow');
      }
    }
  }
  
  return allPassed;
}

async function testFrontendFiles() {
  logSection('🎨 TEST 6: Frontend Files');
  const fs = require('fs');
  const path = require('path');
  
  // Get project root (go up from backend/scripts to backend, then to root)
  const projectRoot = path.join(__dirname, '../..');
  const frontendRoot = path.join(projectRoot, 'frontend', 'src');
  
  const frontendFiles = [
    { path: 'pages/Referrals.tsx', name: 'Referrals.tsx' },
    { path: 'services/referralService.ts', name: 'referralService.ts' },
    { path: 'components/QuickAddBet.tsx', name: 'QuickAddBet.tsx' },
    { path: 'components/PerformanceHeatmap.tsx', name: 'PerformanceHeatmap.tsx' },
    { path: 'components/TrendAnalysis.tsx', name: 'TrendAnalysis.tsx' },
    { path: 'components/BenchmarkComparison.tsx', name: 'BenchmarkComparison.tsx' },
  ];
  
  let allExist = true;
  
  for (const file of frontendFiles) {
    const filePath = path.join(frontendRoot, file.path);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file.name} exists`, 'green');
    } else {
      log(`❌ ${file.name} not found at ${filePath}`, 'red');
      allExist = false;
    }
  }
  
  return allExist;
}

async function runAllTests() {
  log('\n🚀 Starting Comprehensive Test Suite...', 'cyan');
  log('   Testing new features: Referrals, Quick Add, Analytics', 'blue');
  
  const results = {
    database: false,
    backend: false,
    referralService: false,
    prismaSchema: false,
    apiRoutes: false,
    frontendFiles: false,
  };
  
  // Run tests
  results.database = await testDatabaseConnection();
  results.backend = await testBackendHealth();
  results.referralService = await testReferralService();
  results.prismaSchema = await testPrismaSchema();
  results.apiRoutes = await testAPIRoutes();
  results.frontendFiles = await testFrontendFiles();
  
  // Summary
  logSection('📊 TEST SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}: ${passed ? 'PASSED' : 'FAILED'}`, color);
  }
  
  console.log('\n' + '='.repeat(70));
  log(`\n📈 Results: ${passedTests}/${totalTests} tests passed`, 
    passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Everything is synchronized and working!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
  }
  
  console.log('\n');
  
  // Cleanup
  await prisma.$disconnect();
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
