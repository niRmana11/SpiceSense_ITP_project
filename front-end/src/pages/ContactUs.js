// pages/ContactUs.js
import React, { useState, useEffect } from "react";
import NavigationBar from "../components/NavigationBar";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/ContactUsSpiced.css";
import axios from "axios";
import mapsof from "../images/map.png";

const ContactUs = () => {
  const userId = sessionStorage.getItem("userId");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [faqOpen, setFaqOpen] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const passedUserData = location.state?.userData;
        if (passedUserData) {
          setUserData(passedUserData);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/user/data", {
          withCredentials: true,
        });

        if (response.data.success) {
          setUserData(response.data.userData);
        } else {
          setError(response.data.message);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data?.message || error.message);
        setError("Failed to load user data. Please log in again.");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate, location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.message.trim()) errors.message = "Message is required";
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    // Placeholder for form submission (e.g., API call)
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
    setFormErrors({});
  };

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="contact-spiced-container">
      <NavigationBar userData={userData} />
      <section className="contact-spiced-hero">
        <h1 className="contact-spiced-hero-title">Get in Touch</h1>
        <p className="contact-spiced-hero-text">
          We're here to answer your questions and spice up your experience with SpiceSense!
        </p>
        <img
          src={mapsof}
          alt="Spices and customer service setting"
          className="contact-spiced-hero-image"
        />
      </section>

      {/* <section className="contact-spiced-form-section">
        <h2 className="contact-spiced-section-title">Send Us a Message</h2>
        <form className="contact-spiced-form" onSubmit={handleSubmit}>
          <div className="contact-spiced-form-group">
            <label htmlFor="name" className="contact-spiced-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`contact-spiced-input ${formErrors.name ? "contact-spiced-input-error" : ""}`}
              aria-invalid={formErrors.name ? "true" : "false"}
            />
            {formErrors.name && <p className="contact-spiced-error">{formErrors.name}</p>}
          </div>
          <div className="contact-spiced-form-group">
            <label htmlFor="email" className="contact-spiced-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`contact-spiced-input ${formErrors.email ? "contact-spiced-input-error" : ""}`}
              aria-invalid={formErrors.email ? "true" : "false"}
            />
            {formErrors.email && <p className="contact-spiced-error">{formErrors.email}</p>}
          </div>
          <div className="contact-spiced-form-group">
            <label htmlFor="message" className="contact-spiced-label">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className={`contact-spiced-input ${formErrors.message ? "contact-spiced-input-error" : ""}`}
              rows="5"
              aria-invalid={formErrors.message ? "true" : "false"}
            ></textarea>
            {formErrors.message && <p className="contact-spiced-error">{formErrors.message}</p>}
          </div>
          <button type="submit" className="contact-spiced-submit-button">
            Send Message
          </button>
        </form>
      </section> */}

      <section className="contact-spiced-info">
        <h2 className="contact-spiced-section-title">Contact Information</h2>
        <div className="contact-spiced-info-grid">
          <div className="contact-spiced-info-card">
            <span className="contact-spiced-info-icon">📧</span>
            <h3 className="contact-spiced-info-title">Email</h3>
            <p className="contact-spiced-info-detail">support@spicesense.com</p>
          </div>
          <div className="contact-spiced-info-card">
            <span className="contact-spiced-info-icon">📞</span>
            <h3 className="contact-spiced-info-title">Phone</h3>
            <p className="contact-spiced-info-detail">+94 (555) 123-4567</p>
          </div>
          <div className="contact-spiced-info-card">
            <span className="contact-spiced-info-icon">📍</span>
            <h3 className="contact-spiced-info-title">Address</h3>
            <p className="contact-spiced-info-detail">123 Spice Lane, Palapathwela, Sri Lanka</p>
          </div>
          <div className="contact-spiced-info-card">
            <span className="contact-spiced-info-icon">🌐</span>
            <h3 className="contact-spiced-info-title">Follow Us</h3>
            <div className="contact-spiced-social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="contact-spiced-social-link">
                Twitter
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="contact-spiced-social-link">
                Instagram
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="contact-spiced-social-link">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-spiced-faq">
        <h2 className="contact-spiced-section-title">Frequently Asked Questions</h2>
        <div className="contact-spiced-faq-list">
          {[
            {
              question: "How can I track my order?",
              answer: "Once your order is shipped, you’ll receive a tracking link via email. You can also check your order status in your account.",
            },
            {
              question: "What is your return policy?",
              answer: "We offer a 30-day return policy for unopened products. Contact us to initiate a return.",
            },
            {
              question: "Do you ship internationally?",
              answer: "Yes, we ship to many countries. Check our shipping page for details and rates.",
            },
          ].map((faq, index) => (
            <div key={index} className="contact-spiced-faq-item">
              <button
                className="contact-spiced-faq-question"
                onClick={() => toggleFaq(index)}
                aria-expanded={faqOpen === index}
                aria-controls={`faq-answer-${index}`}
              >
                {faq.question}
                <span className={`contact-spiced-faq-icon ${faqOpen === index ? "open" : ""}`}>
                  {faqOpen === index ? "−" : "+"}
                </span>
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`contact-spiced-faq-answer ${faqOpen === index ? "open" : ""}`}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-spiced-cta">
        <h2 className="contact-spiced-cta-title">Explore Our Spices</h2>
        <button
          onClick={() => navigate("/home", { state: { userData } })}
          className="contact-spiced-cta-button"
        >
          Shop Now
        </button>
      </section>
    </div>
  );
};

export default ContactUs;