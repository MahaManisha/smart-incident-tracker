const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}
        </label>
      )}

      <input
        className={`form-input ${error ? 'error' : ''}`}
        {...props}
      />

      {error && (
        <span className="form-error">{error}</span>
      )}
    </div>
  );
};

export default Input;
