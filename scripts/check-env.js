#!/usr/bin/env node

/**
 * Environment Variable Check Script
 * 
 * Validates that all required environment variables are set
 * 
 * Usage:
 *   npm run check-env
 *   node scripts/check-env.js
 */

// Required environment variables
const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GEMINI_API_KEY',
    'TOKEN_ENCRYPTION_KEY',
];

// Optional but recommended
const recommended = [
    'CRON_SECRET',
    'SENTRY_DSN',
    'GOOGLE_AI_STUDIO_KEY',
    'LUMA_API_KEY',
    'GOOGLE_CLOUD_TTS_KEY',
];

// Load .env.local if exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
}

console.log('🔍 Checking environment variables...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check required variables
const missing = [];
const present = [];

for (const key of required) {
    if (process.env[key]) {
        present.push(key);
        console.log(`✅ ${key}`);
    } else {
        missing.push(key);
        console.log(`❌ ${key} - MISSING`);
    }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Optional (Recommended):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check recommended variables
for (const key of recommended) {
    if (process.env[key]) {
        console.log(`✅ ${key}`);
    } else {
        console.log(`⚠️  ${key} - Not set (optional)`);
    }
}

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Summary:');
console.log(`   ✅ Set:     ${present.length}/${required.length}`);
console.log(`   ❌ Missing: ${missing.length}/${required.length}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (missing.length > 0) {
    console.log('\n❌ Missing environment variables:\n');
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('\n📖 See docs/deployment/environment_setup.md for setup instructions.\n');
    process.exit(1);
} else {
    console.log('\n✅ All required environment variables are set!\n');
    process.exit(0);
}
