Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
$serverProcess = Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory $PWD -NoNewWindow -PassThru -RedirectStandardOutput "server.out.log" -RedirectStandardError "server.err.log"
Start-Sleep 3
Write-Host "Server PID: $($serverProcess.Id)"
Get-Content server.out.log -Tail 5