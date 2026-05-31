# Test auth header forwarding
$body = @{ email = "user1@test.com"; password = "password123" } | ConvertTo-Json

# Login
$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -SessionVariable session

$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.token
Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..."

# Get saved FAQs with auth header
$savedResp = Invoke-WebRequest -Uri "http://localhost:5000/api/users/saved" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

Write-Host "Status: $($savedResp.StatusCode)"
Write-Host "Body: $($savedResp.Content.Substring(0, [Math]::Min(200, $savedResp.Content.Length)))"