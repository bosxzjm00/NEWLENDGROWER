/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Borrower, CapitalSource, Collector, LoanAssignment, CollectorCashout, ActivityLog } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://dzgdaczfaamuibulpsvd.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_bPz1d3UGWIsHywk5-00z7w_LqDDvGX0';

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
  activityLogs?: ActivityLog[];
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
export const pushDataToSupabase = async (
  payload: SupabaseSyncPayload,
  portfolioId: string = 'main_portfolio'
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const cleanPortfolioId = portfolioId?.trim() || 'main_portfolio';

  try {
    // Sanitize any potential undefined or circular values
    const safeBorrowers = JSON.parse(JSON.stringify(payload.borrowers || []));
    const safeCapital = JSON.parse(JSON.stringify(payload.capitalSources || []));
    const safeCollectors = JSON.parse(JSON.stringify(payload.collectors || []));
    const safeAssignments = JSON.parse(JSON.stringify(payload.assignments || []));
    const safeCashouts = JSON.parse(JSON.stringify(payload.collectorCashouts || []));
    const safeActivities = JSON.parse(JSON.stringify(payload.activityLogs || []));

    // Upsert full state snapshot into portfolio_sync table for reliable multi-table atomicity
    const upsertPayload: Record<string, unknown> = {
      id: cleanPortfolioId,
      borrowers: safeBorrowers,
      capital_sources: safeCapital,
      collectors: safeCollectors,
      assignments: safeAssignments,
      collector_cashouts: safeCashouts,
      activity_logs: safeActivities,
      updated_at: new Date().toISOString(),
    };

    let { error } = await client.from('portfolio_sync').upsert(upsertPayload, { onConflict: 'id' });

    // Graceful fallback: If Supabase table hasn't been altered to add activity_logs column yet,
    // retry without activity_logs so portfolio sync never fails.
    if (error && (error.message.includes('activity_logs') || error.code === '42703')) {
      delete upsertPayload.activity_logs;
      const fallbackResult = await client.from('portfolio_sync').upsert(upsertPayload, { onConflict: 'id' });
      error = fallbackResult.error;
    }

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
 * Wipe/Reset remote Supabase data completely for a given portfolio
 */
export const clearRemoteSupabasePortfolio = async (
  payload?: SupabaseSyncPayload,
  portfolioId: string = 'main_portfolio'
): Promise<{ success: boolean; error?: string; isRlsError?: boolean }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const cleanPortfolioId = portfolioId?.trim() || 'main_portfolio';

  const cleanPayload = payload || {
    borrowers: [],
    capitalSources: [],
    collectors: [],
    assignments: [],
    collectorCashouts: [],
    activityLogs: [],
  };

  try {
    // 1. Delete target portfolio record from the table
    const { error: delError } = await client
      .from('portfolio_sync')
      .delete()
      .eq('id', cleanPortfolioId);

    if (delError) {
      const isRls = delError.message.includes('row-level security') || delError.code === '42501';
      console.warn('Supabase delete warning, falling back to upsert:', delError.message);
      if (isRls) {
        return {
          success: false,
          error: 'Supabase Row-Level Security blocked delete operation. Please run the updated SQL in your Supabase SQL Editor.',
          isRlsError: true,
        };
      }
    }

    // 2. Set the portfolio snapshot with clean empty arrays
    const cleanUpsert: Record<string, unknown> = {
      id: cleanPortfolioId,
      borrowers: cleanPayload.borrowers,
      capital_sources: cleanPayload.capitalSources,
      collectors: cleanPayload.collectors,
      assignments: cleanPayload.assignments,
      collector_cashouts: cleanPayload.collectorCashouts,
      activity_logs: cleanPayload.activityLogs || [],
      updated_at: new Date().toISOString(),
    };

    let { error: upsertError } = await client.from('portfolio_sync').upsert(cleanUpsert, { onConflict: 'id' });

    if (upsertError && (upsertError.message.includes('activity_logs') || upsertError.code === '42703')) {
      delete cleanUpsert.activity_logs;
      const retry = await client.from('portfolio_sync').upsert(cleanUpsert, { onConflict: 'id' });
      upsertError = retry.error;
    }

    if (upsertError) {
      const isRls = upsertError.message.includes('row-level security') || upsertError.code === '42501';
      return {
        success: false,
        error: isRls
          ? 'Supabase Row-Level Security blocked this operation. Run the SQL script in your Supabase SQL Editor to allow updates.'
          : upsertError.message,
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
 * Fetch remote portfolio data from Supabase for a given portfolio
 */
export const pullDataFromSupabase = async (
  portfolioId: string = 'main_portfolio'
): Promise<{
  success: boolean;
  data?: SupabaseSyncPayload;
  error?: string;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const cleanPortfolioId = portfolioId?.trim() || 'main_portfolio';

  try {
    const { data, error } = await client
      .from('portfolio_sync')
      .select('*')
      .eq('id', cleanPortfolioId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: true,
        data: {
          borrowers: [],
          capitalSources: [],
          collectors: [],
          assignments: [],
          collectorCashouts: [],
          activityLogs: [],
        },
      };
    }

    return {
      success: true,
      data: {
        borrowers: data.borrowers || [],
        capitalSources: data.capital_sources || [],
        collectors: data.collectors || [],
        assignments: data.assignments || [],
        collectorCashouts: data.collector_cashouts || [],
        activityLogs: data.activity_logs || [],
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

/**
 * Fetch a single borrower's up-to-date schedule from Supabase.
 * Searches across portfolio records to support multi-admin loan lookups.
 * Supports custom configuration (e.g. from share link query param).
 */
export const fetchBorrowerFromSupabase = async (
  borrowerId: string,
  customConfig?: { url?: string; key?: string }
): Promise<{
  success: boolean;
  borrower?: Borrower | null;
  updatedAt?: string;
  error?: string;
}> => {
  const config = (customConfig && customConfig.url && customConfig.key)
    ? { url: customConfig.url.trim(), key: customConfig.key.trim() }
    : getSupabaseConfig();

  if (!config.url || !config.key) {
    return { success: false, error: 'Supabase configuration is missing.' };
  }

  try {
    let client: SupabaseClient;
    if (customConfig && customConfig.url && customConfig.key) {
      client = createClient(config.url, config.key, {
        auth: { persistSession: false },
      });
    } else {
      const defaultClient = getSupabaseClient();
      if (!defaultClient) {
        return { success: false, error: 'Supabase client failed to initialize.' };
      }
      client = defaultClient;
    }

    const { data, error } = await client
      .from('portfolio_sync')
      .select('id, borrowers, updated_at');

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || !Array.isArray(data)) {
      return { success: true, borrower: null };
    }

    const target = (borrowerId || '').trim().toLowerCase();
    const cleanNum = target.replace(/^[#\s]+/, '');

    let foundBorrower: Borrower | null = null;
    let foundUpdatedAt: string | undefined = undefined;

    for (const row of data) {
      if (Array.isArray(row.borrowers)) {
        const match = (row.borrowers as Borrower[]).find(
          (b) =>
            b.id.toLowerCase() === target ||
            (b.loan_id && (b.loan_id.toLowerCase() === target || b.loan_id.toLowerCase() === cleanNum)) ||
            b.name.toLowerCase() === target
        );
        if (match) {
          foundBorrower = match;
          foundUpdatedAt = row.updated_at;
          break;
        }
      }
    }

    return {
      success: true,
      borrower: foundBorrower,
      updatedAt: foundUpdatedAt,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

/**
 * Cloud sync for user accounts registry so accounts created by admin sync to all devices
 */
export const pushUsersRegistryToSupabase = async (
  users: Record<string, { password: string; createdAt: string; role?: string; status?: string }>
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase is not configured.' };

  try {
    const { error } = await client.from('portfolio_sync').upsert({
      id: 'system_users_registry',
      borrowers: users as unknown as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

export const pullUsersRegistryFromSupabase = async (): Promise<{
  success: boolean;
  users?: Record<string, { password: string; createdAt: string; role?: string; status?: string }>;
  error?: string;
}> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase is not configured.' };

  try {
    const { data, error } = await client
      .from('portfolio_sync')
      .select('borrowers')
      .eq('id', 'system_users_registry')
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data || !data.borrowers) return { success: true, users: {} };
    return {
      success: true,
      users: data.borrowers as unknown as Record<string, { password: string; createdAt: string; role?: string; status?: string }>,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

