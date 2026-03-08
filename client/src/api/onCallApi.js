import axiosInstance from './axiosConfig';

export const getOnCallSchedules = async (teamId) => {
    const params = teamId ? { teamId } : {};
    return await axiosInstance.get('/oncall', { params });
};

export const getCurrentOnCall = async () => {
    return await axiosInstance.get('/oncall/current');
};

export const createOnCallSchedule = async (scheduleData) => {
    return await axiosInstance.post('/oncall', scheduleData);
};

export const deleteOnCallSchedule = async (id) => {
    return await axiosInstance.delete(`/oncall/${id}`);
};
