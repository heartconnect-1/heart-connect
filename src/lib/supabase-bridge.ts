import { api, auth } from '@appdeploy/client';
import { supabase } from './supabase';

type HeartProfile = {
  name?: string;
  age?: number;
  city?: string;
  country?: string;
  gender?: string;
  relationshipGoal?: string;
  bio?: string;
  interests?: string;
  languages?: string;
  occupation?: string;
  education?: string;
  completion?: number;
  verification?: { email?: boolean; phone?: boolean; face?: string; identity?: string };
};

type AppDeployUser = { email?: string } | null | undefined;

const csv = (value?: string) => String(value || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 30);
const clean = (value?: string) => String(value || '').trim();
let lastFingerprint = '';
let running = false;

function verificationLevel(profile: HeartProfile) {
  if (profile.verification?.identity === 'verified') return 'identity';
  if (profile.verification?.face === 'verified') return 'photo';
  if (profile.verification?.phone) return 'phone';
  if (profile.verification?.email) return 'email';
  return 'unverified';
}

export async function syncHeartConnectProfileToSupabase() {
  if (running) return { synced: false as const, reason: 'busy' };
  running = true;
  try {
    const [{ data: sessionData }, appUserRaw] = await Promise.all([
      supabase.auth.getSession(),
      auth.getUser().catch(() => null),
    ]);
    const session = sessionData.session;
    const appUser = appUserRaw as AppDeployUser;
    if (!session || !appUser) return { synced: false as const, reason: 'missing_session' };

    const supabaseEmail = clean(session.user.email).toLowerCase();
    const appEmail = clean(appUser.email).toLowerCase();
    if (!supabaseEmail || !appEmail || supabaseEmail !== appEmail) {
      return { synced: false as const, reason: 'identity_mismatch' };
    }

    const response = await api.get('/api/me');
    const profile = (response.data || null) as HeartProfile | null;
    if (!profile?.name || !Number.isFinite(Number(profile.age)) || Number(profile.age) < 18) {
      return { synced: false as const, reason: 'profile_incomplete' };
    }

    const payload = {
      user_id: session.user.id,
      display_name: clean(profile.name).slice(0, 80),
      age: Math.max(18, Math.min(120, Number(profile.age))),
      city: clean(profile.city).slice(0, 120) || null,
      country: clean(profile.country).slice(0, 120) || null,
      gender: clean(profile.gender).slice(0, 80) || null,
      relationship_intention: clean(profile.relationshipGoal).slice(0, 120) || null,
      bio: clean(profile.bio).slice(0, 2000) || null,
      interests: csv(profile.interests),
      languages: csv(profile.languages),
      occupation: clean(profile.occupation).slice(0, 160) || null,
      education: clean(profile.education).slice(0, 160) || null,
      profile_completion: Math.max(0, Math.min(100, Number(profile.completion) || 0)),
      verification_level: verificationLevel(profile),
      last_active_at: new Date().toISOString(),
    };

    const fingerprint = JSON.stringify({ ...payload, last_active_at: '' });
    if (fingerprint === lastFingerprint) return { synced: false as const, reason: 'unchanged' };

    const { error: datingError } = await supabase.from('dating_profiles').upsert(payload, { onConflict: 'user_id' });
    if (datingError) throw datingError;

    const { error: accountError } = await supabase.from('account_profiles').update({
      first_name: payload.display_name,
      city: payload.city,
      country: payload.country,
      gender: payload.gender,
      relationship_intention: payload.relationship_intention,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }).eq('user_id', session.user.id);
    if (accountError) throw accountError;

    lastFingerprint = fingerprint;
    return { synced: true as const, userId: session.user.id };
  } finally {
    running = false;
  }
}

export async function requestSupabaseAccountLink() {
  const appUser = await auth.getUser().catch(() => null) as AppDeployUser;
  const email = clean(appUser?.email).toLowerCase();
  if (!email) throw new Error('Your current Heart Connect sign-in has no email address to link.');
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: window.location.origin,
    },
  });
}

export function startSupabaseBridge() {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const sync = async () => {
    if (stopped) return;
    try {
      await syncHeartConnectProfileToSupabase();
    } catch (error) {
      console.warn('Heart Connect Supabase sync skipped:', error);
    } finally {
      if (!stopped) timer = setTimeout(sync, 60_000);
    }
  };

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session) void sync();
  });
  window.addEventListener('focus', sync);
  void sync();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    data.subscription.unsubscribe();
    window.removeEventListener('focus', sync);
  };
}
