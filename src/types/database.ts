/**
 * Database type definitions for Supabase.
 *
 * These types mirror the Drizzle schema and are used to type
 * the Supabase client for Storage operations and auth helpers.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          default_address: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          default_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          default_address?: string | null;
          created_at?: string;
        };
      };
    };
    Storage: {
      Buckets: {
        receipts: {
          fileSizeLimit?: number;
          allowedMimeTypes?: string[];
        };
        "product-images": {
          fileSizeLimit?: number;
          allowedMimeTypes?: string[];
        };
      };
    };
  };
}
