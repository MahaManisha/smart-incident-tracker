import { useState, useEffect } from 'react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { getIncidentComments, addComment } from '../../api/incidentApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime, formatUserName } from '../../utils/formatters';
import { validateCommentForm } from '../../utils/validators';
import { toast } from 'react-toastify';
import './CommentSection.css';

const CommentSection = ({ incidentId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchComments();
  }, [incidentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getIncidentComments(incidentId);
      setComments(data.comments || []);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateCommentForm({
      content: commentText,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      await addComment(incidentId, {
        content: commentText,
        isInternal,
      });
      toast.success('Comment added successfully');
      setCommentText('');
      setIsInternal(false);
      setErrors({});
      fetchComments();
      onCommentAdded?.();
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section card">
      <div className="card-header">
        <h3 className="card-title">Comments ({comments.length})</h3>
      </div>

      <div className="card-body">
        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="form-group">
            <textarea
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (errors.content) setErrors({});
              }}
              disabled={submitting}
              rows="3"
            />
            {errors.content && (
              <span className="form-error">{errors.content}</span>
            )}
          </div>

          <div className="comment-form-footer">
            <div className="form-check">
              <input
                type="checkbox"
                id="isInternal"
                className="form-check-input"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={submitting}
              />
              <label htmlFor="isInternal" className="form-check-label">
                Internal comment (visible to responders only)
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={submitting || !commentText.trim()}
            >
              Add Comment
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {loading ? (
          <LoadingSpinner text="Loading comments..." />
        ) : comments.length === 0 ? (
          <div className="empty-state-small">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author">
                    <div className="author-avatar">
                      {comment.userId?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="author-info">
                      <span className="author-name">
                        {formatUserName(comment.userId)}
                      </span>
                      <span className="comment-time">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  {comment.isInternal && (
                    <span className="badge badge-warning">Internal</span>
                  )}
                </div>
                <div className="comment-content">
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;