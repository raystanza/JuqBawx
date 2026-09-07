[CmdletBinding()]
param(
    [string]$OutputPath,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

$BuildVersion = (Get-Content -LiteralPath (Join-Path $PSScriptRoot "version") -Raw).Trim()

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $PSScriptRoot "dist/JuqBawx-Lively-Visualizer-v$BuildVersion.zip"
}

if (-not $SkipTests) {
    Push-Location $PSScriptRoot
    try {
        Write-Host "Running the behavior tests..."
        & node --test "tests/*.test.cjs"
        if ($LASTEXITCODE -ne 0) { throw "Behavior tests failed" }

        Write-Host "Verifying LivelyProperties against the visualizer registry..."
        & node "tools/sync-properties.cjs" --check
        if ($LASTEXITCODE -ne 0) { throw "LivelyProperties.json is out of sync with the registry" }

        Write-Host "Running the Canvas smoke test..."
        & node "smoke-test.cjs"
        if ($LASTEXITCODE -ne 0) { throw "Canvas smoke test failed" }

        Write-Host "Running the WebGL smoke test..."
        $env:MOCK_WEBGL = "1"
        try {
            & node "smoke-test.cjs"
            if ($LASTEXITCODE -ne 0) { throw "WebGL smoke test failed" }
        }
        finally {
            Remove-Item Env:\MOCK_WEBGL -ErrorAction SilentlyContinue
        }
    }
    finally {
        Pop-Location
    }
}

# "src" is a directory; Compress-Archive adds it recursively.
$packageFiles = @(
    "index.html"
    "src"
    "styles.css"
    "LivelyInfo.json"
    "LivelyProperties.json"
    "thumbnail.png"
    "README.md"
    "LICENSE"
)

$packagePaths = foreach ($file in $packageFiles) {
    $path = Join-Path $PSScriptRoot $file
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Required package item is missing: $file"
    }

    $path
}

if (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $PSScriptRoot $OutputPath
}

$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $OutputPath

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Compress-Archive `
    -LiteralPath $packagePaths `
    -DestinationPath $OutputPath `
    -CompressionLevel Optimal

Write-Host "Built $OutputPath"
