import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';

export const AccountsView: React.FC = () => {
  const {
    accountsList,
    createUserAccount,
    deleteUserAccount,
    globalSearch,
    isMasterAdmin,
  } = useApp();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Visibility toggle per account row password
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Deletion state
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const togglePasswordVisibility = (username: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const handleCopyCredentials = (username: string, pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${pass}`);
    setCopiedAccount(username);
    setTimeout(() => {
      setCopiedAccount(null);
    }, 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = createUserAccount(newUsername, newPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create account.');
      return;
    }

    setSuccessToast(`Account "${newUsername.trim().toLowerCase()}" created successfully!`);
    setNewUsername('');
    setNewPassword('');
    setIsCreateOpen(false);

    setTimeout(() => {
      setSuccessToast('');
    }, 4000);
  };

  const handleDeleteConfirm = () => {
    if (!accountToDelete) return;
    const res = deleteUserAccount(accountToDelete);
    if (res.success) {
      setSuccessToast(`Account "${accountToDelete}" has been deleted.`);
      setTimeout(() => {
        setSuccessToast('');
      }, 4000);
    }
    setAccountToDelete(null);
  };

  const filteredAccounts = accountsList.filter((acc) => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return acc.username.toLowerCase().includes(q) || acc.role.toLowerCase().includes(q);
  });

  const masterAdminCount = accountsList.filter((a) => a.role === 'admin').length;
  const standardUsersCount = accountsList.filter((a) => a.role === 'user').length;

  return (
    <div id="view-accounts" className="space-y-6 animate-in fade-in">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Accounts
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Master Admin Access Only
            </span>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Create user accounts for system log in and manage access. New accounts operate with isolated portfolios.
          </p>
        </div>

        {isMasterAdmin && (
          <button
            id="btn-create-account-open"
            onClick={() => {
              setIsCreateOpen(true);
              setErrorMsg('');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Total Accounts
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {accountsList.length}
            </span>
          </div>
        </div>

        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Master Admin
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {masterAdminCount}
            </span>
            <span className="text-[11px] text-purple-500 font-medium block">bosxzjm (Full Privileges)</span>
          </div>
        </div>

        <div className="card-bg p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Standard User Accounts
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {standardUsersCount}
            </span>
            <span className="text-[11px] text-emerald-500 font-medium block">Fresh & isolated workspace</span>
          </div>
        </div>
      </div>

      {/* Create Account Modal / Drawer */}
      {isCreateOpen && (
        <div
          id="modal-create-account-backdrop"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false);
          }}
        >
          <div
            id="modal-create-account-card"
            className="card-bg w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm">
                    Create New Account
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add a log in account with standard User access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Username
                </label>
                <input
                  type="text"
                  id="create-account-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. collector_john or staff1"
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Min 3 characters, lowercase letters, numbers, hyphens, and underscores.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="create-account-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password (min 4 characters)"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Assigned Role
                </label>
                <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-xs">User</p>
                      <p className="text-[10px] text-slate-400">
                        Independent portfolio, Accounts menu hidden
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Standard User
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/15 text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                When this user logs in, they will have their own independent, fresh system. The Accounts menu is automatically hidden from their view.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-create-account-submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts List Table */}
      <div className="card-bg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              System Accounts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              List of all accounts authorized to sign in to the application
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing {filteredAccounts.length} of {accountsList.length} accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 sm:px-6">User Account</th>
                <th className="py-3 px-4">Role / Permissions</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-normal">
              {filteredAccounts.map((account) => {
                const isMaster = account.username === 'bosxzjm';
                const isPwVisible = visiblePasswords[account.username];
                const isCopied = copiedAccount === account.username;

                return (
                  <tr
                    key={account.username}
                    id={`account-row-${account.username}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User Account */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-xs ${
                            isMaster
                              ? 'bg-purple-600 text-white shadow-purple-500/20'
                              : 'bg-indigo-600 text-white shadow-indigo-500/20'
                          }`}
                        >
                          {account.username.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                            {account.username}
                            {isMaster && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold uppercase">
                                Master
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isMaster ? 'Primary System Owner' : `User ID: ${account.username}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {isMaster ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Master Admin</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>User</span>
                        </div>
                      )}
                    </td>

                    {/* Password */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {isMaster
                            ? '••••••••'
                            : isPwVisible
                            ? account.password || '••••'
                            : '••••••••'}
                        </span>
                        {!isMaster && account.password && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(account.username)}
                              title={isPwVisible ? 'Hide password' : 'Show password'}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              {isPwVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(account.username, account.password)}
                              title="Copy username & password"
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      {isMaster ? (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Permanent Master
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={`btn-delete-account-${account.username}`}
                          onClick={() => setAccountToDelete(account.username)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all font-semibold text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No accounts found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(accountToDelete)}
        title="Delete User Account"
        subtitle="Confirm account removal"
        message={
          <div>
            Are you sure you want to delete the user account{' '}
            <strong className="text-slate-900 dark:text-white font-mono">
              "{accountToDelete}"
            </strong>
            ?
            <p className="mt-2 text-rose-500 font-medium text-[11px]">
              Warning: All data and isolated portfolios associated with this user will be permanently deleted and cannot be recovered.
            </p>
          </div>
        }
        confirmLabel="Delete Account"
        onConfirm={handleDeleteConfirm}
        onClose={() => setAccountToDelete(null)}
      />
    </div>
  );
};
