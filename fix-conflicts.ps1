# PowerShell script to fix Git merge conflicts
# Run this script to automatically clean up merge conflict markers

Write-Host "🔧 Cleaning up Git merge conflicts..." -ForegroundColor Yellow

# List of files to clean
$files = @(
    "app/dashboard/tailor/page.tsx",
    "app/api/user/upload/route.ts", 
    "app/api/resume/tailor/route.ts",
    "README.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Cleaning $file..." -ForegroundColor Green
        
        # Read file content
        $content = Get-Content $file -Raw
        
        # Remove conflict markers and keep enhanced version
        $content = $content -replace '<<<<<<< HEAD[\s\S]*?=======\s*', ''
        $content = $content -replace '>>>>>>> my-feature-branch\s*', ''
        
        # Write cleaned content back
        Set-Content $file $content -NoNewline
        
        Write-Host "✅ Cleaned $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Red
    }
}

Write-Host "🎉 Merge conflict cleanup complete!" -ForegroundColor Green
Write-Host "Run npm run dev to test the application." -ForegroundColor Cyan