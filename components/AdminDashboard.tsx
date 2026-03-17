import React, { useState, useEffect, useCallback } from 'react';
import { Users, CreditCard, TrendingUp, Search, Edit2, Save, X } from 'lucide-react';
import { createClerkSupabaseClient } from '../lib/supabase';
import { useAuth } from '@clerk/clerk-react';

interface AdminStats {
  totalUsers: number;
  totalCredits: number;
  totalRevenue: number;
}

interface AdminUser {
  user_id: string;
  credits: number;
  role: string;
  is_pro: boolean;
  email?: string;
  name?: string;
}

export const AdminDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalCredits: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const supabase = createClerkSupabaseClient(token);

      // Fetch user credits
      const { data: userData, error: userError } = await supabase
        .from('user_credits')
        .select('*');
      
      if (userError) throw userError;

      // Fetch payments for revenue
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('amount');
      
      if (paymentError) throw paymentError;

      const totalRevenue = paymentData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
      const totalCredits = userData?.reduce((acc, curr) => acc + curr.credits, 0) || 0;

      setUsers(userData || []);
      setStats({
        totalUsers: userData?.length || 0,
        totalCredits,
        totalRevenue
      });
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const token = await getToken();
      const supabase = createClerkSupabaseClient(token);

      const { error } = await supabase
        .from('user_credits')
        .update({
          credits: editingUser.credits,
          role: editingUser.role
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;
      setEditingUser(null);
      fetchAdminData();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-[#0f2a43]">Admin Portal</h1>
            <p className="text-slate-500">Manage users, credits, and system health</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
          >
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Circulating Credits', value: stats.totalCredits, icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className={stat.bg + " w-12 h-12 rounded-2xl flex items-center justify-center mb-4"}>
                <stat.icon className={stat.color + " w-6 h-6"} />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-[#0f2a43]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* User Management */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#0f2a43]">User Management</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00a3e0] transition-all w-full md:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-6 font-bold text-[#0f2a43] text-sm">User ID</th>
                  <th className="p-6 font-bold text-[#0f2a43] text-sm">Role</th>
                  <th className="p-6 font-bold text-[#0f2a43] text-sm">Credits</th>
                  <th className="p-6 font-bold text-[#0f2a43] text-sm">Pro Status</th>
                  <th className="p-6 font-bold text-[#0f2a43] text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-400">Loading users...</td>
                  </tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 font-mono text-xs text-slate-500">{user.user_id}</td>
                    <td className="p-6">
                      {editingUser?.user_id === user.user_id ? (
                        <select 
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="p-1 border rounded"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={user.role === 'admin' ? "text-purple-600 font-bold" : "text-slate-600"}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      {editingUser?.user_id === user.user_id ? (
                        <input 
                          type="number" 
                          value={editingUser.credits}
                          onChange={(e) => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) })}
                          className="w-20 p-1 border rounded"
                        />
                      ) : (
                        <span className="font-bold text-[#0f2a43]">{user.credits}</span>
                      )}
                    </td>
                    <td className="p-6">
                      {user.is_pro ? (
                        <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Pro</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-6">
                      {editingUser?.user_id === user.user_id ? (
                        <div className="flex space-x-2">
                          <button onClick={handleUpdateUser} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingUser(null)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-slate-400 hover:text-[#00a3e0] hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
