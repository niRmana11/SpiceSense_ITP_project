import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/adminProducts.css";
import NavBar from "../components/navBar";
import backgroundImage from "../assets/background.png";

const API_URL = "http://localhost:5000/api/products";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({ productName: "", category: "" });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");

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

    // Fetch products
    useEffect(() => {
        axios.get(API_URL)
            .then(response => setProducts(response.data))
            .catch(error => console.error("Error fetching products:", error));
    }, []);

    // Handle form input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Check for special characters in product name
    const containsSpecialCharacters = (str) => {
        const regex = /[^a-zA-Z0-9\s]/;
        return regex.test(str);
    };

    // Check for product name length 
    const isProductNameValidLength = (str) => {
        return str.length >= 5 && str.length <= 20;
    };

    // Submit form 
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (containsSpecialCharacters(formData.productName)) {
            setError("Product name cannot contain special characters.");
            return;
        }
        if (!isProductNameValidLength(formData.productName)) {
            setError("Product name must be between 5 and 20 characters.");
            return;
        }
        if (!formData.productName || !formData.category) {
            setError("All fields are required.");
            return;
        }

        setError("");

        const productData = {
            productName: formData.productName,
            category: formData.category
        };

        try {
            let response;
            if (editingId) {
                response = await axios.put(`${API_URL}/${editingId}`, productData);
                alert("Product Updated!");
                setProducts(products.map(p => (p._id === editingId ? response.data.product : p)));
                setEditingId(null);
            } else {
                response = await axios.post(API_URL, productData);
                alert("Product added!");
                setProducts([...products, response.data.product]);
            }

            setFormData({ productName: "", category: "" });
            window.location.reload();
        } catch (error) {
            console.error("Error submitting product:", error.response?.data || error.message);
            alert("Error submitting product! " + (error.response?.data?.error || "Check console for details."));
        }
    };

    // Delete Product
    const deleteProduct = async (id) => {

        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`);
            alert("Product deleted!");
            setProducts(products.filter(p => p._id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    // Load product details for editing
    const editProduct = (product) => {
        setEditingId(product._id);
        setFormData({
            productName: product.productName,
            category: product.category
        });
    };

    return (
        <div>
            <NavBar />
            <div className="admin-products-container">
                <h2>Admin Product Management</h2>
                <form onSubmit={handleSubmit} className="product-form">
                    <input
                        type="text"
                        name="productName"
                        placeholder="Product Name"
                        value={formData.productName}
                        onChange={handleChange}
                        required
                    />
                    <select name="category" value={formData.category} onChange={handleChange} required>
                        <option value="" disabled>Select Category</option>
                        <option value="Raw Material">Raw Material</option>
                        <option value="Finished Product">Finished Product</option>
                    </select>

                    {error && <p style={{ color: "red" }}>{error}</p>}

                    <button type="submit">{editingId ? "Update" : "Add"} Product</button>
                </form>

                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product._id}>
                                <td>{product.productName}</td>
                                <td>{product.category}</td>
                                <td>
                                    <button onClick={() => editProduct(product)}>Edit</button>
                                    <button onClick={() => deleteProduct(product._id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProducts;
