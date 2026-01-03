const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';

  return (
    <div className="spinner-container">
      <div className={`spinner ${sizeClass}`}></div>
      {text && <p className="text-secondary mt-md">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;