@echo off
setlocal
cd /d "%~dp0"

if not defined MSFS2024_SDK (
  echo ERROR: MSFS2024_SDK is not set.
  echo Example: set "MSFS2024_SDK=C:\MSFS2024 SDK"
  exit /b 1
)

set "FSPT=%MSFS2024_SDK%\Tools\bin\fspackagetool.exe"
if not exist "%FSPT%" (
  echo ERROR: Cannot find "%FSPT%"
  exit /b 1
)

echo Building SPB...
"%FSPT%" "Build\vne-gauge-msfs2024.xml" -rebuild
if errorlevel 1 exit /b %errorlevel%

set "SPB=Build\Packages\vne-gauge-msfs2024\Build\vne-gauge-msfs2024.spb"
if not exist "%SPB%" (
  echo Expected SPB not found. Searching build output...
  for /r "Build" %%F in (*.spb) do set "SPB=%%F"
)
if not exist "%SPB%" (
  echo ERROR: No SPB was generated.
  exit /b 1
)

if not exist "InGamePanels" mkdir "InGamePanels"
copy /Y "%SPB%" "InGamePanels\InGamePanel_VneGauge.spb" >nul
if errorlevel 1 exit /b %errorlevel%

echo Regenerating layout.json...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root=(Get-Location).Path; $files=Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike ($root+'\Build\*') -and $_.FullName -notlike ($root+'\.git\*') -and $_.FullName -notlike ($root+'\dist\*') -and -not $_.Name.StartsWith('.') -and $_.Name -ne 'layout.json' -and $_.Name -ne 'manifest.json' -and $_.Name -ne 'build.bat' -and $_.Name -ne 'README.txt' }; $content=@(); foreach($f in $files){ $rel=$f.FullName.Substring($root.Length+1).Replace('\','/'); $content += [ordered]@{path=$rel; size=$f.Length; date=$f.LastWriteTimeUtc.ToFileTimeUtc()} }; [ordered]@{content=$content} | ConvertTo-Json -Depth 4 | Set-Content -Encoding ASCII layout.json"
if errorlevel 1 exit /b %errorlevel%

echo Updating total_package_size...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root=(Get-Location).Path; $total=(Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike ($root+'\Build\*') -and $_.FullName -notlike ($root+'\.git\*') -and $_.FullName -notlike ($root+'\dist\*') -and -not $_.Name.StartsWith('.') -and $_.Name -ne 'manifest.json' -and $_.Name -ne 'build.bat' -and $_.Name -ne 'README.txt' } | Measure-Object Length -Sum).Sum; $m=Get-Content -Raw manifest.json | ConvertFrom-Json; $m | Add-Member -NotePropertyName total_package_size -NotePropertyValue ('{0:D20}' -f [int64]$total) -Force; $m | ConvertTo-Json -Depth 10 | Set-Content -Encoding ASCII manifest.json"
if errorlevel 1 exit /b %errorlevel%

if /i "%~1"=="package" goto :package

echo.
echo SUCCESS.
echo Community package root is:
echo   %CD%
echo Copy this entire folder to Community after building,
echo or run "build.bat package" to make a distributable zip.
endlocal
exit /b 0

:package
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "(Get-Content -Raw manifest.json | ConvertFrom-Json).package_version"`) do set "VER=%%V"
set "PKG=dist\vne-gauge-msfs2024"
set "ZIP=dist\vne-gauge-msfs2024-%VER%.zip"

echo Packaging version %VER%...
if exist dist rmdir /s /q dist
robocopy . "%PKG%" manifest.json layout.json README.txt >nul
if errorlevel 8 exit /b 1
robocopy html_ui "%PKG%\html_ui" /E >nul
if errorlevel 8 exit /b 1
robocopy InGamePanels "%PKG%\InGamePanels" /E >nul
if errorlevel 8 exit /b 1

powershell -NoProfile -Command "Compress-Archive -Path '%PKG%' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 exit /b %errorlevel%

echo.
echo SUCCESS.
echo Distributable zip:
echo   %CD%\%ZIP%
echo Users unzip it into their Community folder.
endlocal
exit /b 0
