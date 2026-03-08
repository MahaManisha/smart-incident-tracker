import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const RedirectWithToast = ({ to, message }) => {
    useEffect(() => {
        toast.warning(message);
    }, [message]);
    return <Navigate to={to} replace />;
};

export default RedirectWithToast;
