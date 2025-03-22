import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchItems = async () => {
  return axios.get(`${API_BASE_URL}/item`);
};

export const fetchItemDetails = async (itemId) => {
  return axios.get(`${API_BASE_URL}/item/${itemId}`);
};

export const createOrder = async (orderData) => {
  return axios.post(`${API_BASE_URL}/order/create`, orderData);
};
