$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"user1@test.com","password":"password123"}'
$token = $login.token
Write-Host "Token len: $($token.Length)"

$headers = @{ Authorization = "Bearer $token" }

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/users/saved' -Headers $headers -Method GET -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Body: $($r.Content.Substring(0, 500))"
} catch {
    Write-Host "Exception: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode.value__)"
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Body: $body"
    }
}