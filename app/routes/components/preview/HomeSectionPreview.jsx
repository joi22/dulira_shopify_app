import React, { useState, useEffect } from "react";
import save1 from '../../_index/media/save-1.jpg';

const HomeSectionPreview = ({
  title = "Bundle Deals",
  backgroundColor = "#fff",
  products = [],
  offers = [],
  showModal = true,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [productsPerView] = useState(2);
  // Use actual products from props, fallback to realistic mock data
  const displayProducts =
    products.length > 0
      ? products
      : [
        {
          id: 1,
          productTitle: "Invisible leg shortening clip, non-slip",
          price: "0.96",
          media: [
            { src: save1 } // FIXED
          ],
        },
        {
          id: 2,
          productTitle: "200M 2000LED Green Wire Fairy Lights",
          price: "3.79",
          originalPrice: "4.10",
          media: [
            {
              src: save1
            }
          ], // FIXED
        },
        {
          id: 3,
          productTitle: "1690pcs Green Racing Building Blocks",
          price: "8.59",
          originalPrice: "9.83",
          media: [
            {
              src: save1
            }
          ],
        },
        {
          id: 4,
          productTitle: "Premium Wireless Headphones",
          price: "199.99",
          media: [
            {
              src: save1
            }
          ],
        },
      ];


  const mockOffers =
    offers.length > 0
      ? offers
      : [
        {
          goalType: "quantity",
          goalQuantity: 2,
          rewardType: "discount",
          discountType: "percentage",
          discountCode: 10,
          goalTextBefore: "Add {{amount_left}} more items to get {{reward}}",
        },
        {
          goalType: "quantity",
          goalQuantity: 4,
          rewardType: "gift",
          goalTextBefore:
            "Add {{amount_left}} more items to unlock {{reward}}",
        },
      ];

  const escapeHtml = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  // Slider functions
  const maxSlides = Math.max(
    0,
    Math.ceil(displayProducts.length / productsPerView) - 1,
  );

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxSlides ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlides : prev - 1));
  };

  // Get visible products for current slide
  const getVisibleProducts = () => {
    const startIndex = currentSlide * productsPerView;
    const endIndex = startIndex + productsPerView;
    return displayProducts.slice(startIndex, endIndex);
  };

  return (
    <div className="home-section-preview">
      <style>{`
        .home-section-preview {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 100%;
          margin: 0 auto;
        }

        .preview-header {
          text-align: center;
          margin-bottom: 20px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        }

        .preview-header h3 {
          margin: 0;
          color: #495057;
          font-size: 16px;
        }

        /* Modern Bundled Offers UI - Exact copy from home.liquid */
        .bundled-offers-container {
          max-width: 1200px;
          margin: 0 auto;
         
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }

        .products-slider {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }

        .slider-container {
          display: flex;
          transition: transform 0.3s ease;
          gap: 20px;
          padding: 10px;
        }

        .product-card {
          flex: 0 0 calc(50% - 10px);
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e0e0e0;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-color: #e91e63;
        }

        .product-image {
          text-align: center;
          margin-bottom: 15px;
        }

        .product-image img {
          width: 100%;
          border-radius: 8px;
          object-fit: cover;
        }

        .product-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    text-align: center;
        }

        .price-section {
          margin-bottom: 12px;
          text-align: center;
        }

        .current-price {
          font-size: 16px;
          font-weight: 700;
          color: #e91e63;
        }

        .old-price {
          text-decoration: line-through;
          color: #888;
          font-size: 14px;
          margin-right: 8px;
        }

        .discount-offer {
          background: #fff6dd;
          border-radius: 8px;
          padding: 8px 10px;
          border: 1px solid #ffd54f;
          text-align: center;
          box-shadow: 0 2px 4px rgba(255, 213, 79, 0.2);
          transition: background 0.2s ease;
          margin-top: 8px;
        }

        .discount-offer:hover {
          background: #ffefb0;
        }

        .discount-offer small {
          font-size: 12px;
          color: #333;
          font-weight: 500;
          line-height: 1.4;
          display: block;
        }

        .slider-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
        }

        .slider-btn {
          background: #333;
          color: white;
          border: none;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slider-btn:hover {
          background: #555;
          transform: scale(1.1);
        }

        /* Responsive Design - Updated for 2 products per view */
        @media (max-width: 1024px) {
          .bundled-offers-container {
          }
          .product-card {
            flex: 0 0 calc(50% - 10px);
            padding: 15px;
          }
          .slider-container {
            gap: 15px;
          }
          .product-image img {
            height: 200px;
          }
          .section-title {
            font-size: 22px;
          }
        }

        @media (max-width: 768px) {
          .bundled-offers-container {
            padding: 12px;
          }
          .product-card {
            flex: 0 0 calc(50% - 8px);
            padding: 12px;
          }
          .slider-container {
            gap: 12px;
          }
          .product-image img {
            height: 180px;
          }
          .product-title {
            font-size: 13px;
            height: 36px;
          }
          .current-price {
            font-size: 15px;
          }
          .discount-offer {
            padding: 6px 8px;
          }
          .discount-offer small {
            font-size: 11px;
          }
          .slider-btn {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
          .section-title {
            font-size: 20px;
            margin-bottom: 15px;
          }
        }

        @media (max-width: 640px) {
          .product-card {
            flex: 0 0 calc(50% - 6px);
            padding: 10px;
          }
          .slider-container {
            gap: 10px;
          }
          .product-image img {
            height: 160px;
          }
          .product-title {
            font-size: 12px;
            height: 32px;
          }
          .current-price {
            font-size: 14px;
          }
          .slider-controls {
            gap: 12px;
            margin-top: 15px;
          }
          .slider-btn {
            width: 35px;
            height: 35px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .bundled-offers-container {
            padding: 10px;
          }
          .product-card {
            flex: 0 0 calc(50% - 4px);
            padding: 12px;
          }
          .slider-container {
            gap: 8px;
          }
          .product-image img {
            height: 140px;
          }
          .product-title {
            font-size: 11px;
            height: 28px;
          }
          .current-price {
            font-size: 13px;
          }
          .discount-offer {
            padding: 6px 8px;
            margin-top: 8px;
          }
          .discount-offer small {
            font-size: 10px;
          }
          .slider-controls {
            gap: 12px;
            margin-top: 15px;
          }
          .slider-btn {
            width: 35px;
            height: 35px;
            font-size: 16px;
          }
          .section-title {
            font-size: 18px;
            margin-bottom: 15px;
          }
        }

        @media (max-width: 360px) {
          .bundled-offers-container {
            padding: 8px;
          }
          .product-card {
            padding: 12px;
          }
          .product-image img {
            height: 180px;
          }
          .product-title {
            font-size: 13px;
          }
          .current-price {
            font-size: 15px;
          }
          .section-title {
            font-size: 16px;
          }
        }

        .preview-note {
          margin-top: 15px;
          padding: 10px;
          background: #e3f2fd;
          border-radius: 6px;
          font-size: 12px;
          color: #1976d2;
          text-align: center;
        }
      `}</style>

      <div className="preview-header">
        <h3>
          🏠 {mockOffers.length} Offer{mockOffers.length !== 1 ? "s" : ""} -
          Explore More Offers
        </h3>
      </div>

      {/* Exact structure matching home.liquid slider */}
      <div className="bundled-offers-container">
        <h1 className="section-title">{title}</h1>

        <div className="products-slider">
          <div className="slider-container">
            {displayProducts.map((product, productIndex) => {

              // ---- FIX TITLE ----
              const productTitle = product.productTitle || product.title || "";

              // ---- FIX MEDIA ----
              let media = "";
              if (product.media) {
                // old API support
                media = Array.isArray(product.media) && product.media[0]?.src
                  ? product.media[0].src
                  : product.media;
              } else if (product.image) {
                // NEW API support (your current dataset)
                media = typeof product.image === "string"
                  ? product.image
                  : product.image.src || "";
              }

              console.log("media:", media);

              const price = parseFloat(product.price) || 0;

              // Show discount details
              let discountHtml = "";
              if (Array.isArray(mockOffers) && mockOffers.length > 0) {
                mockOffers.forEach((offer) => {
                  const max_goal =
                    offer.goalType === "quantity"
                      ? offer.goalQuantity
                      : offer.goalAmount;

                  let rewardText = "";
                  if (offer.rewardType === "discount") {
                    rewardText =
                      offer.discountType === "percentage"
                        ? `${offer.discountCode}% Off`
                        : `${offer.discountCode} Off`;
                  } else if (offer.rewardType === "gift") {
                    rewardText = "Free Product";
                  } else if (offer.rewardType === "shipping") {
                    rewardText = "Free Shipping";
                  }

                  let goalText = (offer.goalTextBefore || "").trim();
                  goalText = goalText
                    .replace(/\{\{\s*amount_left\s*\}\}/gi, max_goal || "")
                    .replace(/\{\{\s*reward\s*\}\}/gi, rewardText || "");

                  discountHtml += `
            <div class="discount-offer">
              <small>${goalText}</small>
            </div>
          `;
                });
              }

              return (
                <div key={productIndex} className="product-card">
                  <div className="product-image">
                    <img src={media} alt={escapeHtml(productTitle)} />
                  </div>

                  <div className="product-info">
                    <h4 className="product-title">{escapeHtml(productTitle)}</h4>

                    <div className="price-section">
                      <strong className="current-price">€{price.toFixed(2)}</strong>
                    </div>

                    <div dangerouslySetInnerHTML={{ __html: discountHtml }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="slider-controls">
            <button className="slider-btn prev-btn" onClick={prevSlide}>‹</button>
            <span className="slide-indicator">
              {currentSlide + 1} / {maxSlides + 1}
            </span>
            <button className="slider-btn next-btn" onClick={nextSlide}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeSectionPreview;
