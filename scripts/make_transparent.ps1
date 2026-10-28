Add-Type -AssemblyName System.Drawing

function Convert-ToTransparentPng($inputPath, $outputPath) {
    $bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $inputPath))
    $newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($x = 0; $x -lt $bmp.Width; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            $c = $bmp.GetPixel($x, $y)
            # Threshold for pure/near white
            if ($c.R -gt 242 -and $c.G -gt 242 -and $c.B -gt 242) {
                $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $newBmp.SetPixel($x, $y, $c)
            }
        }
    }

    $newBmp.Save((Join-Path (Get-Location) $outputPath), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $newBmp.Dispose()
    Write-Host "Created $outputPath"
}

Convert-ToTransparentPng "public\logo-icon.jpg" "public\logo-icon.png"
Convert-ToTransparentPng "public\logo-full.jpg" "public\logo-full.png"

