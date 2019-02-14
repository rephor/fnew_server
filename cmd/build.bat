@echo off

set version=%1
if "%version%"=="" (
  echo useage: build version
  goto end
)

echo  current build version is %version%

if exist back\%version%.zip del back\%version%.zip
if exist back\%version%.mock.zip del back\%version%.mock.zip

if exist release rd /S /Q release
if exist mock rd /S /Q mock

md release
md release\public
md release\dist
md release\config
md mock

echo ============== start build web ==============

cd web
git pull
call npm install
rd /S /Q dist
call npm run build
xcopy /S dist\* ..\release\public

cd ..

echo ============== start build server ==============

cd server
git pull
call npm install

echo export const version = '%version%' > src\common\version.ts

call npm run prestart:prod

rem copy server release
copy package.json ..\release\
xcopy config ..\release\config\
xcopy /S dist\src\* ..\release\dist\
copy cmd\start.bat ..\release\

rem copy mock
xcopy /S dist\* ..\mock\
xcopy /S mock\*.json ..\mock\mock\
copy cmd\start_mock.bat ..\mock\

cd..

cd release
call npm install --production
del *.json

cd ..
if not exist back md back

echo ============== start zip ==============

cd server
call npx cross-zip ..\release ..\back\%version%.zip
call npx cross-zip ..\mock ..\back\%version%.mock.zip

cd ..

rd /S /Q release
rd /S /Q mock

:end
@echo on
