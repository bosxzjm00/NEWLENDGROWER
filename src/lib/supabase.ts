/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Borrower, CapitalSource, Collector, LoanAssignment, CollectorCashout } from '../types';

const DEFAULT_SUPABASE_URL = 'https://dzgdaczfaamuibulpsvd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_bPz1d3UGWIsHywk5-00z7w_LqDDvGX0';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const envSupabaseUrl = metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const envSupabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Support local storage key override if user provides credentials in UI/settings
const LOCAL_SUPABASE_URL_KEY = 'lendgrower_supabase_url';
const LOCAL_SUPABASE_ANON_KEY = 'lendgrower_supabase_anon_key';

export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem(LOCAL_SUPABASE_URL_KEY);
  const localKey = localStorage.getItem(LOCAL_SUPABASE_ANON_KEY);
  const url = (localUrl && localUrl.trim()) ? localUrl.trim() : envSupabaseUrl.trim();
  const key = (localKey && localKey.trim()) ? localKey.trim() : envSupabaseAnonKey.trim();
  return { url, key };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (url) {
    localStorage.setItem(LOCAL_SUPABASE_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(LOCAL_SUPABASE_URL_KEY);
  }

  if (key) {
    localStorage.setItem(LOCAL_SUPABASE_ANON_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_SUPABASE_ANON_KEY);
  }
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export interface SupabaseSyncPayload {
  borrowers: Borrower[];
  capitalSources: CapitalSource[];
  collectors: Collector[];
  assignments: LoanAssignment[];
  collectorCashouts: CollectorCashout[];
}

/**
 * Checks connection to Supabase
 */
export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase URL and Anon Key not configured.',
    };
  }

  try {
    // Attempt a lightweight probe on the portfolio_sync table or system
    const { error } = await client.from('portfolio_sync').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table does not exist, connection is still valid if credentials authenticate
      if (error.message && error.message.includes('relation "public.portfolio_sync" does not exist')) {
        return {
          connected: true,
          message: 'Connected to Supabase! (Database schema needs to be initialized via SQL)',
        };
      }
      return {
        connected: false,
        message: `Supabase Error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected and synced with Supabase!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Connection failed: ${errorMsg}`,
    };
  }
};

/**
 * Push local portfolio data to Supabase
 */
export const pushDataToSupabase = async (payload: SupabaseSyncPayload): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    // Upsert full state snapshot into portfolio_sync table for reliable multi-table atomicity
    const { error } = await client.from('portfolio_sync').upsert({
      id: 'main_portfolio',
      borrowers: payload.borrowers,
      capital_sources: payload.capitalSources,
      collectors: payload.collectors,
      assignments: payload.assignments,
      collector_cashouts: payload.collectorCashouts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      // If table doesn't exist, provide a helpful note
      if (error.message.includes('relation "public.portfolio_sync" does not exist')) {
        return {
          success: false,
          error: 'The table "portfolio_sync" does not exist in your Supabase database yet. Please run the setup SQL in your Supabase SQL Editor.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

/**
 * Wipe/Reset remote Supabase data completely
 */
export const clearRemoteSupabasePortfolio = async (
  payload?: SupabaseSyncPayload
): Promise<{ success: boolean; error?: string; isRlsError?: boolean }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const cleanPayload = payload || {
    borrowers: [],
    capitalSources: [],
    collectors: [],
    assignments: [],
    collectorCashouts: [],
  };

  try {
    const { error } = await client.from('portfolio_sync').upsert({
      id: 'main_portfolio',
      borrowers: cleanPayload.borrowers,
      capital_sources: cleanPayload.capitalSources,
      collectors: cleanPayload.collectors,
      assignments: cleanPayload.assignments,
      collector_cashouts: cleanPayload.collectorCashouts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      const isRls = error.message.includes('row-level security') || error.code === '42501';
      return {
        success: false,
        error: isRls
          ? 'Supabase Row-Level Security blocked this operation. Run the SQL script in your Supabase SQL Editor to allow updates.'
          : error.message,
        isRlsError: isRls,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

/**
 * Fetch remote portfolio data from Supabase
 */
export const pullDataFromSupabase = async (): Promise<{
  success: boolean;
  data?: SupabaseSyncPayload;
  error?: string;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await client
      .from('portfolio_sync')
      .select('*')
      .eq('id', 'main_portfolio')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No remote portfolio record found in Supabase.' };
    }

    return {
      success: true,
      data: {
        borrowers: data.borrowers || [],
        capitalSources: data.capital_sources || [],
        collectors: data.collectors || [],
        assignments: data.assignments || [],
        collectorCashouts: data.collector_cashouts || [],
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};
