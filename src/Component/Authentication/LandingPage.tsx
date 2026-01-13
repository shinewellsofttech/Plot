import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSignIn = () => {
    navigate(`${process.env.PUBLIC_URL}/login`);
  };

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-background">
        <div className="cityscape-overlay"></div>
        <div className="gradient-overlay"></div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="brand-logo">
                <span className="brand-name-primary">MADHUBAN</span>
                <span className="brand-name-secondary">COLONIZERS</span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <div className="header-icon">
                <div className="icon-circle">
                  <span className="icon-letter">M</span>
                  <div className="icon-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-8">
              <div className={`landing-content ${isVisible ? 'fade-in' : ''}`}>
                <h1 className="landing-tagline">
                  <span className="tagline-part-1">You will see</span>
                  <span className="tagline-highlight"> dreams, we will</span>
                  <span className="tagline-part-2"> make it come true!</span>
                </h1>
                <div className="tagline-underline"></div>
                <p className="landing-subtitle">
                  Building your dreams into reality, one plot at a time
                </p>
                <button 
                  className="btn-signin" 
                  onClick={handleSignIn}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <p className="footer-text">
                © Copyright Madhuban Colonizers. All Rights Reserved. Designed by Shinewell Innovation Softech Pvt Ltd.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Elements for Visual Appeal */}
      <div className="floating-elements">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>
    </div>
  );
};

export default LandingPage;

