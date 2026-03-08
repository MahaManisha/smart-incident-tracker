import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getTeamMessages, sendMessage as sendApiMessage } from '../api/chatApi';
import { getTeamById } from '../api/teamsApi'; // You might need this to get team name
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/formatters';
import { toast } from 'react-toastify';
import './ChatPage.css'; // We'll create this next

const SOCKET_URL = 'http://localhost:5000'; // Adjust if env var differs

const ChatPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [teamData, msgs] = await Promise.all([
                    getTeamById(teamId),
                    getTeamMessages(teamId)
                ]);
                setTeam(teamData.team);
                setMessages(msgs || []);
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

    // Socket Connection
    useEffect(() => {
        // 1. Connect
        socketRef.current = io(SOCKET_URL);

        // 2. Join Room
        socketRef.current.emit('join_team', teamId);

        // 3. Listen for Messages
        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [teamId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // 1. Persist to DB
            const savedMessage = await sendApiMessage(teamId, newMessage);

            // 2. Emit to Socket (Server broadcasts to room, including sender)
            // We rely on 'receive_message' to update UI to keep order synced
            socketRef.current.emit('send_message', savedMessage);

            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        }
    };

    if (loading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="chat-page">
                <div className="chat-header">
                    <button className="back-btn" onClick={() => navigate('/teams')}>← Back</button>
                    <div className="chat-title">
                        <h2>{team?.name || 'Team'} Chat</h2>
                        <span className="member-count">{team?.members?.length || 0} Members</span>
                    </div>
                </div>

                <div className="chat-container">
                    <div className="messages-list">
                        {messages.map((msg, index) => {
                            const isMe = msg.sender?._id === user?.id || msg.sender === user?.id; // Handle populated/unpopulated
                            // Safe sender name check
                            const senderName = msg.sender?.name || 'Unknown';

                            return (
                                <div key={index} className={`message-bubble ${isMe ? 'my-message' : 'other-message'}`}>
                                    <div className="message-info">
                                        <span className="sender-name">{isMe ? 'You' : senderName}</span>
                                        <span className="timestamp">{formatDateTime(msg.createdAt)}</span>
                                    </div>
                                    <div className="message-content">{msg.content}</div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="chat-input"
                        />
                        <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default ChatPage;
