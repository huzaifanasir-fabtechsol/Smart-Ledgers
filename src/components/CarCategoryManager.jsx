import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { translateText } from '../translator';
import { apiRequest } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import './CarCategoryManager.css';

const CarCategoryManager = ({ language = 'en' }) => {
  const t = translations[language];
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [translatedCategories, setTranslatedCategories] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    const translateData = async () => {
      if (language === 'en') {
        setTranslatedCategories(categories);
        return;
      }
      const translated = await Promise.all(
        categories.map(async (cat) => ({ ...cat, name: await translateText(cat.name, language) }))
      );
      setTranslatedCategories(translated);
    };
    translateData();
  }, [language, categories]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    const handleCloseMenu = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        ...(searchText && { search: searchText })
      });
      
      const response = await apiRequest(`/revenue/categories/?${params}`);
      const data = await response.json();
      setCategories(data.results || data);
      if (data.count) {
        setTotalPages(Math.ceil(data.count / pageSize));
      }
    } catch (error) {
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/revenue/categories/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      toast.success('Category deleted successfully');
      setShowDeleteConfirm(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    try {
      if (editingCategory) {
        await apiRequest(`/revenue/categories/${editingCategory.id}/`, {
          method: 'PUT',
          body: JSON.stringify({ name: categoryName, description: categoryDescription, company: companyName  })
        });
        toast.success('Category updated successfully');
      } else {
        await apiRequest('/revenue/categories/', {
          method: 'POST',
          body: JSON.stringify({ name: categoryName, description: categoryDescription, company: companyName  })
        });
        toast.success('Category added successfully');
      }
      fetchCategories();
      setCategoryName('');
      setCategoryDescription('');
      setCompanyName('');
      setEditingCategory(null);
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setCompanyName(category.company || '');
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCompanyName('');
    setShowModal(true);
  };

  const handleMenuClick = (e, categoryId) => {
    e.stopPropagation();
    if (openMenuId === categoryId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(categoryId);
  };

  return (
    <div className="car-category-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>{t.carCategories}</h2>
        <button className="btn-primary" onClick={handleAdd}>{t.addCarCategory}</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input 
            type="text" 
            placeholder={t.searchCarCategory}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{width: '80px'}}>{t.id}</th>
                <th>Company</th>
                <th>Model</th>
                <th>{t.description}</th>
                <th style={{width: '60px'}}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading car categories...</span>
                    </div>
                  </td>
                </tr>
              ) : translatedCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No categories found
                  </td>
                </tr>
              ) : (
                translatedCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{category.company}</td>
                    <td>{category.model}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button className={`btn-menu ${openMenuId === category.id ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, category.id)}>⋮</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{t.previous}</button>
          <span>{t.page} {currentPage} {t.of} {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t.next}</button>
        </div>
      </div>

      {openMenuId && (
        <div ref={menuRef} className="context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {(() => {
            const cat = translatedCategories.find(c => c.id === openMenuId);
            return cat ? (
              <>
                <button onClick={() => handleEdit(cat)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(cat); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Car Category"
        message={`Are you sure you want to delete "${showDeleteConfirm?.company} - ${showDeleteConfirm?.name}"? This action cannot be undone.`}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? t.editCarCategory : t.addNewCarCategory}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  placeholder='Add Company'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.categoryName}</label>
                <input 
                  type="text" 
                  placeholder={t.carCategoryPlaceholder}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.description}</label>
                <textarea 
                  placeholder="Category description"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  rows="3"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={loading}>{t.cancel}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingCategory ? t.edit : t.addCarCategory)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarCategoryManager;
