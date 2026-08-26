import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUsers, fetchMilestones } from "../redux/slice/dataSlice";
import { Users, Target, DollarSign, TrendingUp, Loader2 } from "lucide-react";

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, milestones, usersFetched, milestonesFetched, loading } = useSelector((state) => state.data);

  useEffect(() => {
    if (!usersFetched) dispatch(fetchUsers());
    if (!milestonesFetched) dispatch(fetchMilestones());
  }, [dispatch, usersFetched, milestonesFetched]);

  const stats = {
    totalUsers: users.length,
    totalMilestones: milestones.length,
    totalBetAmount: milestones.reduce((sum, m) => sum + m.betAmount, 0),
    totalPayout: milestones
      .filter((m) => m.status === "SUCCESS")
      .reduce((sum, m) => sum + m.potentialPayout, 0),
  };

  return (
      <main className="px-6 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/8">
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      Total Users
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-white">{stats.totalUsers}</div>
                </div>
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={14} />
                      Total Milestones
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-white">{stats.totalMilestones}</div>
                </div>
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-gold/80 mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} />
                      Total Bets
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-gold">Rs. {stats.totalBetAmount.toLocaleString()}</div>
                </div>
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-green-400/80 mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} />
                      Total Payout
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-green-400">Rs. {stats.totalPayout.toLocaleString()}</div>
                </div>
              </div>
            </section>

            <div className="bg-obsidian-900 border border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Email</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Role</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Last Login</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-white">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 text-white/30 bg-white/5">
                            User
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/40">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                        </td>
                        <td className="px-6 py-4 text-white/40">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-white/30">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
  );
};

export default UsersPage;
