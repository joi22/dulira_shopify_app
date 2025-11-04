import { useState } from "react";
import "./App.css";

function App() {
  const [userImage, setUserImage] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false); // Modal for Try-On upload
  const [showQRModal, setShowQRModal] = useState(false); // Modal for QR Scanner
  const [qrImageError, setQrImageError] = useState(false); // Track QR code image error
  const [currentStep, setCurrentStep] = useState(1); // 1: Initial, 2: Preview, 3: Final Step

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setIsPreviewMode(true);
      setIsBlurred(true); // start blurred
      setCurrentStep(2); // Move to step 2 (Preview)
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setIsPreviewMode(true);
      setIsBlurred(true);
      setCurrentStep(2);
      setShowTryOnModal(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUntier = () => {
    setIsPreviewMode(false);
    setUserImage(null);
    setCurrentStep(1); // Back to step 1
  };

  const handleUnblurClick = () => {
    setShowModal(true); // show popup before unblur
  };

  const handleModalContinue = () => {
    setShowModal(false);
    setIsBlurred(false); // unblur after user continues
    setCurrentStep(3); // Move to step 3
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleBuyLook = () => {
    alert("Redirecting to purchase page...");
    // Add your buy logic here
  };

  const handleShareLook = () => {
    alert("Sharing this look...");
    // Add your share logic here
  };

  if (currentStep === 1) {
    // Step 1: Initial Page with Try-On Button
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
                      onChange={(e) => {
                        handleImageUpload(e);
                        setShowTryOnModal(false);
                      }}
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
                  {/* QR Code - Replace ./media/qr-code.png with your actual QR code image */}
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
                      {/* QR Code Pattern - Placeholder */}
                      <rect width="200" height="200" fill="white" />
                      {/* Position markers */}
                      <rect x="10" y="10" width="50" height="50" fill="black" />
                      <rect x="15" y="15" width="40" height="40" fill="white" />
                      <rect x="20" y="20" width="30" height="30" fill="black" />

                      <rect
                        x="140"
                        y="10"
                        width="50"
                        height="50"
                        fill="black"
                      />
                      <rect
                        x="145"
                        y="15"
                        width="40"
                        height="40"
                        fill="white"
                      />
                      <rect
                        x="150"
                        y="20"
                        width="30"
                        height="30"
                        fill="black"
                      />

                      <rect
                        x="10"
                        y="140"
                        width="50"
                        height="50"
                        fill="black"
                      />
                      <rect
                        x="15"
                        y="145"
                        width="40"
                        height="40"
                        fill="white"
                      />
                      <rect
                        x="20"
                        y="150"
                        width="30"
                        height="30"
                        fill="black"
                      />

                      {/* Data pattern */}
                      <rect x="70" y="10" width="10" height="10" fill="black" />
                      <rect x="90" y="10" width="10" height="10" fill="black" />
                      <rect
                        x="110"
                        y="10"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect x="10" y="70" width="10" height="10" fill="black" />
                      <rect x="30" y="70" width="10" height="10" fill="black" />
                      <rect x="50" y="70" width="10" height="10" fill="black" />
                      <rect x="70" y="70" width="50" height="50" fill="black" />
                      <rect x="80" y="80" width="30" height="30" fill="white" />
                      <rect x="90" y="90" width="10" height="10" fill="black" />
                      <rect
                        x="130"
                        y="70"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="150"
                        y="70"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="170"
                        y="70"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="70"
                        y="130"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="90"
                        y="130"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="110"
                        y="130"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="130"
                        y="130"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="150"
                        y="130"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="170"
                        y="130"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="10"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="30"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="50"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="70"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="90"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="110"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="130"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="150"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
                      <rect
                        x="170"
                        y="170"
                        width="10"
                        height="10"
                        fill="black"
                      />
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
                  onChange={(e) => {
                    handleImageUpload(e);
                    setShowQRModal(false);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 2) {
    // Step 2: Preview Page (Blurred)
    return (
      <div className="app preview-mode">
        <header className="header">
          <h1 className="logo">DUKIRA</h1>
        </header>

        <main className="preview-container">
          <div className="preview-header">
            <h2>Try-On Preview</h2>
            <p className="preview-subtitle">
              Preview your outfit in real-time and adjust as you like.
            </p>
          </div>

          <div className="preview-content">
            <div className="image-preview">
              <div className="outfit-display">
                <div className="model-placeholder">
                  {userImage && (
                    <div className="image-wrapper">
                      <img
                        src={userImage}
                        alt="User Upload"
                        className={`user-image ${isBlurred ? "blurred" : ""}`}
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

            <div className="untier-section">
              <button className="untier-btn" onClick={handleUntier}>
                Click Here to Untier
              </button>
            </div>
          </div>
        </main>

        {/* Modal Popup */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <button className="modal-close" onClick={handleModalClose}>
                ×
              </button>
              <img src="./media/2p.png" alt="email" className="modal-image" />
              <p className="modal-text">
                Enter your email to enhance your work efficiency by joining us
                today.
              </p>
              <input
                type="email"
                placeholder="Enter Your Email"
                className="modal-input"
              />
              <button className="modal-continue" onClick={handleModalContinue}>
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 3: Final Step (Unblurred with action buttons)
  return (
    <div className="app preview-mode">
      <header className="header">
        <h1 className="logo">DUKIRA</h1>
      </header>

      <main className="preview-container">
        <div className="preview-header">
          <h2>Try-On Preview</h2>
          <p className="preview-subtitle">
            Preview your outfit in real-time and adjust as you like.
          </p>
        </div>

        <div className="preview-content">
          <div className="image-preview">
            <div className="outfit-display">
              <div className="model-placeholder">
                {userImage && (
                  <div className="image-wrapper-3">
                    <img
                      src={userImage}
                      alt="User Upload"
                      className="user-image"
                    />

                    {/* Step 3 Action Buttons */}
                    <div className="step3-actions">
                      <button
                        className="action-btn buy-btn"
                        onClick={handleBuyLook}
                      >
                        Buy this look
                      </button>
                      <button
                        className="action-btn share-btn"
                        onClick={handleShareLook}
                      >
                        Share this look
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="untier-section">
            <button className="untier-btn" onClick={handleUntier}>
              Click Here to Untier
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
