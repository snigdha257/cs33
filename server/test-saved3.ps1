$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"user1@test.com","password":"password123"}'
$t = $login.token
$hdrs = @{ Authorization = "Bearer $t" }
try {
    $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/users/saved' -Headers $hdrs -Method GET -ErrorAction Stop
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "FAIL:" $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status:" $_.Exception.Response.StatusCode.value__
    }
}