import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-description">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;