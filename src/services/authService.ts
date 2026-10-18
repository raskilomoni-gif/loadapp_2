import { supabase } from './supabaseClient';
import { UserProfile, UserRole } from '../types/auth';

interface ProfileRow {
  user_id: string;
  role: UserRole;
  display_name: string;
  company_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string;
  id_number: string | null;
  id_photo_url: string | null;
  max_listings: number;
  home_lat: number | null;
  home_lng: number | null;
  home_address: string | null;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    role: row.role,
    displayName: row.display_name,
    companyName: row.company_name ?? undefined,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email,
    idNumber: row.id_number ?? undefined,
    idPhotoUrl: row.id_photo_url ?? undefined,
    maxListings: row.max_listings,
    homeLat: row.home_lat ?? undefined,
    homeLng: row.home_lng ?? undefined,
    homeAddress: row.home_address ?? undefined,
  };
}

export async function uploadIdPhoto(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/id-photo.${ext}`;
  const { error } = await supabase.storage
    .from('id-documents')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return null;
  const { data } = supabase.storage.from('id-documents').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadLicenseScan(userId: string, tripId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/license-${tripId}.${ext}`;
  const { error } = await supabase.storage
    .from('id-documents')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return null;
  const { data } = supabase.storage.from('id-documents').getPublicUrl(path);
  return data.publicUrl;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  displayName: string,
  maxListings: number,
  phone?: string,
  whatsapp?: string,
  idNumber?: string,
  idPhotoUrl?: string,
  existingUserId?: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  let userId = existingUserId;

  if (!userId) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Sign-up failed — no user returned.' };
    userId = data.user.id;
  }

  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      role,
      display_name: displayName,
      email,
      max_listings: maxListings,
      phone: phone ?? null,
      whatsapp: whatsapp ?? null,
      id_number: idNumber ?? null,
      id_photo_url: idPhotoUrl ?? null,
    })
    .select('*')
    .maybeSingle();

  if (profileErr) return { user: null, error: profileErr.message };
  if (!profileData) return { user: null, error: 'Could not create profile.' };
  return { user: mapProfile(profileData as ProfileRow), error: null };
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Sign-in failed — no user returned.' };

  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (profileErr) return { user: null, error: profileErr.message };
  if (!profileData) return { user: null, error: 'Profile not found. Please complete registration.' };
  return { user: mapProfile(profileData as ProfileRow), error: null };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.displayName !== undefined) row.display_name = updates.displayName;
  if (updates.companyName !== undefined) row.company_name = updates.companyName;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.whatsapp !== undefined) row.whatsapp = updates.whatsapp;
  if (updates.idNumber !== undefined) row.id_number = updates.idNumber;
  if (updates.idPhotoUrl !== undefined) row.id_photo_url = updates.idPhotoUrl;
  if (updates.maxListings !== undefined) row.max_listings = updates.maxListings;
  if (updates.homeLat !== undefined) row.home_lat = updates.homeLat;
  if (updates.homeLng !== undefined) row.home_lng = updates.homeLng;
  if (updates.homeAddress !== undefined) row.home_address = updates.homeAddress;

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data as ProfileRow);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
