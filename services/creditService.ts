import { createClerkSupabaseClient } from '../lib/supabase';
import { UserCredits } from '../types';

export const getCredits = async (userId: string, getToken: () => Promise<string | null>): Promise<UserCredits | null> => {
  try {
    const token = await getToken();
    const supabase = createClerkSupabaseClient(token);
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No credits record found, create one
      const { data: newData, error: createError } = await supabase
        .from('user_credits')
        .insert({ user_id: userId, credits: 5, role: 'user', is_pro: false }) // Give 5 free credits to start
        .select()
        .single();
      
      if (createError) throw createError;
      return newData;
    }
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching credits:', err);
    return null;
  }
};

export const deductCredits = async (userId: string, amount: number, getToken: () => Promise<string | null>): Promise<boolean> => {
  try {
    const token = await getToken();
    const supabase = createClerkSupabaseClient(token);
    
    // First check if user is admin
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('role, credits')
      .eq('user_id', userId)
      .single();
    
    if (userCredits?.role === 'admin') return true;
    if ((userCredits?.credits || 0) < amount) return false;

    const { error } = await supabase
      .from('user_credits')
      .update({ credits: (userCredits?.credits || 0) - amount })
      .eq('user_id', userId);
    
    return !error;
  } catch (err) {
    console.error('Error deducting credits:', err);
    return false;
  }
};
