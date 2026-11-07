import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Upload, Download, Trash2, FileText, Files } from "lucide-react";
import { apiRequest, getErrorMessage, downloadFile } from "../api";
import DeleteConfirmModal from "./DeleteConfirmModal";
import Pagination from "./Pagination";
import "../shared.css";

const ACCEPT = ".docx,.doc,.pdf,.odt,.rtf,.png,.jpg,.jpeg";
const MAX_SIZE = 20 * 1024 * 1024;

const formatBytes = (bytes) => {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

// Finished documents (e.g. a filled-in exported letterhead) uploaded for the record.
const LetterheadRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        `/account/letterhead-records/?page=${currentPage}&page_size=${pageSize}&pageSize=${pageSize}`
      );
      // A delete can leave the last page empty; step back to the new last page
      if (response.status === 404 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : data.results || []);
      setTotalCount(Array.isArray(data) ? data.length : data.count || 0);
    } catch (error) {
      toast.error(error.message || "Failed to load document records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, pageSize]);

  const handleFileChange = (e) => {
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_SIZE) {
      toast.error("File is too large (maximum 20 MB).");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose a file to upload.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please add a description.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("description", description.trim());
      const response = await apiRequest("/account/letterhead-records/", { method: "POST", body });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const record = await response.json();
      // Newest records come first, so show page 1
      if (currentPage === 1) fetchRecords();
      else setCurrentPage(1);
      setFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(
        record.is_compressed
          ? `Uploaded and compressed (${formatBytes(record.size)} → ${formatBytes(record.stored_size)})`
          : "Uploaded (already compact, stored as is)"
      );
    } catch (error) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (record) => {
    setDownloadingId(record.id);
    try {
      await downloadFile(`/account/letterhead-records/${record.id}/download/`, record.original_name);
    } catch {
      toast.error("Failed to download document");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    const record = pendingDelete;
    setPendingDelete(null);
    if (!record) return;
    try {
      const response = await apiRequest(`/account/letterhead-records/${record.id}/`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) throw new Error(await getErrorMessage(response));
      toast.success("Document record deleted");
      fetchRecords();
    } catch (error) {
      toast.error(error.message || "Failed to delete document record");
    }
  };

  return (
    <div className="settings-card" style={{ marginTop: "2rem" }}>
      <div className="settings-card-header">
        <div className="settings-card-title-group">
          <div className="settings-icon-box purple">
            <Files size={22} />
          </div>
          <div>
            <h3 className="settings-card-heading">Document Records Archive</h3>
            <p className="settings-card-sub">
              Upload completed contracts, quotations, and official notices to maintain a secure audit history
            </p>
          </div>
        </div>
        <span className="settings-badge purple">Document Vault</span>
      </div>

      <form onSubmit={handleUpload} style={{ display: "grid", gap: "0.85rem", maxWidth: 640 }}>
        <div className="settings-form-group">
          <label className="settings-label">Document File (Word, PDF or image, max 20 MB)</label>
          <input ref={fileInputRef} type="file" accept={ACCEPT} className="settings-input no-icon" onChange={handleFileChange} />
        </div>
        <div className="settings-form-group">
          <label className="settings-label">Description / Note</label>
          <textarea
            className="settings-textarea"
            rows={2}
            placeholder="e.g. Quotation sent to ABC Trading, 25 Oct 2026"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <button type="submit" className="settings-btn-primary" disabled={uploading}>
            <Upload size={16} /> {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>

      <div className="table-container" style={{ marginTop: "1.25rem" }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>Sr</th>
              <th style={{ width: 160 }}>Uploaded</th>
              <th>Document</th>
              <th>Description</th>
              <th style={{ width: 170 }}>Size</th>
              <th style={{ width: 190 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">
                  <div className="table-loader-container">
                    <div className="spinner"></div>
                    <span>Loading document records...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>No documents uploaded yet</td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={record.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}</td>
                  <td>{new Date(record.created_at).toLocaleString()}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
                      <FileText size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                      <span style={{ overflowWrap: "anywhere" }}>{record.original_name}</span>
                    </span>
                  </td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{record.description}</td>
                  <td>
                    <div>{formatBytes(record.size)}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {record.is_compressed
                        ? `Stored ${formatBytes(record.stored_size)} (−${Math.round((1 - record.stored_size / record.size) * 100)}%)`
                        : "Stored as is"}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => handleDownload(record)}
                        disabled={downloadingId === record.id}
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        <Download size={14} /> {downloadingId === record.id ? "..." : "Download"}
                      </button>
                      <button
                        type="button"
                        className="settings-btn-danger"
                        onClick={() => setPendingDelete(record)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize) || 1}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete Document Record"
        message={`Delete "${pendingDelete?.original_name}" and its stored file? This action cannot be undone.`}
      />
    </div>
  );
};

export default LetterheadRecords;
