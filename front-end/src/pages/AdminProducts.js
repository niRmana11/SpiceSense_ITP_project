import React, { useEffect, useState } from "react";
import axios from "axios";  
import "../Styles/adminProducts.css";
import NavBar from "../components/navBar";


const API_URL = "http://localhost:5000/api/products";


const AdminProducts = () => {
    
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({ productName: "", category: "", image: null });
    const [editingId, setEditingId] = useState(null);

  

    // fetch products
    useEffect(() => {
        axios.get(API_URL)
            .then(response => setProducts(response.data))
            .catch(error => console.error("Error fetching products:", error));
    }, []);

    // handle form input change
    const handleChange = (e) => {
        if (e.target.name === "image") {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

   

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const productData = new FormData();
        productData.append("productName", formData.productName);
        productData.append("category", formData.category);
        if (formData.image instanceof File) productData.append("image", formData.image);
    
        console.log("Submitting:", formData);

        try {
            let response;
            if (editingId) {
                // Update existing product
                response = await axios.put(`${API_URL}/${editingId}`, productData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                alert("Product Updated!");
                setProducts(products.map(p => (p._id === editingId ? response.data.product : p)));
                setEditingId(null);
            } else {
                // Add new product
                response = await axios.post(API_URL, productData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                alert("Product added!");
                setProducts([...products, response.data.product]);
            }
    
            // Reset form after submission
            setFormData({ productName: "", category: "", image: null });
            window.location.reload();
        } catch (error) {
            console.error("Error submitting product:", error.response?.data || error.message);
            alert("Error submitting product! " + (error.response?.data?.error || "Check console for details."));
        }
    };
    

    // Delete Product
    const deleteProduct = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            alert("Product deleted!");
            setProducts(products.filter(p => p._id !== id)); // Update state after deleting
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };
    

    // load product details for editing
    const editProduct = (product) => {
        setEditingId(product._id);
        setFormData({ productName: product.productName, category: product.category, image: product.image });
    };

    

    

    return (
        <div>
             <NavBar />
        <div className="admin-products-container">
            <h2>Admin Product Management</h2>
            <form onSubmit={handleSubmit} className="product-form">
                <input type="text" name="productName" placeholder="Product Name" value={formData.productName} onChange={handleChange} required />
                <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="" disabled>Select Category</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Finished Product">Finished Product</option>
                </select>

                <label>Product Image:</label>
                <input type="file" name="image" accept="image/*" onChange={handleChange} required />
                <button type="submit">{ editingId ? "Update" : "Add"} Product</button>
            </form>


            <table className="product-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Image</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product._id}>
                            <td>{product.productName}</td>
                            <td>{product.category}</td>
                            <td>
                            <img src={`http://localhost:5000/${product.image}`} alt={product.productName} width="50px"/>

                            </td>

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
