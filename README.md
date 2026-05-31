# Super Mario - Stage 1

Vite + TypeScript + Phaser 횡스크롤 플랫폼 게임입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

**http://127.0.0.1:5173** — 반영 안 되면 `npm run restart`

HUD **`· v13`** = 최신 빌드

## 조작

| 입력 | 동작 |
|------|------|
| ← → / ◀ ▶ | 이동 |
| Space / Z / JUMP | 점프 |
| R | 재시작 |

모바일·태블릿은 터치 버튼 자동 표시.

---

## 배포하기 (URL로 공유)

### 방법 1 — Vercel (가장 쉬움, 권장)

**한 번만:** [vercel.com](https://vercel.com) 가입

터미널에서 프로젝트 폴더로 이동 후:

```bash
npm run deploy:vercel
```

- 처음 실행 시 브라우저 로그인·프로젝트 이름 물어봄 → Enter로 진행
- 끝나면 **`https://xxxx.vercel.app`** URL 출력 → 이 주소를 친구에게 공유

**GitHub 연동 (자동 배포):**

1. GitHub에 저장소 push
2. [vercel.com/new](https://vercel.com/new) → Import Git Repository
3. Framework: **Vite**, Build: `npm run build`, Output: `dist`
4. Deploy → push할 때마다 자동 배포

### 방법 2 — Netlify

```bash
npm run deploy:netlify
```

처음엔 Netlify 로그인 필요. `netlify.toml` 설정 포함됨.

### 방법 3 — 빌드만 (직접 업로드)

```bash
npm run build
```

생성된 **`dist/`** 폴더 전체를 Vercel·Netlify·Cloudflare Pages 대시보드에 드래그 앤 드롭.

---

## 맵 기호 (`src/levels/stage1.ts`)

| 문자 | 의미 |
|------|------|
| `e` | 굼바 |
| `T` | 쿠파 (투사체) |
| `H` | 깡총이 (후반) |
| `A` | 비행기 (후반) |
| `f` | 골 깃발 |
| `S` | 시작 |
