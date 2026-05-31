$login = Invoke-RestMethod -Uri 'http://localhost:5173/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"user1@test.com","password":"password123"}'
$t = $login.token
$hdrs = @{ Authorization = "Bearer $t" }
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5173/api/users/saved' -Headers $hdrs -Method GET -ErrorAction Stop
    Write-Host "PROXY Status:" $r.StatusCode
    Write-Host "PROXY Body:" $r.Content.Substring(0, 300)
} catch {
    Write-Host "PROXY FAIL:" $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status:" $_.Exception.Response.StatusCode.value__
        $s = $_.Exception.Response.GetResponseStream()
        $body = [System.IO.StreamReader]::new($s).ReadToEnd()
        Write-Host "Body:" $body
    }
}