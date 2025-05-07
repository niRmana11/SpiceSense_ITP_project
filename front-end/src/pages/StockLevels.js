import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/stockLevels.css";
import NavBar from "../components/navBar";
import backgroundImage from "../assets/background.png";

const API_URL = "http://localhost:5000/api";

const StockLevels = () => {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [formData, setFormData] = useState({ productId: "", expiryDate: "", quantity: "" });
  const [editingBatch, setEditingBatch] = useState(null);
  const [editFormData, setEditFormData] = useState({ expiryDate: "", quantity: "" });
  const [stockOutData, setStockOutData] = useState({ soldProductId: "", soldQuantity: "" });

  useEffect(() => {
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundRepeat = "no-repeat";

    return () => {
      document.body.style.backgroundImage = "";
    };
  }, []);

  // Fetch products and stocks
  useEffect(() => {
    axios.get(`${API_URL}/products`)
      .then(response => setProducts(response.data))
      .catch(error => console.error("Error fetching products:", error));

    axios.get(`${API_URL}/stocks`)
      .then(response => setStocks(response.data))
      .catch(error => console.error("Error fetching stocks:", error));
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Add stock batch
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isFutureDate = new Date(formData.expiryDate) > new Date();
    if (!isFutureDate) {
      alert("Expiry date must be in the future.");
      return;
    }

    if (formData.quantity <= 0) {
      alert("Quantity must be a positive number.");
      return;
    }


    try {
      const response = await axios.post(`${API_URL}/stocks/add`, formData);
      alert("Stock batch added!");
      window.location.reload();
      setStocks([...stocks, response.data.stock]);
      setFormData({ productId: "", expiryDate: "", quantity: "" });

    } catch (error) {
      console.error("Error adding stock batch:", error.response?.data || error.message);
    }
  };

  // Edit batch details
  const handleEditBatch = async (stockId, batchNumber) => {
    const today = new Date().toISOString().split("T")[0];


    if (editFormData.expiryDate < today) {
      alert("Expiry date cannot be a past date.");
      return;
    }


    if (isNaN(editFormData.quantity) || Number(editFormData.quantity) <= 0) {
      alert("Quantity must be a positive number.");
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/stocks/edit/${stockId}/${batchNumber}`, editFormData);
      alert("Batch updated successfully!");
      window.location.reload();
      setStocks(stocks.map(stock =>
        stock._id === stockId ? response.data.stock : stock
      ));
      setEditingBatch(null);
    } catch (error) {
      console.error("Error updating batch:", error.response?.data || error.message);
    }
  };



  // Delete a batch
  const handleDeleteBatch = async (stockId, batchNumber) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    try {
      await axios.delete(`${API_URL}/stocks/delete/${stockId}/${batchNumber}`);
      alert("Batch deleted successfully!");
      window.location.reload();


      setStocks(prevStocks => prevStocks.map(stock => ({
        ...stock,
        batches: stock.batches.filter(batch => batch.batchNumber !== batchNumber)
      })));
    } catch (error) {
      console.error("Error deleting batch:", error.response?.data ?? error.message);
      alert(`Error: ${error.response?.data?.message || "Failed to delete batch"}`);
    }
  };


  const handleStockOutChange = (e) => {
    setStockOutData({ ...stockOutData, [e.target.name]: e.target.value });
  };


  // selling batch
  const handleStockOut = async (e) => {
    e.preventDefault();

    console.log("Sell button clicked");

    if (stockOutData.soldQuantity <= 0) {
      alert("Quantity must be a positive number.");
      return;
    }

    const currentStock = stocks.find(s => s.product._id === stockOutData.soldProductId)?.totalQuantity;
    if (stockOutData.soldQuantity > currentStock) {
      alert("Not enough stock available.");
      return;
    }


    try {
      const response = await axios.post(`${API_URL}/stocks/sell`, stockOutData);
      alert("Stock updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error processing stock out:", error.response?.data || error.message);
    }
  };

  return (
    <div style={{
      backgroundImage: `url(${require("../assets/background.png")})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      backgroundRepeat: "no-repeat"
    }}>
      <NavBar />
      <div className="stock-container">
        <h2>Stock Management</h2>

        <div className="form-container">

          <form onSubmit={handleSubmit} className="stock-form">
            <h3>Add Stock</h3>
            <label htmlFor="productId">Select Product</label>
            <select name="productId" value={formData.productId} onChange={handleChange} required>
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.productName}</option>
              ))}
            </select>

            <label htmlFor="expiryDate">Expiry Date</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />

            <label htmlFor="quantity">Quantity (Kg)</label>
            <input type="number" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} required />

            <button type="submit" className="stock-button">Add Stock</button>
          </form>


          <form onSubmit={handleStockOut} className="stock-form">
            <h3>Sell Product</h3>
            <label htmlFor="soldProductId">Select Product</label>
            <select name="soldProductId" value={stockOutData.soldProductId} onChange={handleStockOutChange} required>
              <option value="">Select Product</option>
              {products.map(product => (
                <option value={product._id} key={product._id}>{product.productName}</option>
              ))}
            </select>

            <label htmlFor="soldQuantity">Quantity (Kg)</label>
            <input type="number" name="soldQuantity" placeholder="Quantity" value={stockOutData.soldQuantity} onChange={handleStockOutChange} required />

            <button type="submit" className="sell-button">Sell</button>
          </form>
        </div>

        <table className="stocks-stock-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Total Stock</th>
              <th>Batch Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks
              .filter(stock => stock.totalQuantity > 0)
              .map(stock => (
                <tr key={stock._id}>
                  <td>{stock.product?.productName}</td>
                  <td>{stock.totalQuantity} Kg</td>
                  <td>
                    <div className="batch-list">
                      {stock.batches.map(batch => (
                        <div key={batch.batchNumber} className="batch-details">
                          <span>Batch: {batch.batchNumber}</span>
                          <span>Expiry: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                          <span>Qty: {batch.quantity} Kg</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="action-buttons">
                    {stock.batches.map(batch => (
                      <div key={batch.batchNumber} className="batch-actions">
                        {editingBatch === batch.batchNumber ? (
                          <div className="edit-form">
                            <input
                              type="date"
                              name="expiryDate"
                              value={editFormData.expiryDate}
                              onChange={handleEditChange}
                              required
                            />
                            <input
                              type="number"
                              name="quantity"
                              value={editFormData.quantity}
                              onChange={handleEditChange}
                              required
                            />
                            <button className="save-btn" onClick={() => handleEditBatch(stock._id, batch.batchNumber)}>Save</button>
                            <button className="cancel-btn" onClick={() => setEditingBatch(null)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button className="edit-btn" onClick={() => {
                              setEditingBatch(batch.batchNumber);
                              setEditFormData({
                                expiryDate: batch.expiryDate.split("T")[0],
                                quantity: batch.quantity
                              });
                            }}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDeleteBatch(stock._id, batch.batchNumber)}>Delete</button>
                          </>
                        )}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default StockLevels;