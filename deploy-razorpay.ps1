# Razorpay Integration Deployment Script for Windows
# Run this script in PowerShell

Write-Host "🎯 Razorpay Integration Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI is installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "Create a .env file with your environment variables" -ForegroundColor Yellow
}

# Check if supabase/functions directory exists
if (Test-Path "supabase\functions") {
    Write-Host "✅ supabase/functions directory found" -ForegroundColor Green
} else {
    Write-Host "❌ supabase/functions directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Setting up Supabase project..." -ForegroundColor Cyan

# Try to link project
try {
    $config = Get-Content "supabase\config.toml" -ErrorAction SilentlyContinue
    if ($config -match 'project_id\s*=\s*"([^"]+)"') {
        $projectRef = $matches[1]
        Write-Host "Found project reference: $projectRef" -ForegroundColor Yellow
        
        try {
            supabase link --project-ref $projectRef
            Write-Host "✅ Project linked successfully" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Project linking failed. You may need to login first:" -ForegroundColor Yellow
            Write-Host "supabase login" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  No project reference found in config.toml" -ForegroundColor Yellow
        Write-Host "You may need to link your project manually:" -ForegroundColor Yellow
        Write-Host "supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not read config.toml" -ForegroundColor Yellow
}

Write-Host "`n🔧 Setting up environment variables..." -ForegroundColor Cyan
Write-Host "You need to set the following environment variables in Supabase:" -ForegroundColor Yellow
Write-Host "  RAZORPAY_KEY_ID=rzp_live_4WqGTiMVOeRP5m" -ForegroundColor White
Write-Host "  RAZORPAY_KEY_SECRET=iNH0uFLw1k7QLI3bS3pHAnnS" -ForegroundColor White
Write-Host "  SUPABASE_URL=your_supabase_url_here" -ForegroundColor White
Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here" -ForegroundColor White

Write-Host "`nSet them using:" -ForegroundColor Yellow
Write-Host "supabase secrets set VARIABLE_NAME=value" -ForegroundColor White

Write-Host "`n📦 Deploying Edge Functions..." -ForegroundColor Cyan

$functions = @("create-razorpay-order", "verify-razorpay-payment", "test-razorpay")

foreach ($func in $functions) {
    try {
        Write-Host "Deploying $func..." -ForegroundColor Yellow
        supabase functions deploy $func
        Write-Host "✅ $func deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
        Write-Host "Make sure you have set the environment variables first" -ForegroundColor Yellow
    }
}

Write-Host "`n🗄️  Database setup..." -ForegroundColor Cyan
if (Test-Path "supabase\migrations\20240101000000_razorpay_setup.sql") {
    Write-Host "✅ Migration file found" -ForegroundColor Green
    Write-Host "Run: supabase db push" -ForegroundColor Yellow
} else {
    Write-Host "❌ Migration file not found" -ForegroundColor Red
}

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Set your Razorpay API keys in Supabase secrets" -ForegroundColor White
Write-Host "2. Update your .env file with VITE_RAZORPAY_KEY_ID=rzp_live_4WqGTiMVOeRP5m" -ForegroundColor White
Write-Host "3. Run: supabase db push (to create database tables)" -ForegroundColor White
Write-Host "4. Test the integration with the Test Plan (₹1)" -ForegroundColor White

Write-Host "`n📚 Documentation: RAZORPAY_INTEGRATION_README.md" -ForegroundColor Cyan

Write-Host "`n🔍 To test the integration:" -ForegroundColor Yellow
Write-Host "1. Visit your app and go to Subscription Manager" -ForegroundColor White
Write-Host "2. Select Razorpay as payment method" -ForegroundColor White
Write-Host "3. Choose the 'Test Plan' for ₹1" -ForegroundColor White
Write-Host "4. Complete the payment" -ForegroundColor White 