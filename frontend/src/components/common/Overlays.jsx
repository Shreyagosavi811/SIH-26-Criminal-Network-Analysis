import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext.jsx';
import { EvidenceDetailModal } from '../evidence/EvidenceDetailModal.jsx';
import { Drawer } from './Drawer.jsx';
import FIRFormModal from '../fir/FIRFormModal.jsx';
import EvidenceFormModal from '../evidence/EvidenceFormModal.jsx';
import { 
  X, 
  ShieldAlert, 
  UserPlus, 
  Edit3, 
  FilePlus, 
  Plus, 
  CheckCircle, 
  Trash2, 
  Save, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

export { Drawer };

/* 1. TOAST NOTIFICATIONS CONTAINER */
export function ToastContainer() {
  const { toasts, removeToast } = useInvestigation();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className="pointer-events-auto w-full max-w-sm px-3.5 py-2.5 rounded-xl bg-slate-900/95 text-white border border-slate-700/80 font-sans text-xs shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md transition-all animate-slide-up"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            {toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="font-medium text-slate-100 truncate">{toast.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => removeToast && removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* 2. MODAL DIALOG CONTAINER */
export function Modal() {
  const { 
    activeModal, 
    modalData, 
    closeModal, 
    showToast, 
    editCanvasObject,
    addCustomCanvasObject,
    removeCanvasObject,
    editCanvasConnection,
    removeCanvasConnection
  } = useInvestigation();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRoleState] = useState('Investigator');
  const [userDept, setUserDept] = useState('District Intelligence Cell');

  const [editLabel, setEditLabel] = useState(modalData?.label || '');
  const [editColor, setEditColor] = useState(modalData?.color || '#ef4444');

  useEffect(() => {
    if (modalData) {
      setEditLabel(modalData.label || '');
      setEditColor(modalData.color || '#ef4444');
    }
  }, [modalData, activeModal]);

  if (!activeModal) return null;

  // Custom Full Forensic Inspector Modal
  if (activeModal === 'evidence-inspector') {
    return <EvidenceDetailModal evidence={modalData} closeModal={closeModal} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white border border-slate-200/90 rounded-3xl shadow-2xl ${(activeModal === 'register-fir' || activeModal === 'edit-fir' || activeModal === 'log-evidence' || activeModal === 'edit-evidence') ? 'max-w-3xl' : 'max-w-lg'} w-full overflow-hidden font-sans text-xs animate-scale-up max-h-[90vh] flex flex-col`}>
        {/* FIR Register / Edit Modal */}
        {(activeModal === 'register-fir' || activeModal === 'edit-fir') && (
          <FIRFormModal 
            isEdit={activeModal === 'edit-fir'} 
            modalData={modalData} 
            closeModal={closeModal} 
          />
        )}

        {/* Evidence Log / Edit Modal */}
        {(activeModal === 'log-evidence' || activeModal === 'edit-evidence') && (
          <EvidenceFormModal 
            isEdit={activeModal === 'edit-evidence'} 
            modalData={modalData} 
            closeModal={closeModal} 
          />
        )}

        {/* Add User Modal */}
        {activeModal === 'add-user' && (
          <div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Create Investigator Account</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                showToast(`Created official account for ${userName} (${userRole})`, 'success');
                closeModal();
              }}
              className="p-5 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Officer Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sub-Inspector R. Rao"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Govt Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. rao@police.gov.in"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Assigned Role</label>
                  <select 
                    value={userRole}
                    onChange={(e) => setUserRoleState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Investigator">Investigator</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
                  <select 
                    value={userDept}
                    onChange={(e) => setUserDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="District Intelligence Cell">District Intelligence</option>
                    <option value="Special Narcotics & Crime">Special Narcotics</option>
                    <option value="Cyber Crime Cell">Cyber Crime Cell</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Corkboard Object Modal */}
        {activeModal === 'edit-canvas-object' && (
          <div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Edit Corkboard Card</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (modalData?.id) {
                  editCanvasObject(modalData.id, editLabel, editColor, modalData.type);
                }
                closeModal();
              }}
              className="p-5 space-y-4 font-mono text-xs"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Card Content / Description</label>
                <textarea 
                  rows={4}
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Enter details, alias, or notes..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Card Border & Pin Color</label>
                <div className="flex items-center space-x-3">
                  {['#ef4444', '#2563eb', '#f59e0b', '#10b981', '#7c3aed', '#1e293b'].map(c => (
                    <button 
                      key={c} 
                      type="button" 
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full ring-2 transition-transform ${editColor === c ? 'ring-slate-900 scale-110 shadow-md' : 'ring-transparent opacity-80'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button 
                  type="button" 
                  onClick={() => {
                    if (modalData?.id) removeCanvasObject(modalData.id);
                    closeModal();
                  }}
                  className="px-3 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Card</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm flex items-center space-x-1">
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Add Custom Canvas Item Modal */}
        {activeModal === 'add-custom-canvas-object' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FilePlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Custom Item to Board</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const itemType = e.target.itemType.value;
                const itemTitle = e.target.itemTitle.value;
                const itemDesc = e.target.itemDesc.value;
                const combinedLabel = itemDesc ? `${itemTitle}\n${itemDesc}` : itemTitle;
                
                addCustomCanvasObject({
                  type: itemType,
                  label: combinedLabel,
                  color: editColor || (itemType === 'entity' ? '#ef4444' : itemType === 'evidence' ? '#f59e0b' : '#2563eb')
                });
                closeModal();
              }}
              className="p-5 space-y-4 font-mono text-xs"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Item Category</label>
                <select 
                  name="itemType" 
                  defaultValue={modalData?.defaultType || 'note'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="note">📝 Investigator Note / Lead</option>
                  <option value="entity">👤 Suspect / Person / Entity</option>
                  <option value="evidence">📦 Evidence / Seizure / Record</option>
                  <option value="vehicle">🚗 Surveillance Vehicle / Asset</option>
                  <option value="account">💳 Bank Account / Hawala Ledger</option>
                  <option value="location">📍 Crime Scene / Meeting Spot</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Header / ID Title</label>
                <input 
                  name="itemTitle" 
                  type="text" 
                  required
                  placeholder="e.g. Suspect Lead, CDR-00912, Hawala Route"
                  defaultValue={modalData?.defaultTitle || ''}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Content & Specifics</label>
                <textarea 
                  name="itemDesc" 
                  rows={3}
                  placeholder="Enter detailed observation, phone number, transfer amount..."
                  defaultValue={modalData?.defaultDesc || ''}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Card Pin Color</label>
                <div className="flex items-center space-x-3">
                  {['#ef4444', '#2563eb', '#f59e0b', '#10b981', '#7c3aed', '#1e293b'].map(c => (
                    <button 
                      key={c} 
                      type="button" 
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full ring-2 transition-transform ${(editColor || '#2563eb') === c ? 'ring-slate-900 scale-110 shadow-md' : 'ring-transparent opacity-80'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pin Card to Corkboard</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Red Yarn Connection Modal */}
        {activeModal === 'edit-canvas-connection' && (
          <div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Edit Red Yarn Connection String</h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const connLabel = e.target.connLabel.value;
                const connStyle = e.target.connStyle.value;
                if (modalData?.id) {
                  editCanvasConnection(modalData.id, connLabel, editColor || modalData.color || '#dc2626', connStyle);
                }
                closeModal();
              }}
              className="p-5 space-y-4 font-mono text-xs"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Connection Link Description</label>
                <input 
                  name="connLabel" 
                  type="text" 
                  required
                  defaultValue={modalData?.label || 'Linked Evidence'}
                  placeholder="e.g. CDR Call Burst (42 calls), Hawala Transfer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Thread Style</label>
                  <select 
                    name="connStyle"
                    defaultValue={modalData?.style || 'solid'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="solid">🔴 Solid Red Yarn Line</option>
                    <option value="dashed">🟠 Dashed Lead Line</option>
                    <option value="dotted">🔵 Dotted Surveillance Link</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Yarn Thread Color</label>
                  <div className="flex items-center space-x-2 pt-1.5">
                    {['#dc2626', '#d97706', '#2563eb', '#059669', '#475569'].map(c => (
                      <button 
                        key={c} 
                        type="button" 
                        onClick={() => setEditColor(c)}
                        className={`w-6 h-6 rounded-full ring-2 transition-transform ${(editColor || modalData?.color || '#dc2626') === c ? 'ring-slate-900 scale-110 shadow-md' : 'ring-transparent opacity-80'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button 
                  type="button" 
                  onClick={() => {
                    if (modalData?.id) removeCanvasConnection(modalData.id);
                    closeModal();
                  }}
                  className="px-3 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Erase Yarn String</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">
                    Save Link
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Audit Warning Modal */}
        {activeModal === 'audit-warning' && (
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{modalData?.title || 'Security Notice'}</h3>
              <p className="text-slate-600 text-xs mt-1 leading-relaxed">{modalData?.message || 'Accessing this item requires security authorization and will generate an audit log.'}</p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (modalData?.onConfirm) modalData.onConfirm();
                  closeModal();
                }} 
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Acknowledge & Proceed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* 3. COMBINED ROOT OVERLAYS EXPORT */
export function Overlays() {
  return (
    <>
      <Drawer />
      <Modal />
      <ToastContainer />
    </>
  );
}

export default Overlays;
