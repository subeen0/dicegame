import axios from "axios";

const API_URL = "http://localhost:5000/api/polls";

export const createPoll = async (pollData) => {
  const response = await axios.post(API_URL, pollData);
  return response.data;
};

export const fetchPoll = async (pollId) => {
  const response = await axios.get(`${API_URL}/${pollId}`);
  return response.data;
};

export const vote = async (pollId, option) => {
  const response = await axios.put(`${API_URL}/${pollId}/vote`, { option });
  return response.data;
};
