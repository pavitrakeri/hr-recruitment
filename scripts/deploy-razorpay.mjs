#!/usr/bin/env node

/**
 * Razorpay Integration Deployment Script
 * 
 * This script helps deploy the Razorpay integration to Supabase Edge Functions
 * and sets up the necessary environment variables.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'cyan');
  
  try {
    // Check if Supabase CLI is installed
    execSync('supabase --version', { stdio: 'pipe' });
    success('Supabase CLI is installed');
  } catch (err) {
    error('Supabase CLI is not installed');
    info('Install it with: npm install -g supabase');
    process.exit(1);
  }
  
  // Check if .env file exists
  if (!existsSync('.env')) {
    warning('.env file not found');
    info('Create a .env file with your environment variables');
  } else {
    success('.env file found');
  }
  
  // Check if supabase/functions directory exists
  if (!existsSync('supabase/functions')) {
    error('supabase/functions directory not found');
    info('Make sure you have the Edge Functions in place');
    process.exit(1);
  }
  
  success('All prerequisites met');
}

async function getProjectRef() {
  try {
    const config = readFileSync('supabase/config.toml', 'utf8');
    const match = config.match(/project_id\s*=\s*"([^"]+)"/);
    if (match) {
      return match[1];
    }
  } catch (err) {
    // config.toml might not exist yet
  }
  
  return null;
}

async function setupProject() {
  log('\n🚀 Setting up Supabase project...', 'cyan');
  
  const projectRef = await getProjectRef();
  
  if (!projectRef) {
    info('No project reference found. You may need to link your project:');
    info('supabase link --project-ref YOUR_PROJECT_REF');
    return false;
  }
  
  try {
    // Link project if not already linked
    execSync(`supabase link --project-ref ${projectRef}`, { stdio: 'pipe' });
    success(`Project linked: ${projectRef}`);
    return true;
  } catch (err) {
    warning('Project linking failed. You may need to login first:');
    info('supabase login');
    return false;
  }
}

async function deployFunctions() {
  log('\n📦 Deploying Edge Functions...', 'cyan');
  
  const functions = ['create-razorpay-order', 'verify-razorpay-payment'];
  
  for (const func of functions) {
    try {
      info(`Deploying ${func}...`);
      execSync(`supabase functions deploy ${func}`, { stdio: 'inherit' });
      success(`${func} deployed successfully`);
    } catch (err) {
      error(`Failed to deploy ${func}`);
      return false;
    }
  }
  
  return true;
}

async function setupEnvironmentVariables() {
  log('\n🔧 Setting up environment variables...', 'cyan');
  
  const requiredVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  info('You need to set the following environment variables in Supabase:');
  requiredVars.forEach(varName => {
    info(`  ${varName}`);
  });
  
  info('\nSet them using:');
  info('supabase secrets set VARIABLE_NAME=value');
}

async function createDatabaseTables() {
  log('\n🗄️  Database setup...', 'cyan');
  
  const sql = `
-- Subscription Plans Table (if not exists)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  job_limit INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions Table (if not exists)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample plans (if not exists)
INSERT INTO subscription_plans (name, job_limit, price, features) 
VALUES 
  ('Free', 1, 0.00, ARRAY['Basic job posting', 'Email support']),
  ('Pro', 10, 29.99, ARRAY['10 job postings', 'Priority support', 'Analytics dashboard']),
  ('Business', 50, 99.99, ARRAY['50 job postings', 'Priority support', 'Analytics dashboard', 'Custom branding'])
ON CONFLICT (name) DO NOTHING;
  `;
  
  try {
    writeFileSync('supabase/migrations/20240101000000_razorpay_setup.sql', sql);
    success('Database migration file created');
    info('Run: supabase db push');
  } catch (err) {
    error('Failed to create migration file');
  }
}

async function main() {
  log('🎯 Razorpay Integration Deployment Script', 'bright');
  log('==========================================', 'bright');
  
  await checkPrerequisites();
  
  const projectLinked = await setupProject();
  if (!projectLinked) {
    warning('Skipping function deployment due to project linking issues');
  } else {
    const deployed = await deployFunctions();
    if (!deployed) {
      error('Function deployment failed');
      process.exit(1);
    }
  }
  
  await setupEnvironmentVariables();
  await createDatabaseTables();
  
  log('\n🎉 Setup complete!', 'green');
  log('\nNext steps:', 'bright');
  info('1. Set your Razorpay API keys in Supabase secrets');
  info('2. Update your .env file with VITE_RAZORPAY_KEY_ID');
  info('3. Run: supabase db push (to create database tables)');
  info('4. Test the integration with test payments');
  
  log('\n📚 Documentation: RAZORPAY_INTEGRATION_README.md', 'cyan');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('Usage: node deploy-razorpay.mjs [options]', 'bright');
  log('\nOptions:', 'bright');
  info('  --help, -h   Show this help message');
  process.exit(0);
}

main().catch(err => {
  error('Deployment failed:');
  console.error(err);
  process.exit(1);
}); 