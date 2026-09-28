"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Shield, ShieldOff, Ban, AlertTriangle } from "lucide-react";
import { updateUserRole, suspendUser, banUser } from "../actions";

export function UserManagementClient({ users }: { users: any[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      setProcessingId(userId);
      await updateUserRole(userId, newRole);
    } catch (e) {
      alert("Failed to update role");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    const reason = prompt("Enter suspension reason (sent to user):");
    if (!reason) return;
    const days = prompt("Enter suspension duration in days (e.g., 7):", "7");
    if (!days || isNaN(parseInt(days))) return;

    try {
      setProcessingId(userId);
      await suspendUser(userId, parseInt(days), reason);
    } catch (e) {
      alert("Failed to suspend user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBan = async (userId: string) => {
    const reason = prompt("Enter permanent ban reason (Internal):");
    if (!reason) return;
    if (!confirm("WARNING: This permanently bans the user and hides all their content. Proceed?")) return;

    try {
      setProcessingId(userId);
      await banUser(userId, reason);
    } catch (e) {
      alert("Failed to ban user");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-foreground/10">
            <th className="p-3 text-[10px] uppercase tracking-wider text-muted font-bold">Pen Name</th>
            <th className="p-3 text-[10px] uppercase tracking-wider text-muted font-bold">Role</th>
            <th className="p-3 text-[10px] uppercase tracking-wider text-muted font-bold">Status</th>
            <th className="p-3 text-[10px] uppercase tracking-wider text-muted font-bold">Submissions (App/Rej)</th>
            <th className="p-3 text-[10px] uppercase tracking-wider text-muted font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {users.map(user => {
            const isSuspended = user.suspended_until && new Date(user.suspended_until) > new Date();

            return (
              <tr key={user.id} className="border-b border-foreground/5 hover:bg-black/5 transition-colors">
                <td className="p-3">
                  <div className="font-bold">{user.pen_name}</div>
                  <div className="text-[10px] text-muted font-mono">{user.id.substring(0,8)}...</div>
                </td>
                <td className="p-3">
                  <span className={`text-[10px] uppercase px-2 py-1 rounded-[2px] font-bold ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' :
                    'bg-foreground/5 text-foreground/80'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3">
                  {user.status === 'BANNED' ? (
                    <span className="text-[10px] uppercase px-2 py-1 rounded-[2px] font-bold bg-red-900 text-white flex items-center gap-1 w-max">
                      <Ban className="w-3 h-3" /> Banned
                    </span>
                  ) : isSuspended ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase px-2 py-1 rounded-[2px] font-bold bg-orange-100 text-orange-800 flex items-center gap-1 w-max mb-1">
                        <AlertTriangle className="w-3 h-3" /> Suspended
                      </span>
                      <span className="text-[9px] text-muted">Until {format(new Date(user.suspended_until), "MMM d")}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase px-2 py-1 rounded-[2px] font-bold bg-green-100 text-green-800 w-max">
                      Active
                    </span>
                  )}
                </td>
                <td className="p-3 text-xs">
                  {user.totalSubmissions} ({user.approvedSubmissions} / {user.rejectedSubmissions})
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    {/* Role Toggles */}
                    {user.role === 'USER' && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'MODERATOR')}
                        disabled={processingId === user.id || user.status === 'BANNED'}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-[2px] disabled:opacity-50"
                        title="Promote to Moderator"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    {user.role === 'MODERATOR' && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'USER')}
                        disabled={processingId === user.id || user.status === 'BANNED'}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-[2px] disabled:opacity-50"
                        title="Demote to User"
                      >
                        <ShieldOff className="w-4 h-4" />
                      </button>
                    )}

                    {/* Disciplinary Actions */}
                    {user.role !== 'ADMIN' && user.status !== 'BANNED' && !isSuspended && (
                      <button
                        onClick={() => handleSuspend(user.id)}
                        disabled={processingId === user.id}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-[2px] disabled:opacity-50"
                        title="Suspend User"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}

                    {user.role !== 'ADMIN' && user.status !== 'BANNED' && (
                      <button
                        onClick={() => handleBan(user.id)}
                        disabled={processingId === user.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-[2px] disabled:opacity-50"
                        title="Ban User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
