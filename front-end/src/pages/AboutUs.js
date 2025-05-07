// pages/AboutUs.js
import React, { useState, useEffect } from "react";
import NavigationBar from "../components/NavigationBar";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/AboutUsSpiced.css";
import axios from "axios";
import spicesBanner from "../images/spices-banner.jpg";
import matheesha from "../images/matheesha.jpg";
import vishwa from "../images/vishwa.jpg";
import nirmana from "../images/nirmana.jpg";
import kanushka from "../images/kanushka.jpg";
import bishan from "../images/bishan.jpg";
const AboutUs = () => {
  const userId = sessionStorage.getItem("userId");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
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

  return (
    <div className="about-spiced-container">
      <NavigationBar userData={userData} />
      <section className="about-spiced-hero">
        <h1 className="about-spiced-hero-title">About SpiceSense</h1>
        <p className="about-spiced-hero-text">
          Discover the essence of flavor with SpiceSense, where passion for spices meets culinary excellence.
        </p>
        <img
          src={spicesBanner}
          alt="Vibrant spices in a market setting"
          className="about-spiced-hero-image"
        />
      </section>

      <section className="about-spiced-mission">
        <div className="about-spiced-card">
          <h2 className="about-spiced-card-title">Our Mission</h2>
          <p className="about-spiced-card-text">
            To bring the world’s finest, sustainably sourced spices to your kitchen, enhancing every dish with authentic flavors and aromas.
          </p>
        </div>
        <div className="about-spiced-card">
          <h2 className="about-spiced-card-title">Our Vision</h2>
          <p className="about-spiced-card-text">
            To inspire culinary creativity by connecting people with the rich heritage and stories behind every spice.
          </p>
        </div>
      </section>

      <section className="about-spiced-team">
        <h2 className="about-spiced-section-title">Meet Our Team</h2>
        <div className="about-spiced-team-grid">
          
          <div className="about-spiced-team-member">
            <img
              src={vishwa}
              alt="Team member 1"
              className="about-spiced-team-image"
            />
            <h3 className="about-spiced-team-name">Vishwa Abeyrathna</h3>
            <p className="about-spiced-team-role">Lead Admin</p>
          </div>
          <div className="about-spiced-team-member">
            <img
              src={nirmana}
              alt="Team member 2"
              className="about-spiced-team-image"
            />
            <h3 className="about-spiced-team-name">Nirmana Herath</h3>
            <p className="about-spiced-team-role">Inventory Manager</p>
          </div>
          <div className="about-spiced-team-member">
            <img
              src={matheesha}
              alt="Team member 3"
              className="about-spiced-team-image"
            />
            <h3 className="about-spiced-team-name">Matheesha Weerakoon</h3>
            <p className="about-spiced-team-role">Financial Analyst</p>
          </div>
          <div className="about-spiced-team-member">
            <img
              src={kanushka}
              alt="Team member 4"
              className="about-spiced-team-image"
            />
            <h3 className="about-spiced-team-name">Kanushka Kahakotuwa</h3>
            <p className="about-spiced-team-role">Supplier Manager</p>
          </div>
          <div className="about-spiced-team-member">
            <img
              src={bishan}
              alt="Team member 5"
              className="about-spiced-team-image"
            />
            <h3 className="about-spiced-team-name">Bishan Wishwajith</h3>
            <p className="about-spiced-team-role">Order Manager</p>
          </div>
        </div>
      </section>

      <section className="about-spiced-values">
        <h2 className="about-spiced-section-title">Our Values</h2>
        <div className="about-spiced-values-grid">
          <div className="about-spiced-value-item">
            <h3 className="about-spiced-value-title">Quality</h3>
            <p className="about-spiced-value-text">
              We source only the freshest, highest-quality spices from trusted global partners.
            </p>
          </div>
          <div className="about-spiced-value-item">
            <h3 className="about-spiced-value-title">Sustainability</h3>
            <p className="about-spiced-value-text">
              We prioritize eco-friendly practices and fair trade to support farmers and the planet.
            </p>
          </div>
          <div className="about-spiced-value-item">
            <h3 className="about-spiced-value-title">Community</h3>
            <p className="about-spiced-value-text">
              We foster a global community of food lovers united by the joy of cooking.
            </p>
          </div>
        </div>
      </section>

      <section className="about-spiced-cta">
        <h2 className="about-spiced-cta-title">Ready to Spice Up Your Kitchen?</h2>
        <button
          onClick={() => navigate("/home", { state: { userData } })}
          className="about-spiced-cta-button"
        >
          Explore Our Spices
        </button>
      </section>
    </div>
  );
};

export default AboutUs;