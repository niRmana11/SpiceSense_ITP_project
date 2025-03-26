import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Get all products
export const getProducts = async () => {
    return await axios.get(`${API_URL}/products`);
};

// Add a product
export const addProduct = async (productData) => {
    return await axios.post(`${API_URL}/products`, productData);
};

// Update a product
export const updateProduct = async (id, productData) => {
    return await axios.put(`${API_URL}/products/${id}`, productData);
};

// Delete a product
export const deleteProduct = async (id) => {
    return await axios.delete(`${API_URL}/products/${id}`);
};




// Get all stock levels
export const getStocks = async () => {
    return await axios.get(`${API_URL}/stocks`);
};

// Add a new stock batch
export const addStock = async (stockData) => {
    return await axios.post(`${API_URL}/stocks/add`, stockData);
};

// Update a stock batch (if applicable)
export const updateStock = async (id, stockData) => {
    return await axios.put(`${API_URL}/stocks/${id}`, stockData);
};

// Delete a stock batch (if applicable)
export const deleteStock = async (id) => {
    return await axios.delete(`${API_URL}/stocks/${id}`);
};