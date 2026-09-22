/**
 * supabase/migrations/001_init.sql に対応する型定義。
 * `npx supabase gen types typescript` が出力する形と同じ構造にしてある。
 * スキーマを変更したときはこのファイルも合わせて更新すること。
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tag: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      game: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      game_tag: {
        Row: {
          game_id: string;
          tag_id: string;
        };
        Insert: {
          game_id: string;
          tag_id: string;
        };
        Update: {
          game_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_tag_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_tag_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tag";
            referencedColumns: ["id"];
          },
        ];
      };
      person: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          discord_id: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          discord_id?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          discord_id?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      session: {
        Row: {
          id: string;
          user_id: string;
          played_on: string;
          game_id: string;
          sort_order: number;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          played_on: string;
          game_id: string;
          sort_order?: number;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          played_on?: string;
          game_id?: string;
          sort_order?: number;
          memo?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "game";
            referencedColumns: ["id"];
          },
        ];
      };
      session_person: {
        Row: {
          session_id: string;
          person_id: string;
        };
        Insert: {
          session_id: string;
          person_id: string;
        };
        Update: {
          session_id?: string;
          person_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_person_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_person_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      session_detail: {
        Row: {
          id: string;
          played_on: string;
          sort_order: number;
          memo: string | null;
          game_id: string;
          game_title: string;
          tags: string[];
          participants: Json;
        };
        Relationships: [];
      };
    };
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/* ---------- アプリ側で使いやすくした型 ---------- */

export type Tag = Database["public"]["Tables"]["tag"]["Row"];
export type Game = Database["public"]["Tables"]["game"]["Row"];
export type Person = Database["public"]["Tables"]["person"]["Row"];
export type GameSession = Database["public"]["Tables"]["session"]["Row"];

/** session_detail.participants の1要素 */
export type Participant = {
  id: string;
  name: string;
  discord_id: string | null;
};

/** participants を JSON からパース済みにした session_detail の行 */
export type SessionDetail = Omit<
  Database["public"]["Views"]["session_detail"]["Row"],
  "participants"
> & {
  participants: Participant[];
};
