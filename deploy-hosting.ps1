$ErrorActionPreference = "Stop"
Write-Host "🚀 fulmi-admin 빌드 시작..." -ForegroundColor Cyan
npm.cmd run build

Write-Host "`n🔥 Firebase Hosting 배포 실행 중..." -ForegroundColor Yellow
# firebase-tools가 로컬/전역에 없을 수 있으므로 npx를 활용하여 안전히 무중단 실행
npx.cmd -y firebase-tools deploy --only hosting --project fulmi-prod

Write-Host "`n🎉 배포가 성공적으로 완료되었습니다!" -ForegroundColor Green
