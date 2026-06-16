import axiosInstance from './axiosConfig';
import { API } from './config';

export const getOnCallSchedules = async (teamId) => {
    const params = teamId ? { teamId } : {};
    return await axiosInstance.get(`${API}/api/oncall`, { params });
};

export const getCurrentOnCall = async () => {
    return await axiosInstance.get(`${API}/api/oncall/current`);
};

export const createOnCallSchedule = async (scheduleData) => {
    return await axiosInstance.post(`${API}/api/oncall`, scheduleData);
};

export const deleteOnCallSchedule = async (id) => {
    return await axiosInstance.delete(`${API}/api/oncall/${id}`);
};
