param(
  [string]$Key = "C:\Users\welld\Downloads\ssh-key-2026-05-26 (1).key",
  [string]$User = "ubuntu",
  [string]$Host = "137.131.187.156",
  [string]$RemoteDir = "/home/ubuntu/gestaocasa/frontend/dist"
)

Write-Host "=== Build ===" -ForegroundColor Cyan
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build falhou!" -ForegroundColor Red; exit 1 }

Write-Host "=== SCP ===" -ForegroundColor Cyan
scp -i "$Key" -r dist/* "${User}@${Host}:${RemoteDir}/"
if ($LASTEXITCODE -ne 0) { Write-Host "SCP falhou!" -ForegroundColor Red; exit 1 }

Write-Host "=== Permissions + Restart ===" -ForegroundColor Cyan
ssh -i "$Key" "${User}@${Host}" "chmod -R 755 ${RemoteDir}/ && docker restart gestaocasa-frontend"
if ($LASTEXITCODE -ne 0) { Write-Host "SSH falhou!" -ForegroundColor Red; exit 1 }

Write-Host "=== Deploy concluido! ===" -ForegroundColor Green
Set-Location ..
