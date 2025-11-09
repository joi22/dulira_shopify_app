import { useState } from "react";
import "./App.css";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userImage, setUserImage] = useState(null);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [email, setEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredName: "",
    savePassword: "",
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvc: "",
  });
  const [isLoginMode, setIsLoginMode] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setIsBlurred(true);
      setCurrentStep(2);
      setShowTryOnModal(false);
      setShowQRModal(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setIsBlurred(true);
      setCurrentStep(2);
      setShowTryOnModal(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUnblurClick = () => {
    setShowEmailModal(true);
  };

  const handleEmailModalContinue = () => {
    if (email.trim()) {
      setShowEmailModal(false);
      setIsBlurred(false);
      setCurrentStep(3);
    }
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
  };

  const handleActionButton = (action) => {
    // When clicking Buy, Share, or Download in step 3
    setCurrentStep(4); // Go to Register/Login form
  };

  const handleRegisterLogin = () => {
    setCurrentStep(5); // Go to Payment form
  };

  const handlePaymentContinue = () => {
    setCurrentStep(6); // Go to Save Look modal
  };

  const handleSaveLook = () => {
    setCurrentStep(7); // Go to Your Look page
  };

  const handleBackToHome = () => {
    setCurrentStep(1);
    setUserImage(null);
    setEmail("");
    setIsBlurred(true);
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      preferredName: "",
      savePassword: "",
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvc: "",
    });
  };

  // Step 1: Upload Page
  if (currentStep === 1) {
    return (
      <div className="app">
        <main className="main-content">
          <div className="try-on-section">
            <button
              className="try-on-trigger-btn"
              onClick={() => setShowTryOnModal(true)}
            >
              Try On This Look
            </button>
          </div>
        </main>

        {/* Try-On Upload Modal */}
        {showTryOnModal && (
          <div
            className="try-on-modal-overlay"
            onClick={() => setShowTryOnModal(false)}
          >
            <div className="try-on-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="try-on-modal-close"
                onClick={() => setShowTryOnModal(false)}
              >
                ×
              </button>

              <h3 className="try-on-modal-title">Try-On This look</h3>
              <p className="try-on-modal-subtitle">
                See how this product looks on you.
              </p>

              <div
                className="drag-drop-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="drag-drop-content">
                  <div className="upload-icon">
                    <img width="150px" src="./media/1p.png" alt="upload" />
                  </div>
                  <p className="drag-text">DRAG OR DROP YOUR IDEA</p>
                  <p className="or-text">or</p>

                  <label className="upload-btn">
                    Browse files
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="qr-section">
                <div className="qr-container">
                  <div className="qr-info">
                    <button
                      className="qr-scan-btn"
                      onClick={() => {
                        setShowTryOnModal(false);
                        setShowQRModal(true);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Scan QR code with your phone
                    </button>
                    <p>
                      Scan to choose a photo from your phone. Your try-on will
                      appear here once done.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQRModal && (
          <div
            className="qr-modal-overlay"
            onClick={() => {
              setShowQRModal(false);
              setQrImageError(false);
            }}
          >
            <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="qr-modal-close"
                onClick={() => {
                  setShowQRModal(false);
                  setQrImageError(false);
                }}
              >
                ×
              </button>

              <div className="qr-code-container">
                <div className="qr-code-placeholder">
                  {!qrImageError ? (
                    <img
                      src="./media/qr-code.png"
                      alt="QR Code"
                      className="qr-code-image"
                      onError={() => setQrImageError(true)}
                    />
                  ) : (
                    <svg
                      width="200"
                      height="200"
                      viewBox="0 0 200 200"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="qr-code-svg"
                    >
                      <rect width="200" height="200" fill="white" />
                      <rect x="10" y="10" width="50" height="50" fill="black" />
                      <rect x="15" y="15" width="40" height="40" fill="white" />
                      <rect x="20" y="20" width="30" height="30" fill="black" />
                      <rect x="140" y="10" width="50" height="50" fill="black" />
                      <rect x="145" y="15" width="40" height="40" fill="white" />
                      <rect x="150" y="20" width="30" height="30" fill="black" />
                      <rect x="10" y="140" width="50" height="50" fill="black" />
                      <rect x="15" y="145" width="40" height="40" fill="white" />
                      <rect x="20" y="150" width="30" height="30" fill="black" />
                      <rect x="70" y="10" width="10" height="10" fill="black" />
                      <rect x="90" y="10" width="10" height="10" fill="black" />
                      <rect x="110" y="10" width="10" height="10" fill="black" />
                      <rect x="10" y="70" width="10" height="10" fill="black" />
                      <rect x="30" y="70" width="10" height="10" fill="black" />
                      <rect x="50" y="70" width="10" height="10" fill="black" />
                      <rect x="70" y="70" width="50" height="50" fill="black" />
                      <rect x="80" y="80" width="30" height="30" fill="white" />
                      <rect x="90" y="90" width="10" height="10" fill="black" />
                      <rect x="130" y="70" width="10" height="10" fill="black" />
                      <rect x="150" y="70" width="10" height="10" fill="black" />
                      <rect x="170" y="70" width="10" height="10" fill="black" />
                      <rect x="70" y="130" width="10" height="10" fill="black" />
                      <rect x="90" y="130" width="10" height="10" fill="black" />
                      <rect x="110" y="130" width="10" height="10" fill="black" />
                      <rect x="130" y="130" width="10" height="10" fill="black" />
                      <rect x="150" y="130" width="10" height="10" fill="black" />
                      <rect x="170" y="130" width="10" height="10" fill="black" />
                      <rect x="10" y="170" width="10" height="10" fill="black" />
                      <rect x="30" y="170" width="10" height="10" fill="black" />
                      <rect x="50" y="170" width="10" height="10" fill="black" />
                      <rect x="70" y="170" width="10" height="10" fill="black" />
                      <rect x="90" y="170" width="10" height="10" fill="black" />
                      <rect x="110" y="170" width="10" height="10" fill="black" />
                      <rect x="130" y="170" width="10" height="10" fill="black" />
                      <rect x="150" y="170" width="10" height="10" fill="black" />
                      <rect x="170" y="170" width="10" height="10" fill="black" />
                    </svg>
                  )}
                </div>
              </div>

              <h3 className="qr-modal-title">
                Scan This Qr code to Try-On This Item
              </h3>
              <p className="qr-modal-instruction">
                Use your phone to upload or take a photo. Your Try-On will
                appear here on your desktop automatically once you're done.
              </p>

              <div className="qr-modal-separator">
                <p className="qr-or-text">Or</p>
              </div>

              <p className="qr-modal-upload-text">
                upload a photo from your computer
              </p>

              <label className="qr-browse-btn">
                Browse files
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Blurred Preview
  if (currentStep === 2) {
    return (
      <div className="app preview-mode">
        <header className="header">
          <button className="header-close-btn" onClick={handleBackToHome}>×</button>
          <div className="header-logo">
            <span className="logo-icon">●</span>
            <h1 className="logo">DUKIRA</h1>
          </div>
          <div className="header-center">
            <h2 className="header-title">Try-On Preview</h2>
            <p className="header-subtitle">
              Preview your outfit in real-time and adjust as you like.
            </p>
          </div>
        </header>

        <main className="preview-container">
          <div className="preview-content">
            <div className="image-preview">
              <div className="outfit-display">
                <div className="model-placeholder">
                  {userImage && (
                    <div className="image-wrapper">
                      <img
                        src={userImage}
                        alt="User Upload"
                        className="user-image blurred"
                      />
                      {isBlurred && (
                        <button
                          className="center-button"
                          onClick={handleUnblurClick}
                        >
                          Click Here to Unblur
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="modal-overlay" onClick={handleEmailModalClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={handleEmailModalClose}>
                ×
              </button>
              <div className="modal-illustration">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <rect x="20" y="30" width="80" height="60" rx="4" fill="#90EE90" />
                  <polygon points="20,30 60,60 100,30" fill="#90EE90" />
                  <polygon points="30,40 60,65 90,40" fill="white" />
                  <circle cx="60" cy="50" r="15" fill="white" />
                  <polygon points="55,50 60,45 65,50 60,55" fill="#90EE90" />
                </svg>
              </div>
              <h2 className="modal-hey-text">HEY YOU!</h2>
              <p className="modal-text">
                Enter your email to enhance your work efficiency by joining us
                today.
              </p>
              <input
                type="email"
                placeholder="Enter Your Email"
                className="modal-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="modal-continue" onClick={handleEmailModalContinue}>
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 3: Unblurred Preview with Actions
  if (currentStep === 3) {
    return (
      <div className="app preview-mode">
        <header className="header">
          <div className="header-logo">
            <span className="logo-icon">●</span>
            <h1 className="logo">DUKIRA</h1>
          </div>
          <div className="header-center">
            <h2 className="header-title">Try-On Preview</h2>
            <p className="header-subtitle">
              Preview your outfit in real-time and adjust as you like.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="header-action-btn download-btn"
              onClick={() => handleActionButton("download")}
              title="Download"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button
              className="header-action-btn hanger-btn"
              onClick={() => handleActionButton("hanger")}
              title="Manage Items"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1-2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <path d="M6 14h12"></path>
              </svg>
            </button>
            <button className="header-close-btn" onClick={handleBackToHome}>×</button>
          </div>
        </header>

        <main className="preview-container">
          <div className="preview-content">
            <div className="image-preview">
              <div className="outfit-display">
                <div className="model-placeholder">
                  {userImage && (
                    <div className="image-wrapper">
                      <img
                        src={userImage}
                        alt="User Upload"
                        className="user-image"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-buttons-container">
              <button
                className="buy-look-btn"
                onClick={() => handleActionButton("buy")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>Buy this look</span>
              </button>
              <button
                className="share-look-btn"
                onClick={() => handleActionButton("share")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>Share this look</span>
              </button>
            </div>

            <p className="try-on-instruction">
              If you want to build your fit, simply add all the items you want
              to try to the cart, then tap the cart to try them on all at once.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Step 4: Register/Login Form
  if (currentStep === 4) {
    return (
      <div className="app">
        <div className="register-modal-overlay">
          <div className="register-modal">
            <button className="register-modal-close" onClick={handleBackToHome}>×</button>
            
            <div className="register-left-panel">
              <h2 className="register-left-title">Get Start With</h2>
              <h1 className="register-left-brand">DUKIRA</h1>
              <p className="register-left-tagline">Experience true to life fitting powered by DUKIRA</p>
              <div className="register-3d-elements">
                <div className="sphere sphere-1"></div>
                <div className="cube cube-1"></div>
                <div className="cube cube-2"></div>
                <div className="sphere sphere-2"></div>
                <div className="speech-bubble">
                  <div className="bubble-dot"></div>
                  <div className="bubble-content">Hello there 👋</div>
                </div>
              </div>
            </div>

            <div className="register-right-panel">
              <div className="register-logo-small">
                <span className="logo-icon">●</span>
              </div>
              <h2 className="register-form-title">Create an account</h2>
              <p className="register-form-subtitle">Create Dukira account to see your look!</p>
              
              <div className="register-toggle">
                <button
                  className={`toggle-btn ${!isLoginMode ? "active" : ""}`}
                  onClick={() => setIsLoginMode(false)}
                >
                  Register
                </button>
                <button
                  className={`toggle-btn ${isLoginMode ? "active" : ""}`}
                  onClick={() => setIsLoginMode(true)}
                >
                  Login
                </button>
              </div>

              {!isLoginMode ? (
                <form className="register-form" onSubmit={(e) => { e.preventDefault(); handleRegisterLogin(); }}>
                  <input
                    type="text"
                    placeholder="Username"
                    className="register-input"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="register-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="register-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="register-input"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                  <button type="submit" className="register-submit-btn">
                    Create Account & Continue
                  </button>
                </form>
              ) : (
                <form className="register-form" onSubmit={(e) => { e.preventDefault(); handleRegisterLogin(); }}>
                  <input
                    type="email"
                    placeholder="Email"
                    className="register-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="register-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <button type="submit" className="register-submit-btn">
                    Login & Continue
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Payment Form
  if (currentStep === 5) {
    return (
      <div className="app">
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <button className="payment-modal-close" onClick={handleBackToHome}>×</button>
            
            <h2 className="payment-title">Add Payment Method</h2>
            <p className="payment-subtitle">
              $0 to add. Your payment method is just being saved; we'll only charge for future use of this feature.
            </p>

            <div className="payment-wallet-buttons">
              <button className="wallet-btn google-pay">
                <span className="wallet-logo">G</span>
                <span>Pay</span>
              </button>
              <button className="wallet-btn apple-pay">
                <span className="wallet-logo">🍎</span>
                <span>Pay</span>
              </button>
            </div>

            <div className="payment-separator">
              <p>or add a card:</p>
              <div className="card-logos">
                <span className="card-logo">VISA</span>
                <span className="card-logo">MC</span>
              </div>
            </div>

            <form className="payment-form" onSubmit={(e) => { e.preventDefault(); handlePaymentContinue(); }}>
              <input
                type="text"
                placeholder="Card Numbrt"
                className="payment-input"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                maxLength="16"
                required
              />
              <input
                type="text"
                placeholder="Card Name"
                className="payment-input"
                value={formData.cardName}
                onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                required
              />
              <div className="payment-row">
                <input
                  type="text"
                  placeholder="Expiry date"
                  className="payment-input payment-input-small"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  maxLength="5"
                  required
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="payment-input payment-input-small"
                  value={formData.cvc}
                  onChange={(e) => setFormData({...formData, cvc: e.target.value})}
                  maxLength="3"
                  required
                />
              </div>
              <button type="submit" className="payment-continue-btn">
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Save Look Modal
  if (currentStep === 6) {
    return (
      <div className="app preview-mode">
        <div className="save-look-modal-overlay">
          <div className="save-look-modal">
            <button className="save-look-back-btn" onClick={() => setCurrentStep(3)}>
              ←
            </button>
            <button className="save-look-close-btn" onClick={handleBackToHome}>×</button>
            
            <h2 className="save-look-title">Save This Look</h2>
            <p className="save-look-subtitle">Make sure it's your perfect fit before you save</p>

            <div className="save-look-content">
              <div className="save-look-image-section">
                {userImage && (
                  <img src={userImage} alt="Your Look" className="save-look-image" />
                )}
              </div>

              <div className="save-look-form-section">
                <h3 className="save-look-form-title">
                  Enter your look name and password to Save Your Look!
                </h3>
                <form className="save-look-form" onSubmit={(e) => { e.preventDefault(); handleSaveLook(); }}>
                  <input
                    type="text"
                    placeholder="Preferred Name"
                    className="save-look-input"
                    value={formData.preferredName}
                    onChange={(e) => setFormData({...formData, preferredName: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (4-digit code)"
                    className="save-look-input"
                    value={formData.savePassword}
                    onChange={(e) => setFormData({...formData, savePassword: e.target.value})}
                    maxLength="4"
                    required
                  />
                  <label className="save-look-checkbox">
                    <input
                      type="checkbox"
                      className="save-look-checkbox-input"
                    />
                    <span>Checking this box will verify your account and save your info for future use. <a href="#" className="read-more-link">Read more</a></span>
                  </label>
                  <button type="submit" className="save-look-submit-btn">
                    Save & Continue
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 7: Your Look Page
  if (currentStep === 7) {
    const savedLooks = [
      {
        id: "#2899",
        name: "Glamour Glasses",
        date: "9 July 2025",
        image: userImage || "https://via.placeholder.com/200"
      },
      {
        id: "#2900",
        name: "Classic White Shirt",
        date: "10 July 2025",
        image: "https://via.placeholder.com/200"
      },
      {
        id: "#2901",
        name: "Blue Denim Jeans",
        date: "11 July 2025",
        image: "https://via.placeholder.com/200"
      }
    ];

    return (
      <div className="app your-look-page">
        <div className="your-look-container">
          <div className="your-look-sidebar">
            <div className="sidebar-logo">
              <span className="logo-icon">●</span>
              <span className="sidebar-logo-text">DUKIRA</span>
            </div>
            <nav className="sidebar-nav">
              <div className="nav-item active">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16"></path>
                </svg>
                <span>Your Look</span>
              </div>
              <div className="nav-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>Payment</span>
              </div>
              <div className="nav-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                </svg>
                <span>Setting</span>
              </div>
            </nav>
          </div>

          <div className="your-look-main">
            <button className="your-look-close-btn" onClick={handleBackToHome}>×</button>
            
            <h1 className="your-look-title">Your Look</h1>
            <p className="your-look-subtitle">Like your own fitting room, anytime you shop.</p>

            <div className="your-look-list">
              {savedLooks.map((look, index) => (
                <div key={index} className="look-card">
                  <div className="look-card-image">
                    <img src={look.image} alt={look.name} />
                  </div>
                  <div className="look-card-content">
                    <h3 className="look-card-name">{look.name}</h3>
                    <p className="look-card-meta">{look.date} • {look.id}</p>
                    <div className="look-card-actions">
                      <button className="look-action-btn view-btn">View</button>
                      <button className="look-action-btn edit-btn">Edit</button>
                      <button className="look-action-btn buy-btn">Buy</button>
                    </div>
                  </div>
                  <button className="look-share-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
