import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Briefcase, Users, IdCard, Layers, CreditCard, Plus, Edit, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';

const TABLES = [
  { key: 'applications', label: 'Applications', icon: <Briefcase className="w-4 h-4 mr-2" /> },
  { key: 'jobs', label: 'Jobs', icon: <Layers className="w-4 h-4 mr-2" /> },
  { key: 'profiles', label: 'Profiles', icon: <IdCard className="w-4 h-4 mr-2" /> },
  { key: 'subscription_plans', label: 'Subscription Plans', icon: <CreditCard className="w-4 h-4 mr-2" /> },
  { key: 'user_subscriptions', label: 'User Subscriptions', icon: <Users className="w-4 h-4 mr-2" /> },
];

const EXCLUDED_FIELDS = ['id', 'created_at', 'updated_at'];

const SkeletonTable = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-full" />
    <div className="h-4 bg-gray-200 rounded w-5/6" />
    <div className="h-4 bg-gray-200 rounded w-2/3" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-lg w-full relative border border-gray-200">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><X /></button>
        {children}
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">&times;</button>
    </div>
  );
}

const SuperAdminDashboard = () => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(TABLES[0].key);
  const [modal, setModal] = useState<{mode: 'add'|'edit', table: string, row?: any}|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{table: string, row: any}|null>(null);
  const [form, setForm] = useState<any>({});
  const [formError, setFormError] = useState<string|null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'}|null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const results: any = {};
      for (const table of TABLES) {
        const { data, error } = await supabase.from(table.key).select('*').limit(100);
        if (error) throw error;
        results[table.key] = data;
      }
      setData(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('superadmin');
    window.location.href = '/superadmin-login';
  };

  // CRUD Handlers
  const openAddModal = (table: string) => {
    setForm({});
    setFormError(null);
    setModal({ mode: 'add', table });
  };
  const openEditModal = (table: string, row: any) => {
    setForm(row);
    setFormError(null);
    setModal({ mode: 'edit', table, row });
  };
  const handleFormChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleFormSubmit = async () => {
    setFormLoading(true);
    setFormError(null);
    const table = modal.table;
    try {
      if (modal.mode === 'add') {
        const insertData = Object.fromEntries(Object.entries(form).filter(([k]) => !EXCLUDED_FIELDS.includes(k)));
        const { error } = await supabase.from(table).insert([insertData]);
        if (error) throw error;
        setToast({ message: 'Record added successfully!', type: 'success' });
      } else if (modal.mode === 'edit') {
        const updateData = Object.fromEntries(Object.entries(form).filter(([k]) => !EXCLUDED_FIELDS.includes(k)));
        const { error } = await supabase.from(table).update(updateData).eq('id', modal.row.id);
        if (error) throw error;
        setToast({ message: 'Record updated successfully!', type: 'success' });
      }
      setModal(null);
      fetchAll();
    } catch (err: any) {
      setFormError(err.message);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setFormLoading(true);
    try {
      if (!deleteConfirm.row.id) {
        setFormError('Cannot delete: No id found for this record.');
        setToast({ message: 'Cannot delete: No id found for this record.', type: 'error' });
        setFormLoading(false);
        return;
      }
      const { error } = await supabase.from(deleteConfirm.table).delete().eq('id', deleteConfirm.row.id);
      if (error) throw error;
      setDeleteConfirm(null);
      setToast({ message: 'Record deleted successfully!', type: 'success' });
      fetchAll();
    } catch (err: any) {
      setFormError(err.message);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
        <Sidebar className="h-screen sticky top-0 bg-white border-r shadow-lg w-64">
          <SidebarContent>
            <SidebarGroup>
              <div className="flex items-center space-x-3 p-6 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow">
                  <span className="text-white font-bold text-lg">SA</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Super Admin</h2>
                  <p className="text-xs text-muted-foreground">Full Access</p>
                </div>
              </div>
              <SidebarGroupContent className="p-4">
                <SidebarMenu>
                  {TABLES.map((table) => (
                    <SidebarMenuItem key={table.key}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(table.key)}
                        className={`w-full flex items-center justify-start rounded-lg mb-1 px-3 py-2 transition-colors duration-150 ${activeSection === table.key ? 'bg-blue-100 text-blue-900 font-semibold shadow' : 'hover:bg-gray-100'}`}
                      >
                        {table.icon}
                        <span>{table.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 p-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Super Admin Dashboard</h1>
            <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700 transition-colors font-semibold">Logout</button>
          </div>
          <p className="mb-8 text-lg text-gray-700">You have full access to all modules and data management features.</p>
          {loading ? (
            <div className="bg-white rounded-xl shadow p-8 mb-8">
              <SkeletonTable />
            </div>
          ) : error ? (
            <div className="text-red-500 mb-4">{error}</div>
          ) : (
            <div className="space-y-10">
              {TABLES.filter(t => t.key === activeSection).map(table => (
                <div key={table.key} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center">{table.icon}{table.label}</h2>
                    <button onClick={() => openAddModal(table.key)} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold"><Plus className="w-4 h-4" />Add</button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full table-auto border-collapse text-base">
                      <thead>
                        <tr>
                          {data[table.key] && data[table.key][0] && Object.keys(data[table.key][0]).map(col => (
                            <th key={col} className="border px-4 py-3 bg-gray-50 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">{col}</th>
                          ))}
                          <th className="border px-4 py-3 bg-gray-50 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data[table.key] && data[table.key].length > 0 ? (
                          data[table.key].map((row: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50'}>
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="border px-4 py-3 text-left align-top max-w-xs truncate" title={typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}>
                                  {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                </td>
                              ))}
                              <td className="border px-4 py-3 text-left align-top whitespace-nowrap">
                                <button onClick={() => openEditModal(table.key, row)} className="text-blue-600 hover:text-blue-900 mr-2"><Edit className="inline w-4 h-4" /></button>
                                <button onClick={() => setDeleteConfirm({table: table.key, row})} className="text-red-600 hover:text-red-900"><Trash2 className="inline w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td className="border px-4 py-3" colSpan={99}>No data</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal for Add/Edit */}
      <Modal open={!!modal} onClose={() => setModal(null)}>
        {modal && (
          <div>
            <h3 className="text-xl font-bold mb-4">{modal.mode === 'add' ? 'Add' : 'Edit'} {TABLES.find(t => t.key === modal.table)?.label}</h3>
            <form onSubmit={e => {e.preventDefault(); handleFormSubmit();}} className="space-y-4">
              {data[modal.table] && data[modal.table][0] && Object.keys(data[modal.table][0])
                .filter(field => !EXCLUDED_FIELDS.includes(field))
                .map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={form[field] ?? ''}
                      onChange={e => handleFormChange(field, e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                ))}
              {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold">{formLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        )}
      </Modal>
      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        {deleteConfirm && (
          <div className="text-center">
            <div className="flex flex-col items-center mb-4">
              <Trash2 className="w-10 h-10 text-red-500 mb-2" />
              <h3 className="text-2xl font-bold mb-2 text-red-700">Delete {TABLES.find(t => t.key === deleteConfirm.table)?.label}</h3>
            </div>
            <p className="mb-4 text-gray-700">Are you sure you want to delete this record? This action cannot be undone.</p>
            {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
            <div className="flex justify-center gap-4 mt-4">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={formLoading} className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold">{formLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        )}
      </Modal>
      {/* Toast for feedback */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SidebarProvider>
  );
};

export default SuperAdminDashboard; 