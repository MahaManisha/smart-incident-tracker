import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getTeamMessages, sendMessage as sendApiMessage } from '../api/chatApi';
import { getTeamById } from '../api/teamsApi';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/formatters';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaReply, FaImage, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '../utils/constants';
import './ChatPage.css';

// Extract base URL for socket connection by removing /api if present
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '') || '/';

const ChatPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Command Room specific state
    const [replyTo, setReplyTo] = useState(null);
    const [attachment, setAttachment] = useState(null);
    
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Request Desktop Notification Permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [teamData, msgs] = await Promise.all([
                    getTeamById(teamId),
                    getTeamMessages(teamId)
                ]);
                
                // API responses wrap in data depending on interceptor
                setTeam(teamData.team || teamData.data?.team || teamData);
                setMessages(msgs.data || msgs || []);
            } catch (error) {
                console.error('Failed to load chat data:', error);
                toast.error('Failed to load chat');
                navigate('/teams');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [teamId, navigate]);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('join_team', teamId);

        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);

            // Notify if the message is from someone else
            const senderId = message.sender?._id || message.sender;
            const currentUserId = user?.id || user?._id;

            if (senderId !== currentUserId) {
                const senderName = message.sender?.name || 'Team Member';
                const shortContent = message.content ? 
                    (message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content) 
                    : 'Sent an attachment';

                // In-App Toast
                toast.info(`Message from ${senderName}: ${shortContent}`, {
                    position: "bottom-right",
                    autoClose: 4000
                });

                // Desktop Browser Notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`New Message from ${senderName}`, {
                        body: shortContent,
                        icon: '/favicon.ico' // Or any relevant icon path
                    });
                }
            }
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [teamId]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { 
            toast.error('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachment(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() && !attachment) return;

        try {
            const savedMessage = await sendApiMessage(teamId, newMessage, replyTo?._id, attachment);

            socketRef.current.emit('send_message', savedMessage);

            setNewMessage('');
            setReplyTo(null);
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        }
    };

    // Helper syntax highlighting parsing (to apply a specific highlight to @Mentions)
    const preprocessMarkdown = (text) => {
        if (!text) return "";
        // Basic naive regex to bold @mentions so they stand out in Markdown
        return text.replace(/(@\w+)/g, '**$1**');
    };

    if (loading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="chat-page">
                <div className="chat-header">
                    <button className="back-btn" onClick={() => navigate('/teams')}>← Back</button>
                    <div className="chat-title">
                        <h2>{team?.name || 'Incident Command'} Room</h2>
                        <span className="member-count">{team?.members?.length || 0} Engineers Online</span>
                    </div>
                </div>

                <div className="chat-container">
                    <div className="messages-list">
                        {messages.map((msg, index) => {
                            const currentUserId = user?._id || user?.id; // Mongo uses _id
                            const senderId = msg.sender?._id || msg.sender;
                            const isMe = String(senderId) === String(currentUserId);
                            const senderName = msg.sender?.name || 'System';

                            return (
                                <div key={index} className={`message-wrapper ${isMe ? 'message-wrapper-me' : 'message-wrapper-other'}`}>
                                    <div className={`message-bubble ${isMe ? 'my-message' : 'other-message'}`}>
                                        <div className="message-info">
                                            <span className="sender-name">{isMe ? 'You' : senderName}</span>
                                            <span className="timestamp">{formatDateTime(msg.createdAt)}</span>
                                        </div>
                                        
                                        {/* Threading UI */}
                                        {msg.replyTo && (
                                            <div className="replied-message-preview">
                                                <div className="replied-name">
                                                    <FaReply size={10} style={{ marginRight: '4px' }}/> 
                                                    Replying to @{msg.replyTo.sender?.name || 'Unknown'}
                                                </div>
                                                <div className="replied-text">
                                                    {msg.replyTo.content?.substring(0, 40) || 'Attachment...'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {msg.image && (
                                            <div className="message-attachment">
                                                <img src={msg.image} alt="Upload" className="chat-screenshot" onClick={() => window.open(msg.image, '_blank')} />
                                            </div>
                                        )}

                                        {/* Content with Markdown built in */}
                                        {msg.content && (
                                            <div className="message-content markdown-body">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        strong: ({node, ...props}) => {
                                                            const text = props.children?.[0]?.toString();
                                                            if (text && text.startsWith('@')) {
                                                                return <span className="mention" style={{ color: 'var(--blue-500)', fontWeight: 'bold', background: 'var(--blue-50)', padding: '2px 4px', borderRadius: '4px' }}>{props.children}</span>;
                                                            }
                                                            return <strong {...props} />;
                                                        }
                                                    }}
                                                >
                                                    {preprocessMarkdown(msg.content)}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Bar */}
                                    <div className="message-actions">
                                        <button className="msg-action-btn" onClick={() => setReplyTo(msg)} title="Reply in thread">
                                            <FaReply />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area with Action Indicators */}
                    <div className="chat-input-wrapper">
                        {/* Reply Bar */}
                        {replyTo && (
                            <div className="active-reply-bar">
                                <span className="reply-indicator">
                                    <FaReply size={12} style={{ marginRight: '6px' }}/> 
                                    Replying to <strong>{replyTo.sender?.name}</strong>
                                </span>
                                <button className="cancel-reply-btn" onClick={() => setReplyTo(null)}>
                                    <FaTimes />
                                </button>
                            </div>
                        )}
                        
                        {/* Attachment Bar */}
                        {attachment && (
                            <div className="active-attachment-bar">
                                <img src={attachment} alt="Preview" className="attachment-preview" />
                                <button className="cancel-attachment-btn" onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                                    <FaTimes />
                                </button>
                            </div>
                        )}

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input 
                                type="file" 
                                id="screenshot-upload" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleImageUpload}
                                ref={fileInputRef}
                            />
                            <label htmlFor="screenshot-upload" className="upload-btn" title="Upload Screenshot / Logs">
                                <FaImage />
                            </label>

                            <input
                                type="text"
                                placeholder="Message to Command Room (Markdown & @mentions supported)..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="chat-input"
                            />
                            <button type="submit" className="send-btn" disabled={!newMessage.trim() && !attachment}>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ChatPage;
