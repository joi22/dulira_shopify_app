import { useState } from "react";
import "./App.css";

function App() {
  const [userImage, setUserImage] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setIsPreviewMode(true);
      setIsBlurred(true); // start blurred
    }
  };

  const handleUntier = () => {
    setIsPreviewMode(false);
    setUserImage(null);
  };

  const handleUnblurClick = () => {
    setShowModal(true); // show popup before unblur
  };

  const handleModalContinue = () => {
    setShowModal(false);
    setIsBlurred(false); // unblur after user continues
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  if (!isPreviewMode) {
    // Upload Page
    return (
      <div className="app">
        <main className="main-content">
          <div className="try-on-section">
            <div className="upload-area">
              <h3>Try On This Look</h3>
              <p className="subtitle">See how this product looks on you</p>

              <div className="drag-drop-area">
                <div className="drag-drop-content">
                  <div className="upload-icon">
                    <img width="150px" src="./media/1p.png" alt="upload" />
                  </div>
                  <p className="drag-text">DRAG OR DROP YOUR IMAGE</p>
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
                    <button>Scan QR code with your phone</button>
                    <p>Scan to choose a photo from your phone</p>
                    <p className="note">
                      Your try-on will take some time to process
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Preview Page
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
                      <button className="center-button" onClick={handleUnblurClick}>
                        Click Here to Unblur
                      </button>
                    )}

                    {!isBlurred && (
                      <button className="center-button" onClick={() => setIsBlurred(true)}>
                        Click Here to Blur Again
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
              Enter your email to enhance your work efficiency by joining us today.
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

export default App;
