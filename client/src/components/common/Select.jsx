const Select = ({ label, options = [], error, className = '', ...props }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}
        </label>
      )}

      <select
        className={`form-select ${error ? 'error' : ''}`}
        {...props}
      >
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="form-error">{error}</span>
      )}
    </div>
  );
};

export default Select;
