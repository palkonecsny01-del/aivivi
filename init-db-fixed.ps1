# PlanLabStudio - Supabase Database Initialization
# Reads and executes the migration SQL directly

$SupabaseUrl = "https://unpzjplcyxgsvjcvoapo.supabase.co"
$SupabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucHpqcGxjeXhnc3ZqY3ZvYXBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwNTU5OSwiZXhwIjoyMDk0NDgxNTk5fQ.jPbf8_qS-E7j2Bxg-iqCIX8h7bJ2NrjH94mD8lnWFeE"

Write-Host "🚀 PlanLabStudio - Database Initialization" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Read migration SQL
$migrationPath = ".\supabase\migrations\20260516091457_create_planlabstudio_schema.sql"
if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Migration file not found: $migrationPath" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content -Path $migrationPath -Raw

# Create payload - send entire SQL as one request
$payload = @{
    query = $sqlContent
} | ConvertTo-Json -Compress

# Execute via REST API
try {
    Write-Host "📡 Sending SQL to Supabase..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $SupabaseServiceKey"
        "Content-Type" = "application/json"
        "apikey" = $SupabaseServiceKey
    }
    
    $response = Invoke-WebRequest `
        -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" `
        -Method POST `
        -Headers $headers `
        -Body $payload `
        -ErrorAction Stop
    
    Write-Host "✅ Database initialized successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now login with any email/password" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try alternative: directly via psql if available
    Write-Host ""
    Write-Host "💡 Alternative: Run SQL directly in Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://app.supabase.com" -ForegroundColor Cyan
    Write-Host "   2. Select project: unpzjplcyxgsvjcvoapo" -ForegroundColor Cyan
    Write-Host "   3. SQL Editor → Paste contents of $migrationPath" -ForegroundColor Cyan
    Write-Host "   4. Click 'Run'" -ForegroundColor Cyan
    
    exit 1
}
