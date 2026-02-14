import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { translateText } from '../translator';
import { apiRequest } from '../api';
import './CarCategoryManager.css';

const CarCategoryManager = ({ language = 'en' }) => {
  const t = translations[language];
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [translatedCategories, setTranslatedCategories] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

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
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await apiRequest(`/revenue/categories/${categoryId}/`, { method: 'DELETE' });
      toast.success('Category deleted successfully');
      setOpenMenuId(null);
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
          body: JSON.stringify({ name: categoryName, description: categoryDescription })
        });
        toast.success('Category updated successfully');
      } else {
        await apiRequest('/revenue/categories/', {
          method: 'POST',
          body: JSON.stringify({ name: categoryName, description: categoryDescription })
        });
        toast.success('Category added successfully');
      }
      fetchCategories();
      setCategoryName('');
      setCategoryDescription('');
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
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setShowModal(true);
  };

  const handleMenuClick = (e, categoryId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 100;
    const top = rect.bottom + 5 + menuHeight > window.innerHeight ? rect.top - menuHeight - 5 : rect.bottom + 5;
    setMenuPos({ top, left: rect.right - 120 });
    setOpenMenuId(openMenuId === categoryId ? null : categoryId);
  };

  return (
    <div className="car-category-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="table-section">
        <div className="table-header">
          <h3>{t.carCategories}</h3>
          <button className="btn-primary" onClick={handleAdd}>{t.addCarCategory}</button>
        </div>
        
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
          {loading ? (
            <div className="loader">Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{width: '80px'}}>{t.id}</th>
                  <th>{t.categoryName}</th>
                  <th>{t.description}</th>
                  <th style={{width: '60px'}}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {translatedCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index+1}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button className="btn-menu" onClick={(e) => handleMenuClick(e, category.id)}>⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{t.previous}</button>
          <span>{t.page} {currentPage} {t.of} {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t.next}</button>
        </div>
      </div>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => handleEdit(translatedCategories.find(c => c.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? t.editCarCategory : t.addNewCarCategory}</h3>
            <form onSubmit={handleSubmit}>
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
