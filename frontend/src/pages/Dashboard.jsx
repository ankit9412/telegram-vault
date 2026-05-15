import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  File, FileText, Music, Film, Image, Upload, Trash2,
  Download, Search, Edit2, X, Plus, AlertTriangle, Eye
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

const getFileCategory = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'text';
  return 'other';
};

const canPreview = (mimeType = '') => {
  const cat = getFileCategory(mimeType);
  return ['image', 'audio', 'video', 'pdf'].includes(cat);
};

const FileIcon = ({ mimeType, size = 24 }) => {
  const cat = getFileCategory(mimeType);
  if (cat === 'image') return <Image size={size} />;
  if (cat === 'audio') return <Music size={size} />;
  if (cat === 'video') return <Film size={size} />;
  return <File size={size} />;
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ── component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [telegramConnected, setTelegramConnected] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // upload modal
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // note editor
  const [editingItem, setEditingItem] = useState(null);

  // preview modal
  const [previewItem, setPreviewItem] = useState(null);   // vault item metadata
  const [previewUrl, setPreviewUrl] = useState(null);     // blob URL
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    fetchItems();
    checkTelegram();
  }, []);

  // revoke blob URL when preview closes
  useEffect(() => {
    if (!previewItem && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewItem]);

  const checkTelegram = async () => {
    try {
      const res = await api.get('/telegram/status');
      setTelegramConnected(res.data.connected);
    } catch {
      setTelegramConnected(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('/vault/items');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title) { setUploadError('Title is required'); return; }
    if (uploadType === 'file' && !file) { setUploadError('File is required'); return; }
    if (uploadType === 'note' && !noteContent) { setUploadError('Note content is required'); return; }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', uploadType);
    if (uploadType === 'file') formData.append('file', file);
    else formData.append('noteContent', noteContent);

    try {
      await api.post('/vault/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadModal(false);
      resetForm();
      fetchItems();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setFile(null); setNoteContent(''); setUploadError('');
  };

  // ── preview ─────────────────────────────────────────────────────────────────

  const handlePreview = async (item) => {
    setPreviewItem(item);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewUrl(null);
    try {
      const res = await api.get(`/vault/item/${item._id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setPreviewUrl(url);
    } catch (err) {
      setPreviewError('Failed to load preview');
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewItem(null);
    setPreviewError('');
  };

  // ── download ────────────────────────────────────────────────────────────────

  const handleDownload = async (item) => {
    try {
      const res = await api.get(`/vault/item/${item._id}`, { responseType: 'blob' });
      let filename = item.title;
      const disposition = res.headers['content-disposition'];
      if (disposition) {
        const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (match?.[1]) filename = match[1].replace(/['"]/g, '');
      }
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download item');
    }
  };

  // ── note editor ─────────────────────────────────────────────────────────────

  const handleViewNote = async (item) => {
    try {
      const res = await api.get(`/vault/item/${item._id}`);
      setEditingItem({ ...item, content: res.data.content });
    } catch (err) {
      console.error(err); alert('Failed to open note');
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await api.put(`/vault/item/${editingItem._id}`, {
        title: editingItem.title,
        noteContent: editingItem.content
      });
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error(err); alert('Failed to update note');
    } finally {
      setUploading(false);
    }
  };

  // ── delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/vault/item/${id}`);
      setItems(items.filter(item => item._id !== id));
    } catch (err) {
      console.error(err); alert('Failed to delete item');
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Vault</h1>
        <div className="dashboard-actions">
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setUploadModal(true)} className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={20} /> New Item
          </button>
        </div>
      </div>

      {/* Telegram warning */}
      {!telegramConnected && (
        <div className="alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            Telegram is not connected. Uploads will fail until you{' '}
            <Link to="/admin-setup" style={{ fontWeight: 600, textDecoration: 'underline' }}>
              set up the Telegram account
            </Link>.
          </span>
        </div>
      )}

      {/* Items grid */}
      {loading ? (
        <div className="spinner-container"><div className="loader loader-lg" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="hero-icon-wrap" style={{ marginBottom: '1rem' }}><Upload size={32} /></div>
          <h3 className="feature-title" style={{ textAlign: 'center' }}>Your vault is empty</h3>
          <p className="text-muted" style={{ maxWidth: '28rem', margin: '0 auto' }}>
            Upload files or create encrypted notes securely stored in your Telegram cloud.
          </p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map(item => (
            <div key={item._id} className="vault-item">
              <div className="vault-item-header">
                <div className="vault-item-icon">
                  {item.type === 'note'
                    ? <FileText size={24} />
                    : <FileIcon mimeType={item.mimeType} size={24} />
                  }
                </div>
                <div className="vault-item-actions">
                  {item.type === 'note' ? (
                    <button onClick={() => handleViewNote(item)} className="icon-btn" title="Edit note">
                      <Edit2 size={16} />
                    </button>
                  ) : (
                    <>
                      {canPreview(item.mimeType) && (
                        <button onClick={() => handlePreview(item)} className="icon-btn" title="Preview">
                          <Eye size={16} />
                        </button>
                      )}
                      <button onClick={() => handleDownload(item)} className="icon-btn" title="Download">
                        <Download size={16} />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(item._id)} className="icon-btn danger" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="vault-item-title" title={item.title}>{item.title}</h3>
              <div className="vault-item-meta">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <span>{formatSize(item.size)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload Modal ── */}
      {uploadModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Add to Vault</h3>
              <button onClick={() => { setUploadModal(false); resetForm(); }} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {uploadError && <div className="alert-error">{uploadError}</div>}
              <div className="tabs">
                <button onClick={() => setUploadType('file')} className={`tab ${uploadType === 'file' ? 'active' : ''}`}>
                  File Upload
                </button>
                <button onClick={() => setUploadType('note')} className={`tab ${uploadType === 'note' ? 'active' : ''}`}>
                  Secure Note
                </button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text" required className="form-input" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={uploadType === 'file' ? 'My Secret File' : 'My Private Note'}
                  />
                </div>
                {uploadType === 'file' ? (
                  <div className="form-group mb-6">
                    <label className="form-label">File</label>
                    <div className="file-dropzone" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={32} className="file-icon" />
                      <p style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {file ? file.name : 'Click to select a file'}
                      </p>
                      {file && <p className="text-xs text-muted">{formatSize(file.size)}</p>}
                    </div>
                    <input
                      type="file" style={{ display: 'none' }} ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setFile(e.target.files[0]);
                          if (!title) setTitle(e.target.files[0].name);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="form-group mb-6">
                    <label className="form-label">Note Content</label>
                    <textarea
                      required className="form-input textarea-min" value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your encrypted text here..."
                    />
                  </div>
                )}
                <button disabled={uploading} type="submit" className="btn btn-primary w-full">
                  {uploading && <span className="loader" style={{ marginRight: '0.5rem' }} />}
                  {uploading ? 'Encrypting & Uploading...' : 'Save to Vault'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewItem && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="modal modal-lg"
            style={{ maxWidth: '56rem', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                <Eye size={18} />
                {previewItem.title}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => handleDownload(previewItem)}
                  className="btn btn-outline"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                >
                  <Download size={14} /> Download
                </button>
                <button onClick={closePreview} className="modal-close"><X size={20} /></button>
              </div>
            </div>
            <div className="modal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '20rem', padding: '1rem' }}>
              {previewLoading && <div className="loader loader-lg" />}
              {previewError && <p style={{ color: 'var(--error)' }}>{previewError}</p>}
              {previewUrl && !previewLoading && (() => {
                const cat = getFileCategory(previewItem.mimeType);
                if (cat === 'image') return (
                  <img
                    src={previewUrl}
                    alt={previewItem.title}
                    style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '0.5rem', objectFit: 'contain' }}
                  />
                );
                if (cat === 'audio') return (
                  <div style={{ width: '100%', padding: '2rem 0', textAlign: 'center' }}>
                    <Music size={64} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                    <p style={{ marginBottom: '1rem', fontWeight: 500 }}>{previewItem.title}</p>
                    <audio controls src={previewUrl} style={{ width: '100%' }} />
                  </div>
                );
                if (cat === 'video') return (
                  <video
                    controls src={previewUrl}
                    style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '0.5rem' }}
                  />
                );
                if (cat === 'pdf') return (
                  <iframe
                    src={previewUrl}
                    title={previewItem.title}
                    style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0.5rem' }}
                  />
                );
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Note Modal ── */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal modal-lg" style={{ height: '80vh' }}>
            <div className="modal-header">
              <h3 className="modal-title"><FileText size={20} className="text-primary" /> Edit Note</h3>
              <button onClick={() => setEditingItem(null)} className="modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateNote} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text" required className="form-input" value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Content</label>
                  <textarea
                    required className="form-input textarea-full" value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingItem(null)} className="btn btn-outline">Cancel</button>
                <button disabled={uploading} type="submit" className="btn btn-primary">
                  {uploading && <span className="loader" style={{ marginRight: '0.5rem' }} />}
                  {uploading ? 'Saving...' : 'Update Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
