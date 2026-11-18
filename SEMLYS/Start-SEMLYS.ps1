$ErrorActionPreference = 'Stop'
$allowed = @('admin.html','index.html','products.html','site.css','refinement.css','catalog-items.js','site.js','settings-history.js','store-settings.js','visual-editor.js','telegram-app.js','logo.png','logo-dark.png')
$types = @{'.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.png'='image/png'}
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 4173)
$listener.Start()
try {
    $url = 'http://127.0.0.1:4173/admin.html'
    Write-Host "SEMLYS: $url"
    Write-Host 'Keep this window open while using the demo.'
    Start-Process $url
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 2000
            $client.SendTimeout = 2000
            $stream = $client.GetStream()
            $header = [Text.StringBuilder]::new()
            while ($header.Length -lt 8192) {
                $byte = $stream.ReadByte()
                if ($byte -lt 0) { break }
                [void]$header.Append([char]$byte)
                if ($byte -eq 10 -and $header.ToString().EndsWith("`r`n`r`n")) { break }
            }
            $file = ''
            if ($header.ToString() -match '^GET /([a-zA-Z0-9.-]+)(?:\?[^ ]*)? HTTP/1\.[01]\r\n') {
                $file = $Matches[1]
            }
            if ($allowed -ccontains $file) {
                $body = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot $file))
                $type = $types[[IO.Path]::GetExtension($file)]
                $status = '200 OK'
            } else {
                $body = [Text.Encoding]::UTF8.GetBytes('Not found')
                $type = 'text/plain; charset=utf-8'
                $status = '404 Not Found'
            }
            $response = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n")
            $stream.Write($response, 0, $response.Length)
            $stream.Write($body, 0, $body.Length)
        } catch [IO.IOException] {
            # The browser can cancel an asset request.
        } finally {
            $client.Dispose()
        }
    }
} finally {
    $listener.Stop()
}
