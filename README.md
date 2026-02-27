# 🚀 2026 정부지원사업 맞춤 찾기 — Growth High

5개 분야 185개 정부지원사업을 업종/업력/희망지원 유형으로 필터링하고,
맞춤형 리포트를 즉시 확인할 수 있는 웹 애플리케이션입니다.

---

## 📁 프로젝트 구조

```
growthhigh-finder/
├── index.html          # HTML 진입점
├── package.json        # 의존성 정의
├── vite.config.js      # Vite 빌드 설정
├── .gitignore
├── README.md           # 이 파일 (배포 가이드)
└── src/
    ├── main.jsx        # React 마운트
    └── App.jsx         # 전체 앱 (데이터 + UI + 리포트)
```

---

## 🛠️ 배포 방법 (Vercel + GitHub)

### Step 1: GitHub 저장소 만들기

1. [github.com](https://github.com) 에 로그인
2. 우측 상단 `+` → `New repository` 클릭
3. Repository name: `growthhigh-finder`
4. Public 또는 Private 선택 → `Create repository`

### Step 2: 코드 올리기 (2가지 중 택 1)

**방법 A — GitHub 웹에서 직접 업로드 (비개발자 추천)**
1. 생성된 저장소 페이지에서 `uploading an existing file` 링크 클릭
2. 이 폴더의 모든 파일을 드래그 앤 드롭
3. ⚠️ `src/` 폴더는 GitHub 웹 업로드에서 폴더째 올리기 어려울 수 있음
   - 이 경우 `Add file` → `Create new file` 에서 파일명을 `src/main.jsx` 로 입력하면 자동으로 폴더 생성됨
   - `src/App.jsx` 도 동일하게 추가

**방법 B — Git 명령어 (개발자 추천)**
```bash
cd growthhigh-finder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/growthhigh-finder.git
git push -u origin main
```

### Step 3: Vercel 연결 & 배포

1. [vercel.com](https://vercel.com) 에 GitHub 계정으로 가입/로그인
2. 대시보드에서 `Add New...` → `Project` 클릭
3. `Import Git Repository` 에서 `growthhigh-finder` 선택
4. Framework Preset: `Vite` 자동 감지됨
5. `Deploy` 클릭 → 약 1~2분 뒤 배포 완료!
6. 배포 URL 확인: `https://growthhigh-finder.vercel.app` (또는 자동 생성된 URL)

### Step 4: 아임웹에 삽입

1. 아임웹 관리자 → 디자인 모드 → 원하는 페이지
2. `위젯 추가` → `기타` → `HTML`
3. 아래 코드 붙여넣기:

```html
<div style="width:100%; max-width:1400px; margin:0 auto;">
  <iframe 
    src="https://YOUR-PROJECT.vercel.app" 
    width="100%" 
    height="2200" 
    frameborder="0"
    style="border:none; min-height:100vh; border-radius:12px;"
    allow="clipboard-write"
  ></iframe>
</div>
```

4. `src="..."` 부분을 실제 Vercel 배포 URL로 교체
5. height 값은 필요에 따라 조절 (리포트 포함 시 2200~2500 추천)

---

## ⚙️ 로컬 개발 (선택)

```bash
npm install
npm run dev
```
→ http://localhost:5173 에서 확인

---

## 🔜 향후 확장

- [ ] 이메일 발송: Vercel Serverless Function + Resend/SendGrid API
- [ ] 리드 저장: Notion API 연동 (팝업 제출 시 자동 DB 저장)
- [ ] 커스텀 도메인: Vercel 설정에서 `finder.growthhigh.co.kr` 등 연결 가능
- [ ] Google Analytics / Meta Pixel 추적 코드 삽입

---

## 📌 참고사항

- 데이터 출처: 2026년 중소벤처기업부 통합공고 (5개 분야)
- 프레임워크: React 18 + Vite 5
- 호스팅: Vercel (무료 플랜으로 충분)
- 아임웹 연동: iframe 방식 (HTML 위젯)
