import { API_BASE_URL } from './config';

export const SCREEN_LOCK_KEY = 'screen_locked';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(SCREEN_LOCK_KEY);
    window.location.reload();
  }

  return response;
};

export const getErrorMessage = async (response) => {
  try {
    const errorData = await response.json();
    if (errorData.error) return errorData.error;
    if (errorData.detail) return errorData.detail;
    if (errorData.message) return errorData.message;
    
    // Handle field-specific errors
    const fieldErrors = [];
    for (const [field, messages] of Object.entries(errorData)) {
      if (Array.isArray(messages)) {
        fieldErrors.push(`${field}: ${messages.join(', ')}`);
      } else if (typeof messages === 'string') {
        fieldErrors.push(`${field}: ${messages}`);
      }
    }
    
    if (fieldErrors.length > 0) return fieldErrors.join('; ');
    return 'An error occurred';
  } catch {
    return 'An error occurred';
  }
};

export const downloadFile = async (endpoint, defaultFilename) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadSalaryExcel = async (salaryId, employeeName = 'Employee', salaryMonth = '') => {
  const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Pay_Slip_${sanitizedName}_${salaryMonth || salaryId}.xlsx`;
  return downloadFile(`/hr/salaries/${salaryId}/export-excel/`, filename);
};

export const downloadSalaryPdf = async (salaryId, employeeName = 'Employee', salaryMonth = '') => {
  const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Pay_Slip_${sanitizedName}_${salaryMonth || salaryId}.pdf`;
  return downloadFile(`/hr/salaries/${salaryId}/export-pdf/`, filename);
};

// lang: 'en' | 'ja' (each language is a separate PDF); mode: 'full' (form layout) | 'simple' (condensed)
export const downloadFinancialStatementsPdf = async (
  fiscalYearId, termNo, { parts = ['kessan'], lang = 'en', mode = 'full' } = {},
) => {
  const filename = `Financial_Statements_Term${termNo}_${lang}_${mode}.pdf`;
  const query = `parts=${parts.join(',')}&lang=${lang}&mode=${mode}`;
  return downloadFile(`/reports/fiscal-years/${fiscalYearId}/pdf/?${query}`, filename);
};

export const downloadExpenseTaxExcel = async (params = '') => {
  const queryStr = params ? (params.startsWith('?') ? params : `?${params}`) : '';
  const filename = `Expense_Tax_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return downloadFile(`/expenses/export_tax_xlsx/${queryStr}`, filename);
};

export const downloadInvoiceTaxExcel = async (params = '') => {
  const queryStr = params ? (params.startsWith('?') ? params : `?${params}`) : '';
  const filename = `Invoice_Tax_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return downloadFile(`/revenue/orders/export_tax_xlsx/${queryStr}`, filename);
};

export const exportLetterheadDocxFromPayload = async (payload, companyName = 'Letterhead') => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/account/letterheads/export-docx/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to export letterhead as docx');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitized = (companyName || 'Letterhead').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'Letterhead';
  a.download = `${sanitized}_Letterhead.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const exportLetterheadDocxById = async (id, companyName = 'Letterhead') => {
  const sanitized = (companyName || 'Letterhead').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'Letterhead';
  const filename = `${sanitized}_Letterhead.docx`;
  return downloadFile(`/account/letterheads/${id}/export-docx/`, filename);
};


