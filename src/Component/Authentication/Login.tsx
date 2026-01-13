import { Link, useNavigate } from "react-router-dom";
import { Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, H3, Image, P } from "../../AbstractElements";
import { dynamicImage } from "../../Service";
import { EmailAddress, Href, Password, SignIn, SignInAccount } from "../../utils/Constant";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { API_HELPER } from "../../helpers/ApiHelper";
import { API_WEB_URLS } from "../../constants/constAPI";
import "./LandingPage.css";

const Login = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(true); // Directly show login form
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  // Ensure clean state on component mount
  useEffect(() => {
    // Clear any stale authentication data when login page loads
    const storedUser = sessionStorage.getItem("authUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Only clear if user is invalid or logout was called
        if (!parsedUser || !parsedUser.Id || Number(parsedUser.Id) <= 0) {
          sessionStorage.removeItem("authUser");
          sessionStorage.removeItem("login");
        }
      } catch (error) {
        // Clear invalid data
        sessionStorage.removeItem("authUser");
        sessionStorage.removeItem("login");
      }
    }
    setIsVisible(true);
  }, []);

  const handleSignInClick = () => {
    setShowLoginForm(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentField === 'email') {
        const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      } else if (currentField === 'password') {
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.focus();
        }
      }
    }
  };

  const SimpleLoginHandle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("UserName", email);
    formData.append("UserPassword", password);
    try {
      const response = await API_HELPER.apiPOST_Multipart(API_WEB_URLS.BASE + API_WEB_URLS.LOGIN, formData);
      const userData = response?.data?.response?.[0];
      if (response?.success && userData?.Id) {
        console.log("----------------------------------------------");
        sessionStorage.setItem("authUser", JSON.stringify(userData));
        sessionStorage.setItem("login", JSON.stringify(true));
        navigate(`${process.env.PUBLIC_URL}/schemeWiseReport`);
        console.log("----------------------------------------------");
      } else {
        toast.error(response?.message || "Login failed");
        navigate(`${process.env.PUBLIC_URL}/login`);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to login. Please try again.");
    }
  };
  // Show custom screen first, then login form
  if (!showLoginForm) {
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
                    onClick={handleSignInClick}
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
  }

  // Show login form after Sign In button is clicked
  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs="12" className="p-0">
          <div className="login-card login-dark">
            <div>
              <div>
                {/* <Link className="logo text-center" to={Href}>
                  <Image className="img-fluid for-light" src={dynamicImage("logo/logo-1.png")} alt="looginpage" />
                  <Image className="img-fluid for-dark" src={dynamicImage("logo/logo.png")} alt="looginpage" />
                </Link> */}
                
                
              </div>
              <div className="login-main">
                <Form className="theme-form" onSubmit={(e) => SimpleLoginHandle(e)}>
                  <H3>{SignInAccount}</H3>
                  <P>{"Enter your email & password to login"}</P>
                  <FormGroup>
                    <Label className="col-form-label">{EmailAddress}</Label>
                    <Input type="text" required placeholder="Test@gmail.com" value={email} name="email" onChange={(event) => setEmail(event.target.value)} onKeyDown={(e) => handleKeyDown(e, 'email')} autoFocus />
                  </FormGroup>
                  <FormGroup>
                    <Label className="col-form-label">{Password}</Label>
                    <div className="form-input position-relative">
                      <Input type={show ? "text" : "password"} placeholder="*********" onChange={(event) => setPassword(event.target.value)} value={password} name="password" onKeyDown={(e) => handleKeyDown(e, 'password')} />
                      <div className="show-hide" onClick={() => setShow(!show)}>
                        <span className="show"> </span>
                      </div>
                    </div>
                  </FormGroup>
                  <FormGroup className="mb-0 form-sub-title">
                    <div className="text-end mt-3">
                      <Btn color="primary" block className="w-100">
                        {SignIn}
                      </Btn>
                    </div>
                  </FormGroup>
                </Form>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
