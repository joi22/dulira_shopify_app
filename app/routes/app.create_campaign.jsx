import React, { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Divider,
  Box,
  Layout,
  Modal,
} from "@shopify/polaris";
import HomeSectionPreview from "./components/preview/HomeSectionPreview";
import {
  GiftCardIcon,
  OrderRepeatIcon,
  HeartIcon,
  ClockIcon,
  ChatIcon,
  InfoIcon,
} from "@shopify/polaris-icons";

const CATEGORIES = [
  {
    type: "upsell",
    title: "Upsell",
    description: "Encourage customers to upgrade or add higher-value products.",
    icon: GiftCardIcon,
    image: "/imags/upsell.jpg",
  },
  {
    type: "cross_sell",
    title: "Cross-sell",
    description: "Suggest complementary products to increase order value.",
    icon: OrderRepeatIcon,
    image: "/imags/cross-sell.jpg",
  },
  {
    type: "loyalty",
    title: "Loyalty",
    description:
      "Reward customers for purchases to build long-term relationships.",
    icon: HeartIcon,
    image: "/imags/loyalty.jpg",
  },
  {
    type: "urgency",
    title: "Urgency",
    description: "Motivate quick purchases with time-sensitive offers.",
    icon: ClockIcon,
    image: "/imags/Urgency.jpg",
  },
  {
    type: "engagement",
    title: "Engagement",
    description: "Boost customer interaction with personalized experiences.",
    icon: ChatIcon,
    image: "/imags/engagement.jpg",
  },
];

const CAMPAIGN_CARDS = [
  {
    id: 1,
    title: "BOGO",
    type: "buy_one_get_one",
    url: "addtounlock",
    description: "Buy One, Get One Free or Discounted",
    category: "upsell",
    thumbnail: "🛍",
    tutorialLink: "https://example.com/bogo-tutorial",
  },
  {
    id: 2,
    title: "Add to Unlock",
    type: "add_to_unlock",
    url: "addtounlock",
    description:
      "Encourage adding more items to unlock rewards, such as discounts, free gifts, or free shipping",
    category: "upsell",
    thumbnail: "🎁",
    tutorialLink: "",
  },
  {
    id: 3,
    title: "Buy More, Save More",
    type: "buy_more_save_more",
    url: "addtounlock",
    description: "Bulk pricing tiers",
    category: "upsell",
    thumbnail: "📦",
    tutorialLink: "https://example.com/buy-more-save-more-tutorial",
  },
  {
    id: 4,
    title: "Frequently Bought Together",
    type: "checkout_upsell",
    url: "addtounlock",
    description: "Smart product bundles",
    category: "cross_sell",
    thumbnail: "🤝",
    tutorialLink: "https://example.com/fbt-tutorial",
  },
  {
    id: 5,
    title: "Checkout Upsell",
    type: "checkout_upsell",
    url: "addtounlock",
    description: "Quick offers during checkout",
    category: "cross_sell",
    thumbnail: "⚡",
    tutorialLink: "https://example.com/checkout-upsell-tutorial",
  },
  {
    id: 6,
    title: "Order Bump",
    type: "order_bump",
    url: "addtounlock",
    description: "Add-ons like insurance, priority, etc.",
    category: "cross_sell",
    thumbnail: "📌",
    tutorialLink: "https://example.com/order-bump-tutorial",
  },
  {
    id: 7,
    title: "Post-Purchase Offer",
    type: "post_purchase",
    url: "addtounlock",
    description: "Shown after order confirmation",
    category: "loyalty",
    thumbnail: "🧾",
    tutorialLink: "https://example.com/post-purchase-tutorial",
  },
  {
    id: 8,
    title: "Volume Discounts",
    type: "buy_more_save_more",
    url: "addtounlock",
    description: "Tiered discounts based on quantity",
    category: "loyalty",
    thumbnail: "💰",
    tutorialLink: "https://example.com/volume-discounts-tutorial",
  },
  {
    id: 9,
    title: "Limited Time Offer",
    type: "urgency",
    url: "addtounlock",
    description: "Time-sensitive offers with countdown",
    category: "urgency",
    thumbnail: "⏰",
    tutorialLink: "https://example.com/limited-time-tutorial",
  },
  {
    id: 10,
    title: "Flash Sale",
    type: "urgency",
    url: "addtounlock",
    description: "Quick flash sales with urgency",
    category: "urgency",
    thumbnail: "⚡",
    tutorialLink: "https://example.com/flash-sale-tutorial",
  },
  {
    id: 11,
    title: "Personalized Recommendations",
    type: "engagement",
    url: "addtounlock",
    description: "AI-powered product suggestions",
    category: "engagement",
    thumbnail: "🤖",
    tutorialLink: "https://example.com/personalized-tutorial",
  },
  {
    id: 12,
    title: "Interactive Quiz",
    type: "engagement",
    url: "addtounlock",
    description: "Engage customers with interactive content",
    category: "engagement",
    thumbnail: "🎯",
    tutorialLink: "https://example.com/quiz-tutorial",
  },
];

const CampaignCard = ({
  card,
  index,
  campaignName,
  onSelect,
  selectedCard,
}) => {
  const handleSelect = () => {
    onSelect(card);
  };

  const isSelected = selectedCard?.id === card.id;

  const getCardImage = () => {
    switch (card.type) {
      case "buy_one_get_one":
        return "/app/routes/_index/media/bogo.jpg";
      case "add_to_unlock":
        return "/app/routes/_index/media/add_to_lock.png";
      case "buy_more_save_more":
        return "/app/routes/_index/media/save-2.png";
      case "checkout_upsell":
        return "/app/routes/_index/media/save-1.jpg";
      case "order_bump":
        return "/app/routes/_index/media/shipping.png";
      case "post_purchase":
        return "/app/routes/_index/media/gift.png";
      default:
        return "/app/routes/_index/media/disc.png";
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: "8px",
        border: isSelected ? "2px solid #5c6ac4" : "1px solid #e1e3e5",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "320px",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
        cursor: "pointer",
        boxShadow: isSelected
          ? "0 4px 12px rgba(92, 106, 196, 0.15)"
          : "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
      onClick={handleSelect}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {/* Info Icon - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Handle info click
        }}
      ></div>

      {/* Illustration Section */}
      <div
        style={{
          width: "100%",
          height: "160px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          backgroundColor: "#f9f9f9",
          borderRadius: "6px",
          padding: "12px",
        }}
      >
        <img
          src={getCardImage()}
          alt={card.title}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Title */}
      <BlockStack>
        <Text variant="headingSm" fontWeight="bold">
          {card.title}
        </Text>
        <InlineStack align="space-between" blockAlign="center" gap={"200"}>
          <Text variant="bodySm" tone="subdued">
            {card.description}
          </Text>
          <InfoIcon width="16px" height="16px" />
        </InlineStack>
      </BlockStack>
    </div>
  );
};

const Placment_Postion = [
  {
    id: 1,
    title: "Home",
    description: "Display on your store's homepage",
    thumbnail: "🏠",
    icon: "/imags/home.png",
    color: "#5c6ac4",
    backgroundColor: "#f5f5f5",
    textColor: "#333",
    borderColor: "#e1e3e5",
    borderRadius: "8px",
  },
  {
    id: 2,
    title: "Page",
    description: "Display on your store's page",
    thumbnail: "📄",
    icon: "/imags/product_page.png",
    color: "#5c6ac4",
    backgroundColor: "#f5f5f5",
    textColor: "#333",
  },
  {
    id: 3,
    title: "Cart",
    description: "Display on your store's cart page",
    thumbnail: "🛒",
    icon: "/imags/cart.png",
    color: "#5c6ac4",
    backgroundColor: "#f5f5f5",
    textColor: "#333",
  },
];

const getAvailablePlacements = (campaignType) => {
  const allPlacements = Placment_Postion;

  switch (campaignType) {
    case "post_purchase":
      return allPlacements.filter(
        (p) => p.title === "Page" || p.title === "Cart",
      );
    case "checkout_upsell":
    case "order_bump":
      return allPlacements.filter((p) => p.title === "Cart");
    default:
      return allPlacements;
  }
};

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [placement, setPlacement] = useState("");
  const [dealType, setDealType] = useState("");
  const [currentProgress] = useState(1); // Mock progress for preview

  // Debug effect
  useEffect(() => {
    console.log("selectedCategory changed:", selectedCategory);
  }, [selectedCategory]);

  // Reset placement when campaign type changes
  useEffect(() => {
    if (selectedCard) {
      const availablePlacements = getAvailablePlacements(selectedCard.type);
      // Reset placement if current selection is not available for new campaign type
      if (
        placement &&
        !availablePlacements.some((p) => {
          const placementValue =
            p.title === "Home" ? "home" : p.title === "Page" ? "Page" : "cart";
          return placement === placementValue;
        })
      ) {
        setPlacement("");
      }
    }
  }, [selectedCard, placement]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedCategory(null);
    } else if (step === 3) {
      setStep(2);
      setSelectedCard(null);
      setPlacement("");
      setDealType("");
      setCampaignName("");
    }
  };

  const handleCardSelect = (card) => {
    console.log("Campaign card selected:", card);
    console.log("Card type:", card.type);
    setSelectedCard(card);
    setStep(3); // Goes to configuration page
  };

  const handleFinalSubmit = () => {
    if (!campaignName.trim() || !placement || !dealType) {
      alert(
        "Please fill in all required fields: Campaign Name, Placement, and Deal Type",
      );
      return;
    }
    // Navigate to addtounlock page with all parameters
    navigate(
      `/app/addtounlock?type=${selectedCard.type}&name=${campaignName}&dealType=${dealType}&placement=${placement}`,
    );
  };

  // Mock data for preview
  const previewProducts = [
    {
      id: 1,
      title: "The Collection Snowboard: Liquid",
      price: "749.95",
      media: "/imags/new_3.jpg",
    },
    {
      id: 2,
      title: "Summer T-Shirt Bundle",
      price: "49.99",
      media: "/imags/new_2.jpg",
    },
    {
      id: 3,
      title: "Summer PANTS Bundle",
      price: "49.99",
      media: "/imags/new_1.jpg",
    },
  ];

  // Mock offers for preview
  const mockOffers = [
    {
      id: Date.now(),
      goalType: "quantity",
      goalquantity: "2",
      goalAmount: "50",
      currency: "USD",
      rewardType: "discount",
      rewardMode: dealType || "fixed",
      discountCode: "10",
      discountType: "percentage",
      goalTextBefore: "Add {{amount_left}} to unlock {{reward}}!",
      goalTextAfter: "🎉 You've unlocked {{reward}}!",
      rewardProducts: [],
    },
  ];

  // Render preview based on placement
  const renderPreview = () => {
    if (!placement) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Text>Please select a placement to see the preview.</Text>
        </div>
      );
    }

    if (placement === "home") {
      return (
        <div style={{ padding: "20px" }}>
          <HomeSectionPreview
            title="Bundle Deals"
            backgroundColor="#fff"
            products={previewProducts}
            offers={mockOffers}
            showModal={true}
          />
        </div>
      );
    } else if (placement === "Page") {
      return (
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "20px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
          }}
        >
          <style>{`
            .preview-container {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 15px 0;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              border: 1px solid #eaeaea;
            }
            .main-title {
              text-align: center;
              font-size: 16px;
              margin: 15px 0;
              color: #333;
              font-weight: 500;
            }
            .progress-bar {
              width: 100%;
              background: #F5F5F5;
              height: 12px;
              border-radius: 15px;
              overflow: hidden;
              margin: 20px 0;
            }
            .progress-fill {
              background: #4CAF50;
              height: 100%;
              width: 30%;
              transition: width 0.3s ease;
            }
            .product-grid {
              display: flex;
              gap: 15px;
              margin: 20px 0;
              overflow-x: auto;
            }
            .product-card {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 15px;
              border-radius: 8px;
              background: #f9f9f9;
              min-width: 150px;
            }
            .product-image {
              width: 100px;
              height: 100px;
              object-fit: contain;
              margin-bottom: 10px;
            }
            .product-title {
              font-size: 14px;
              text-align: center;
              margin-bottom: 8px;
            }
            .product-price {
              font-size: 16px;
              font-weight: bold;
              color: #2c5aa0;
              margin-bottom: 12px;
            }
            .add-btn {
              padding: 10px 15px;
              background: #000;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              width: 100%;
            }
          `}</style>
          <div className="preview-container">
            <div className="main-title">
              Add 1 more item to unlock 10% Discount!
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <div className="product-grid">
              {previewProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={product.media}
                    alt={product.title}
                    className="product-image"
                  />
                  <div className="product-title">{product.title}</div>
                  <div className="product-price">${product.price}</div>
                  <button className="add-btn">ADD</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (placement === "cart") {
      return (
        <div style={{ padding: "20px" }}>
          <style>{`
            .cart-drawer {
              background: #fff;
              border-radius: 16px;
              padding: 20px;
              max-width: 500px;
              margin: 0 auto;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .cart-title {
              font-size: 1.2rem;
              font-weight: 700;
              text-align: center;
              margin-bottom: 20px;
            }
            .discount-title {
              font-size: 1rem;
              font-weight: 700;
              margin-bottom: 12px;
              text-align: center;
            }
            .progress-bar {
              background: #F5F5F5;
              width: 100%;
              height: 12px;
              border-radius: 15px;
              margin: 20px 0;
              overflow: hidden;
            }
            .progress-fill {
              background: #4CAF50;
              height: 100%;
              width: 30%;
            }
            .cart-item {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #eee;
            }
            .cart-item-image {
              width: 80px;
              height: 80px;
              margin-right: 12px;
            }
            .cart-item-image img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .cart-item-title {
              font-weight: 600;
              margin-bottom: 4px;
            }
            .cart-item-price {
              font-weight: 600;
              color: #5c6ac4;
            }
            .checkout {
              background: #5c6ac4;
              border: none;
              color: #fff;
              width: 100%;
              padding: 15px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 18px;
              cursor: pointer;
              margin-top: 20px;
            }
          `}</style>
          <div className="cart-drawer">
            <div className="cart-title">Your Cart</div>
            <div className="discount-title">
              Add 1 more item to unlock 10% Discount!
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            {previewProducts.slice(0, 2).map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.media} alt={item.title} />
                </div>
                <div>
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-price">${item.price}</div>
                </div>
              </div>
            ))}
            <button className="checkout">Checkout . $799.94</button>
          </div>
        </div>
      );
    }

    return null;
  };

  const steps = [
    {
      number: 1,
      title: "Category",
      active: step >= 1,
      completed: step > 1,
    },
    {
      number: 2,
      title: "Campaign Type",
      active: step >= 2,
      completed: step > 2,
    },
    {
      number: 3,
      title: "Offer Type, Campaign Name & Placement",
      active: step >= 3,
      completed: step > 3,
    },
  ];

  return (
    <Page
      fullWidth
      backAction={{
        content: "Back to Upsell Engine",
        onAction: () => navigate("/app/upsell_engine"),
      }}
      title="Create New Campaign"
    >
      <style>{`
        .category-card-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .category-card-wrapper:hover {
          transform: translateY(-8px);
        }
        .category-card-wrapper:hover .Polaris-Card {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        .category-card-wrapper:active {
          transform: translateY(-4px);
        }
        .Polaris-Page {
          background-color: #f5f5f5;
        }
        .Polaris-Layout {
          background-color: #f5f5f5;
        }
        @media (max-width: 1200px) {
          .config-layout {
            grid-template-columns: 1fr !important;
          }
          .preview-column {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
      <Layout sectioned padding="400">
        <Layout.Section>
          {step === 1 && (
            <div>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" fontWeight="bold">
                    Step 1: Choose Category
                  </Text>
                </InlineStack>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                    width: "100%",
                    padding: "20px 0",
                  }}
                >
                  {CATEGORIES.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <div
                        key={cat.type}
                        className="category-card-wrapper"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setStep(2);
                        }}
                        style={{
                          cursor: "pointer",
                          position: "relative",
                          borderRadius: "8px",
                          background: "#fff",
                          border:
                            selectedCategory?.type === cat.type
                              ? "2px solid #5c6ac4"
                              : "1px solid #e1e3e5",
                          transition: "all 0.3s ease",
                          transform:
                            selectedCategory?.type === cat.type
                              ? "translateY(-4px)"
                              : "translateY(0)",
                          boxShadow:
                            selectedCategory?.type === cat.type
                              ? "0 8px 16px rgba(92, 106, 196, 0.2)"
                              : "0 2px 8px rgba(0, 0, 0, 0.08)",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          minHeight: "280px",
                          padding: "24px",
                        }}
                      >
                        {/* Question Mark Icon - Top Right */}
                        <div
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle info click
                          }}
                        >
                          <InfoIcon width="14px" height="14px" />
                        </div>

                        {/* Icon/Illustration Section - Centered */}
                        <div
                          style={{
                            width: "100%",
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                            padding: "20px 0",
                          }}
                        >
                          <div
                            style={{
                              width: "120px",
                              height: "120px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#f9f9f9",
                              borderRadius: "8px",
                            }}
                          >
                            <IconComponent width="64px" height="64px" />
                          </div>
                        </div>

                        {/* Title Section */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <Text
                            variant="headingMd"
                            fontWeight="bold"
                            style={{
                              color: "#202223",
                            }}
                          >
                            {cat.title}
                          </Text>
                          <Text
                            variant="bodySm"
                            tone="subdued"
                            style={{
                              color: "#6d7175",
                              lineHeight: "1.4",
                            }}
                          >
                            {cat.description}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </BlockStack>
            </div>
          )}

          {step === 2 && (
            <div>
              <Card sectioned>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Button variant="plain" onClick={handleBack}>
                      ← Back to Category
                    </Button>
                    <Text variant="headingMd" fontWeight="bold">
                      Step 2: Choose Campaign Type
                    </Text>
                    <div style={{ width: "80px" }}></div>
                  </InlineStack>
                </BlockStack>
              </Card>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "20px",
                  width: "100%",
                  padding: "20px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                  marginTop: "20px",
                }}
              >
                {CAMPAIGN_CARDS.filter(
                  (card) => card.category === selectedCategory.type,
                ).map((card) => (
                  <CampaignCard
                    key={card.id}
                    card={card}
                    campaignName={campaignName}
                    onSelect={handleCardSelect}
                    selectedCard={selectedCard}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <InlineStack align="space-between" blockAlign="center">
                  <Button variant="plain" onClick={handleBack}>
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleFinalSubmit}
                    disabled={!campaignName.trim() || !placement || !dealType}
                  >
                    Create Campaign
                  </Button>
                </InlineStack>
              </div>

              {/* Two-column layout: Configuration on left, Preview on right */}
              <div
                className="config-layout"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                {/* Left Column: Configuration Options */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    marginBottom:"20px"
                  }}
                >
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text variant="headingSm" fontWeight="bold">
                        Campaign Name
                      </Text>
                      <TextField
                        label="Campaign Name"
                        value={campaignName}
                        onChange={setCampaignName}
                        placeholder="e.g., Summer Free Gift Offer"
                        requiredIndicator
                      />
                    </BlockStack>
                  </Card>

                  <Card sectioned>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingSm" fontWeight="bold">
                          Campaign Placement
                        </Text>
                        <Text
                          variant="bodySm"
                          tone="subdued"
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Need help? Learn when each funnel shows.
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        Select where you want to display this campaign
                      </Text>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: "12px",
                          width: "100%",
                          padding: "20px 0",
                        }}
                      >
                        {getAvailablePlacements(selectedCard?.type).map(
                          (item) => {
                            // Map array titles to placement values
                            const placementValue =
                              item.title === "Home"
                                ? "home"
                                : item.title === "Page"
                                  ? "Page"
                                  : "cart";
                            const isSelected = placement === placementValue;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setPlacement(placementValue)}
                                style={{
                                  cursor: "pointer",
                                  position: "relative",
                                  borderRadius: "8px",
                                  border: isSelected
                                    ? "2px solid #5c6ac4"
                                    : "1px solid #e1e3e5",
                                  background: "#ffffff",
                                  padding: "20px 16px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "12px",
                                  transition: "all 0.2s ease",
                                  minHeight: "120px",
                                  boxShadow: isSelected
                                    ? "0 2px 8px rgba(92, 106, 196, 0.15)"
                                    : "none",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor =
                                      "#c9cccf";
                                    e.currentTarget.style.boxShadow =
                                      "0 1px 3px rgba(0, 0, 0, 0.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor =
                                      "#e1e3e5";
                                    e.currentTarget.style.boxShadow = "none";
                                  }
                                }}
                              >
                                {/* Icon */}
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#202223",
                                  }}
                                >
                                  {item.thumbnail ? (
                                    <span style={{ fontSize: "32px" }}>
                                      {item.thumbnail}
                                    </span>
                                  ) : (
                                    <img
                                      src={item.icon}
                                      alt={item.title}
                                      style={{
                                        width: "48px",
                                        height: "48px",
                                        objectFit: "contain",
                                        filter:
                                          "grayscale(100%) brightness(0.3)",
                                      }}
                                    />
                                  )}
                                </div>
                                {/* Label */}
                                <Text
                                  variant="bodySm"
                                  fontWeight="medium"
                                  style={{
                                    color: "#202223",
                                    textAlign: "center",
                                  }}
                                >
                                  {item.title === "Page"
                                    ? "Product Page"
                                    : item.title === "Cart"
                                      ? "Cart Page"
                                      : item.title + " Page"}
                                </Text>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </BlockStack>
                  </Card>
<div style={{marginBottom:"20px"}}>

                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text variant="headingSm" fontWeight="bold">
                        Offer Type
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        Choose the type of deal you want to create. This will
                        determine how rewards are configured.
                      </Text>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "20px",
                          marginTop: "10px",
                        }}
                      >
                        {/* Fixed Deal Card */}
                        <div
                          style={{
                            background: "#fff",
                            border:
                              dealType === "fixed"
                                ? "2px solid #5c6ac4"
                                : "2px solid #e1e1e1",
                            borderRadius: "14px",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onClick={() => setDealType("fixed")}
                        >
                          <div
                            style={{
                              width: "70px",
                              height: "70px",
                              borderRadius: "10px",
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "30px",
                              marginBottom: "12px",
                            }}
                          >
                            🔒
                          </div>
                          <Text variant="headingSm">Fixed Deal</Text>
                          <Text
                            tone="subdued"
                            variant="bodySm"
                            alignment="center"
                          >
                            Set fixed discounts and offers
                          </Text>
                        </div>

                        {/* Flame Match Card */}
                        <div
                          style={{
                            background: "#fff",
                            border:
                              dealType === "flame"
                                ? "2px solid #5c6ac4"
                                : "2px solid #e1e1e1",
                            borderRadius: "14px",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onClick={() => setDealType("flame")}
                        >
                          <div
                            style={{
                              width: "70px",
                              height: "70px",
                              borderRadius: "10px",
                              background:
                                "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "30px",
                              marginBottom: "12px",
                            }}
                          >
                            🔥
                          </div>
                          <Text variant="headingSm">Flame Match</Text>
                          <Text
                            tone="subdued"
                            variant="bodySm"
                            alignment="center"
                          >
                            Dynamic matching and recommendations
                          </Text>
                        </div>
                      </div>
                    </BlockStack>
                  </Card>
</div>
                </div>

                {/* Right Column: Sticky Live Preview */}
                <div
                  className="preview-column"
                  style={{
                    position: "sticky",
                    top: "20px",
                    maxHeight: "calc(100vh - 40px)",
                    overflowY: "auto",
                  }}
                 >
                  <Card sectioned >
                    <BlockStack gap="300">
                      <Text variant="headingSm" fontWeight="bold">
                        Live Preview
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        {placement
                          ? `Preview: ${placement === "home" ? "Homepage" : placement === "Page" ? "Product Page" : "Cart Page"}`
                          : "Select a placement to see the preview"}
                      </Text>
                      <div
                        style={{
                          minHeight: "400px",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "8px",
                          padding: "10px",
                        }}
                      >
                        {renderPreview()}
                      </div>
                    </BlockStack>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
