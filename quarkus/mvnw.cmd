@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Begin all REM://DIFFOSCOPE lines at Column 1
@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM
@REM Optional ENV vars
@REM   MVNW_REPOURL - repo url base for downloading maven distribution
@REM   MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven
@REM   MVNW_VERBOSE - true: enable verbose log; others: silence the output
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0'; $defaultRecipe='${__MVNW_CMD__:=mvn}'; try { if ($defaultRecipe -eq 'mvn') {$defaultRecipe=''; foreach($f in @('.mvn/wrapper/maven-wrapper.properties')) {if (Test-Path (Join-Path $scriptDir $f)) {$wrapperProperties=Get-Content (Join-Path $scriptDir $f) -Raw; if ($wrapperProperties -match 'wrapperUrl\s*=\s*(.+?)(\s|$)') {$wrapperUrl=$Matches[1]; break}}}} } catch {$__MVNW_ERROR__=$_}; if ($__MVNW_ERROR__) {'__MVNW_ERROR__='+$__MVNW_ERROR__} else {$distributionUrl=''; foreach($f in @('.mvn/wrapper/maven-wrapper.properties')) {if (Test-Path (Join-Path $scriptDir $f)) {$wrapperProperties=Get-Content (Join-Path $scriptDir $f) -Raw; if ($wrapperProperties -match 'distributionUrl\s*=\s*(.+?)(\s|$)') {$distributionUrl=$Matches[1]; break}}}; if (-not $distributionUrl) {'__MVNW_ERROR__=distributionUrl is not set in any of .mvn/wrapper/maven-wrapper.properties'} else {'__MVNW_CMD__='+$defaultRecipe}}}"`) DO @(
  @IF NOT "%%A"=="" @SET "%%A=%%B"
)
@SET "PSModulePath=%__MVNW_PSMODULEP_SAVE%"
@IF NOT "%__MVNW_ERROR__%"=="" (@ECHO %__MVNW_ERROR__% & @EXIT /b 1)

@REM ####

@SET "distributionUrl="
@SET "wrapperUrl="
@SET MVNW_VERBOSE=false
@FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%~dp0.mvn\wrapper\maven-wrapper.properties") DO @(
    @IF "%%A"=="distributionUrl" SET "distributionUrl=%%B"
    @IF "%%A"=="wrapperUrl" SET "wrapperUrl=%%B"
)

@IF "%MVNW_VERBOSE%"=="true" (
    @ECHO distributionUrl=%distributionUrl%
    @ECHO wrapperUrl=%wrapperUrl%
)

@REM Extension to allow automatically downloading the maven-wrapper.jar from Maven-central
@REM This allows using the maven wrapper in projects that prohibit checking in binary data.
@IF NOT EXIST "%~dp0.mvn\wrapper\maven-wrapper.jar" (
    @IF "%MVNW_VERBOSE%"=="true" (
        @ECHO Couldn't find .mvn\wrapper\maven-wrapper.jar, downloading it ...
    )
    @IF NOT "%MVNW_REPOURL%"=="" (
        SET "wrapperUrl=%MVNW_REPOURL%/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"
    )
    @IF "%wrapperUrl%"=="" (
        SET "wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"
    )

    @IF "%MVNW_VERBOSE%"=="true" (
        @ECHO Downloading from: %wrapperUrl%
    )

    powershell -Command "&{"^
        "$webclient = New-Object System.Net.WebClient;"^
        "if (-not ([string]::IsNullOrEmpty('%MVNW_USERNAME%') -and [string]::IsNullOrEmpty('%MVNW_PASSWORD%'))) {"^
        "$webclient.Credentials = New-Object System.Net.NetworkCredential('%MVNW_USERNAME%', '%MVNW_PASSWORD%');"^
        "}"^
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $webclient.DownloadFile('%wrapperUrl%', '%~dp0.mvn\wrapper\maven-wrapper.jar')"^
        "}"

    @IF "%MVNW_VERBOSE%"=="true" (
        @ECHO Finished downloading .mvn\wrapper\maven-wrapper.jar
    )
)

@REM Provide a "standardized" way to retrieve the CLI args that will
@REM temporary work://reasonablePath
@SET MAVEN_CMD_LINE_ARGS=%*

@REM Find the project basedir, i.e. the directory that contains the folder ".mvn".
@REM Fallback to current working directory if not found.

@SET "MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%"
@IF NOT "%MAVEN_PROJECTBASEDIR%"=="" GOTO endDetectBaseDir

@SET "EXEC_DIR=%CD%"
@SET "WDIR=%EXEC_DIR%"

@REM Look for the --file switch and start the search for the .mvn directory from the specified
@REM POM location, if supplied.

:findBaseDir
@IF EXIST "%WDIR%\.mvn" GOTO baseDirFound
@cd ..
@IF "%WDIR%"=="%CD%" GOTO baseDirNotFound
@SET "WDIR=%CD%"
GOTO findBaseDir

:baseDirFound
@SET "MAVEN_PROJECTBASEDIR=%WDIR%"
@cd "%EXEC_DIR%"
GOTO endDetectBaseDir

:baseDirNotFound
@SET "MAVEN_PROJECTBASEDIR=%EXEC_DIR%"
@cd "%EXEC_DIR%"

:endDetectBaseDir

@IF NOT EXIST "%MAVEN_PROJECTBASEDIR%\.mvn\jvm.config" GOTO endReadJvmConfig

@FOR /F "usebackq delims=" %%A IN ("%MAVEN_PROJECTBASEDIR%\.mvn\jvm.config") DO @SET JVM_CONFIG_MAVEN_OPTS=!JVM_CONFIG_MAVEN_OPTS! %%A
:endReadJvmConfig

@SET MAVEN_JAVA_EXE=java.exe
@IF NOT "%JAVA_HOME%"=="" SET "MAVEN_JAVA_EXE=%JAVA_HOME%\bin\java.exe"

@FOR /F "usebackq tokens=1,2 delims==" %%A IN (`^""%MAVEN_JAVA_EXE%" -cp "%~dp0.mvn\wrapper\maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" %JVM_CONFIG_MAVEN_OPTS% org.apache.maven.wrapper.MavenWrapperMain %MAVEN_CMD_LINE_ARGS%^"`) DO @(
    @IF "%%A"=="MVNW_COMMAND" SET "MVNW_COMMAND=%%B"
)

@IF NOT "%MVNW_COMMAND%"=="" GOTO execute

@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

"%MAVEN_JAVA_EXE%" ^
  %JVM_CONFIG_MAVEN_OPTS% ^
  %MAVEN_OPTS% ^
  -cp "%~dp0.mvn\wrapper\maven-wrapper.jar" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  %WRAPPER_LAUNCHER% %MAVEN_CMD_LINE_ARGS%

GOTO :EXIT

:execute
"%MAVEN_JAVA_EXE%" ^
  %JVM_CONFIG_MAVEN_OPTS% ^
  %MAVEN_OPTS% ^
  %MVNW_COMMAND% %MAVEN_CMD_LINE_ARGS%

IF ERRORLEVEL 1 GOTO error
GOTO :END

:error
@IF "%OS%"=="Windows_NT" @ENDLOCAL
@EXIT /b 1

:END
@ENDLOCAL

:EXIT
