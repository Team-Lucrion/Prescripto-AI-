import { createClerkSupabaseClient } from '../lib/supabase';
import { UserCredits } from '../types';

export const getCredits = async (userId: string, token: string | null, email?: string): Promise<UserCredits | null> => {
  try {
    const supabase = createClerkSupabaseClient(token);
    const ADMIN_EMAILS = ['rajathmpatil@gmail.com', 'rahulam19aug@gmail.com', 'bb.build.better@gmail.com'];
    const isAdmin = email ? ADMIN_EMAILS.includes(email) : false;
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No credits record found, create one
      const { data: newData, error: createError } = await supabase
        .from('user_credits')
        .insert({ 
          user_id: userId, 
          credits: 5, 
          role: isAdmin ? 'admin' : 'user', 
          is_pro: false 
        }) // Give 5 free credits to start
        .select()
        .single();
      
      if (createError) throw createError;
      return newData;
    }
    
    // If record exists but role needs update (e.g. user was added to admin list later)
    if (data && isAdmin && data.role !== 'admin') {
      const { data: updatedData, error: updateError } = await supabase
        .from('user_credits')
        .update({ role: 'admin' })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (!updateError) return updatedData;
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching credits:', err);
    return null;
  }
};

export const deductCredits = async (userId: string, amount: number, token: string | null): Promise<number | null> => {
  try {
    const supabase = createClerkSupabaseClient(token);
    
    // First check if user is admin
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('role, credits')
      .eq('user_id', userId)
      .single();
    
    if (userCredits?.role === 'admin') return userCredits.credits;
    if ((userCredits?.credits || 0) < amount) return null;

    const newCredits = (userCredits?.credits || 0) - amount;

    const { error } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', userId);
    
    if (error) throw error;
    return newCredits;
  } catch (err) {
    console.error('Error deducting credits:', err);
    return null;
  }
};
