import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PlayMemos",
    template: "%s | PlayMemos",
  },
  description: "いつ・誰と・何を遊んだかを記録する個人用アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
