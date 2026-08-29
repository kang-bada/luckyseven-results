# 럭키세븐 — 당첨번호 자동 갱신 (10분 설정, 이후 완전 자동)

매주 토요일 밤(로또)·목요일 밤(연금복권), GitHub이 알아서 당첨번호를 받아
results.json 을 갱신 → 앱이 열릴 때 읽어 자동 반영. 서버 비용 0원.

## 설정 (한 번만)

1. github.com 가입 → 오른쪽 위 + → New repository
   - 이름: luckyseven-results · Public 선택 → Create repository
2. Add file → Upload files 로 이 폴더의 파일을 전부 끌어다 놓기
   - fetch-results.mjs, results.json
   - .github 폴더 (구조 그대로! 안 올라가면: Add file → Create new file →
     이름칸에 .github/workflows/update-results.yml 입력 → yml 내용 붙여넣기)
   - 초록색 Commit changes 버튼
3. Actions 탭 → 왼쪽 update-results → Run workflow 버튼으로 첫 실행
   - 초록불 = 성공 / 빨간불 = 로그를 복사해 Claude에게
4. Claude에게 알려주기: "깃허브 아이디 ___, 저장소 이름 ___"
   → 앱에 주소를 심은 새 .ait 를 만들어 줍니다 (이걸 콘솔에 올리면 완성)

## 이후

할 일 없음. 가끔 Actions 탭에 초록불 찍히는지 구경만.
