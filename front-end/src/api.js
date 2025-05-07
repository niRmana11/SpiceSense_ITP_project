import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Item related endpoints
export const fetchItems = async () => {
  return axios.get(`${API_BASE_URL}/item`);
};

export const fetchItemDetails = async (itemId) => {
  return axios.get(`${API_BASE_URL}/item/${itemId}`);
};

// Order related endpoints
export const createOrder = async (orderData) => {
  return axios.post(`${API_BASE_URL}/order/create`, orderData);
};

export const updateOrder = async (orderId, orderData) => {
  return axios.put(`${API_BASE_URL}/order/${orderId}`, orderData);
};

export const deleteOrder = async (orderId) => {
  return axios.delete(`${API_BASE_URL}/order/${orderId}`);
};

export const fetchOrder = async (orderId) => {
  return axios.get(`${API_BASE_URL}/order/${orderId}`);
};

// The order collection endpoint
export const fetchAllOrders = async () => {
  return axios.get(`${API_BASE_URL}/order`);
};

// Delivery related endpoints
export const createDelivery = async (deliveryData) => {
  return axios.post(`${API_BASE_URL}/delivery/create`, deliveryData);
};

export const updateDeliveryStatus = async (deliveryId, statusData) => {
  return axios.put(`${API_BASE_URL}/delivery/${deliveryId}/status`, statusData);
};

export const fetchDeliveryByOrderId = async (orderId) => {
  return axios.get(`${API_BASE_URL}/delivery/order/${orderId}`);
};

export const fetchAllDeliveries = async () => {
  return axios.get(`${API_BASE_URL}/delivery`);
};

// Add withCredentials option for all requests
axios.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;