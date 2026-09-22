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

## ディレクトリ構成

```
src/
  proxy.ts                  Next.js 16 の proxy（旧 middleware）。セッション更新と未ログイン時のリダイレクト
  app/
    layout.tsx              ルートレイアウト
    login/                  ログイン画面（Discord ログインボタン）
    auth/callback/route.ts  OAuth のコールバック（認可コード → セッション）
    auth/actions.ts         ログアウト用の Server Action
    (app)/                  ログイン必須の画面群（共通ヘッダー付き）
  components/               共通コンポーネント
  lib/
    database.types.ts       DB のスキーマに対応する型
    supabase/client.ts      ブラウザ用クライアント
    supabase/server.ts      サーバー用クライアント
supabase/migrations/        DB スキーマ（変更しないこと）
```
