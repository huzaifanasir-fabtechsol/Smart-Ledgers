const PAGE_SIZE_OPTIONS = [10, 50, 100, 200];

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  pageLabel = 'Page',
  ofLabel = 'of',
  showLabel = 'Show:',
  className = 'pagination',
  style = {}
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  return (
    <div className={className} style={style}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
        disabled={safeCurrentPage <= 1}
      >
        {previousLabel}
      </button>

      <span>
        {pageLabel} {safeCurrentPage} {ofLabel} {safeTotalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
        disabled={safeCurrentPage >= safeTotalPages}
      >
        {nextLabel}
      </button>

      {onPageSizeChange && (
        <div className="pagination-size">
          <label>{showLabel}</label>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
