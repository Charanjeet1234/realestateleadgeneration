import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Property } from '../data/marketData';
import { api, type BenchmarkRecord, type DeveloperRecord, type SessionUser } from './api';

// ───────── Auth ─────────

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: SessionUser | null }>('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const d = await api.post<{ user: SessionUser }>('/auth/login', { email, password });
    setUser(d.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ───────── Market data (listings, developers, benchmarks) ─────────

interface MarketDataState {
  properties: Property[];
  developers: DeveloperRecord[];
  benchmarks: BenchmarkRecord[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const MarketDataContext = createContext<MarketDataState | null>(null);

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [developers, setDevelopers] = useState<DeveloperRecord[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<{ properties: Property[] }>('/properties'),
      api.get<{ developers: DeveloperRecord[] }>('/developers'),
      api.get<{ benchmarks: BenchmarkRecord[] }>('/benchmarks'),
    ])
      .then(([p, d, b]) => {
        setProperties(p.properties);
        setDevelopers(d.developers);
        setBenchmarks(b.benchmarks);
      })
      .catch((err) => setError(err.message || 'Could not load listings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <MarketDataContext.Provider value={{ properties, developers, benchmarks, loading, error, reload: load }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be used inside MarketDataProvider');
  return ctx;
}
