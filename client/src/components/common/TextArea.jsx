const TextArea = ({ label, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <textarea
        {...props}
        rows={4}
        className={`border rounded px-3 py-2 focus:outline-none focus:ring ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />

      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
};

export default TextArea;
