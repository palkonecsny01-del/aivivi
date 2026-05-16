export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          system_prompt: string;
          model: string;
          visibility: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          description?: string;
          system_prompt?: string;
          model?: string;
          visibility?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          system_prompt?: string;
          model?: string;
          visibility?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      threads: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string | null;
          title: string;
          model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id?: string | null;
          title?: string;
          model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          model?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
  };
}
