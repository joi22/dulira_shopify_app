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
  ChoiceList,
} from "@shopify/polaris";
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
    tutorialLink: "https://example.com/add-to-unlock-tutorial",
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
        return "/app/routes/_index/media/addtounlock.png";
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

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [placement, setPlacement] = useState("");
  const [dealType, setDealType] = useState("");

  const handleNext = () => {
    if (step === 1 && selectedCategory) {
      setStep(2);
    } else if (step === 2 && selectedCard) {
      setStep(3);
    } else if (step === 3 && campaignName.trim()) {
      setStep(4);
    }
  };

  // Debug effect
  useEffect(() => {
    console.log("selectedCategory changed:", selectedCategory);
  }, [selectedCategory]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedCategory(null);
    } else if (step === 3) {
      setStep(2);
      setSelectedCard(null);
    } else if (step === 4) {
      setStep(3);
    }
  };

  const handleCardSelect = (card) => {
    console.log("Campaign card selected:", card);
    console.log("Card type:", card.type);
    setSelectedCard(card);
    setStep(3);
  };

  const handleFinalSubmit = () => {
    if (!campaignName.trim() || !placement || !dealType) {
      alert("Please fill in all required fields");
      return;
    }
    // Navigate to addtounlock page with all parameters
    navigate(
      `/app/addtounlock?type=${selectedCard.type}&name=${campaignName}&dealType=${dealType}&placement=${placement}`,
    );
  };

  const steps = [
    {
      number: 1,
      title: "Campaign Name",
      active: step >= 1,
      completed: step > 1,
    },
    { number: 2, title: "Category", active: step >= 2, completed: step > 2 },
    {
      number: 3,
      title: "Campaign Type",
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
      `}</style>
      <Layout sectioned padding="400">
        <Layout.Section>
          {step === 1 && (
            <Card padding={"500"} sectioned>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" fontWeight="bold">
                    Step 1: Choose Category
                  </Text>
                </InlineStack>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "24px",
                    width: "100%",
                    padding: "20px 0",
                  }}
                >
                  {CATEGORIES.map((cat) => (
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
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        transform:
                          selectedCategory?.type === cat.type
                            ? "translateY(-4px)"
                            : "translateY(0)",
                        boxShadow:
                          selectedCategory?.type === cat.type
                            ? "0 8px 16px rgba(92, 106, 196, 0.2)"
                            : "0 2px 8px rgba(0, 0, 0, 0.08)",
                        border:
                          selectedCategory?.type === cat.type
                            ? "2px solid #5c6ac4"
                            : "none",
                      }}
                    >
                      {/* Image Section - Full Width */}
                      <div
                        style={{
                          width: "100%",
                          height: "280px",
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <img
                          src={cat.image}
                          alt={cat.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        />
                      </div>

                      {/* Content Section - Overlay on Image */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                          padding: "20px 16px 16px",
                          color: "#fff",
                        }}
                      >
                        <Text
                          variant="headingLg"
                          fontWeight="bold"
                          style={{
                            color: "#fff",
                            marginBottom: "8px",
                            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          }}
                        >
                          {cat.title}
                        </Text>
                        <Text
                          variant="bodyMd"
                          style={{
                            color: "rgba(255,255,255,0.9)",
                            lineHeight: "1.4",
                            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          }}
                        >
                          {cat.description}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </BlockStack>
            </Card>
          )}

          {/* Step 2: Choose Campaign Type (Feature Card) */}
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

          {/* Step 3: Campaign Name */}
          {step === 3 && (
            <Card sectioned>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Button variant="plain" onClick={handleBack}>
                    ← Back
                  </Button>
                  <Text variant="headingMd" fontWeight="bold">
                    Step 3: Name Your Campaign
                  </Text>
                </InlineStack>
                <TextField
                  label="Campaign Name"
                  value={campaignName}
                  onChange={setCampaignName}
                  placeholder="e.g., Summer Free Gift Offer"
                  requiredIndicator
                  autoFocus
                />
                <InlineStack align="end">
                  <Button
                    primary
                    onClick={handleNext}
                    disabled={!campaignName.trim()}
                  >
                    Next: Configure Settings
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          )}

          {step === 4 && (
            <Card sectioned>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Button variant="plain" onClick={handleBack}>
                    ← Back
                  </Button>
                  <Text variant="headingMd" fontWeight="bold">
                    Step 4: Configure Settings
                  </Text>
                </InlineStack>

                <Card sectioned>
                  <BlockStack gap="300">
                    <Text variant="headingSm" fontWeight="bold">
                      Campaign Placement
                    </Text>
                    <ChoiceList
                      title="Select Campaign Placement"
                      choices={[
                        { label: "Homepage", value: "home" },
                        { label: "Product Page", value: "Page" },
                        { label: "Cart Page", value: "cart" },
                      ]}
                      selected={[placement]}
                      onChange={(value) => setPlacement(value[0] || "")}
                    />
                  </BlockStack>
                </Card>

                <Card sectioned>
                  <BlockStack gap="300">
                    <Text variant="headingSm" fontWeight="bold">
                      Offer Type
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      Choose the type of deal you want to create
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

                <InlineStack align="end">
                  <Button
                    primary
                    onClick={handleFinalSubmit}
                    disabled={!placement || !dealType}
                  >
                    Create Campaign
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
