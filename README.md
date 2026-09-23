# PlayMemos

ゲーム・マダミス・TRPG などで「いつ・誰と・何を遊んだか」を記録する個人用 Web アプリ。

## 技術スタック

- Next.js 16（App Router）+ TypeScript
- Supabase（PostgreSQL / Auth / RLS）
- 認証：Supabase Auth の Discord プロバイダ
- Tailwind CSS v4
- FullCalendar（月表示）※フェーズ4で導入

## セットアップ

### 1. Supabase プロジェクトを作る

1. https://supabase.com/dashboard で **New project** を作成（リージョンは Tokyo (ap-northeast-1) が近い）
2. **SQL Editor** を開き、`supabase/migrations/001_init.sql` の中身をそのまま貼り付けて実行する
3. **Table Editor** に `tag` / `game` / `game_tag` / `person` / `session` / `session_person` が出来ていることを確認する

### 2. Discord の OAuth アプリを作る

1. https://discord.com/developers/applications で **New Application** を作成
2. 左メニュー **OAuth2** を開く
   - **Client ID** と **Client Secret**（Reset Secret で表示）を控える
   - **Redirects** に Supabase のコールバック URL を追加する
     ```
     https://<プロジェクト参照ID>.supabase.co/auth/v1/callback
     ```
     （Supabase ダッシュボード **Authentication > Sign In / Providers > Discord** に表示されている Callback URL をそのままコピーする）
3. Supabase ダッシュボード **Authentication > Sign In / Providers > Discord**
   - Discord を有効化し、控えた Client ID / Client Secret を貼り付けて保存
4. Supabase ダッシュボード **Authentication > URL Configuration**
   - **Site URL** に `http://localhost:3000`
   - **Redirect URLs** に `http://localhost:3000/**` を追加（本番にデプロイしたらそのドメインも追加する）

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作り、値を埋める。

```bash
cp .env.example .env.local
```

| 変数名 | 取得場所 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings > Data API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings > API Keys > anon / publishable key |

### 4. 起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

## 画面

| パス | 内容 |
| --- | --- |
| `/login` | Discord ログイン |
| `/` | カレンダー（月表示）。日付クリックでその日の記録を表示。タグ・ゲーム・参加者で絞り込み |
| `/sessions/new` | 日付を決めて編集画面へ送る入り口 |
| `/sessions/[date]/edit` | その日の記録をまとめて編集（1行 = ゲーム＋参加者＋メモ） |
| `/games` | ゲーム一覧・タグの付け外し・タグ管理 |
| `/games/[id]` | ゲームの詳細（名前・タグの編集、よく一緒に遊ぶ人、遊んだ記録） |
| `/people` | 友人一覧（名前・回数・最後に遊んだ日） |
| `/people/[id]` | 友人の詳細（名前・Discord ID・メモの編集と、一緒に遊んだ記録） |

## ディレクトリ構成

```
src/
  proxy.ts                  Next.js 16 の proxy（旧 middleware）。セッション更新と未ログイン時のリダイレクト
  app/
    layout.tsx              ルートレイアウト
    login/                  ログイン画面
    auth/callback/route.ts  OAuth のコールバック
    auth/actions.ts         ログアウト用の Server Action
    (app)/                  ログイン必須の画面群（共通ヘッダー付き）
      page.tsx              カレンダー
      calendar-view.tsx     FullCalendar と絞り込み（クライアント）
      games/ people/ sessions/
  components/               共通コンポーネント
  lib/
    database.types.ts       DB のスキーマに対応する型
    data/                   読み取り専用のクエリ
    supabase/               ブラウザ用・サーバー用クライアント
    date.ts errors.ts validation.ts
supabase/migrations/        DB スキーマ（変更しないこと）
```

## MVP の対象外

- 友人の Discord アイコン取得（現状は名前の頭文字アイコン）
- Discord ボイスチャンネルからの参加者自動検出
- マダミスの通過済み管理
- 他ユーザーとの記録共有

## 開発メモ

- 記録の保存は「その日の記録を送られた内容に揃える」という形。
  PostgREST は複数文を 1 トランザクションにできないため、
  削除 → `session` の upsert → `session_person` の貼り直し、の順に実行している。
- 「今日」の判定は `Asia/Tokyo` 固定（`src/lib/date.ts`）。
- FullCalendar は v6.1.21（v7 は daygrid がまだ rc のため）。
