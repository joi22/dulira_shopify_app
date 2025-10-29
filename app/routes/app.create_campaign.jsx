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
  },
  {
    type: "cross_sell",
    title: "Cross-sell",
    description: "Suggest complementary products to increase order value.",
    icon: OrderRepeatIcon,
  },
  {
    type: "loyalty",
    title: "Loyalty",
    description:
      "Reward customers for purchases to build long-term relationships.",
    icon: HeartIcon,
  },
  {
    type: "urgency",
    title: "Urgency",
    description: "Motivate quick purchases with time-sensitive offers.",
    icon: ClockIcon,
  },
  {
    type: "engagement",
    title: "Engagement",
    description: "Boost customer interaction with personalized experiences.",
    icon: ChatIcon,
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
    description: "Progress bar for free gifts/discounts",
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

const CampaignCard = ({ card, index, campaignName, onSelect }) => {
  const handleSelect = () => {
    if (!campaignName.trim()) {
      return alert("Please enter a campaign name first.");
    }
    onSelect(card);
  };

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

  // Get discount percentage based on card type
  const getDiscount = () => {
    if (card.type === "buy_more_save_more") return "20%";
    if (card.type === "checkout_upsell") return "20%";
    return "20%";
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e4e4e4",
        borderRadius: "12px",
        padding: "16px",
        minHeight: "240px",
        width: "100%",
        maxWidth: "350px",
        boxShadow: "0 2px 8px rgba(197, 58, 58, 0.08)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
      }}
      onClick={handleSelect}
    >
      {/* Info Icon in top right */}
      <div style={{ position: "absolute", top: "12px", right: "12px" }}>
        <InfoIcon width="20px" height="20px" />
      </div>

      <div
        style={{ textAlign: "center", marginTop: "8px", marginBottom: "16px" }}
      >
        <img
          src={getCardImage()}
          alt={card.title}
          style={{
            width: "100%",
            maxHeight: "120px",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />
      </div>

      <Text
        variant="headingSm"
        fontWeight="semibold"
        style={{ marginBottom: "4px" }}
      >
        {card.title}
      </Text>

      <Text
        variant="bodySm"
        tone="subdued"
        style={{ marginBottom: "12px", minHeight: "40px" }}
      >
        {card.description}
      </Text>

      <Button
        fullWidth
        primary
        onClick={(e) => {
          e.stopPropagation();
          handleSelect();
        }}
        style={{ marginTop: "auto" }}
      >
        Select
      </Button>
    </div>
  );
};

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleNext = () => {
    if (step === 1 && campaignName.trim()) {
      setStep(2);
    } else if (step === 2 && selectedCategory) {
      setStep(3);
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
    }
  };

  const handleCardSelect = (card) => {
    console.log("Campaign card selected:", card);
    console.log("Card type:", card.type);
    // Navigate directly to addtounlock page
    navigate(`/app/addtounlock?type=${card.type}&name=${campaignName}`);
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
      backAction={{
        content: "Back to Upsell Engine",
        onAction: () => navigate("/app/upsell_engine"),
      }}
      title="Create New Campaign"
    >
      {/* Progress Indicator */}
      {/* <Card sectioned>
        <InlineStack align="space-between" blockAlign="center">
          {steps.map((s, index) => (
            <Box key={s.number} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: s.active
                    ? s.completed
                      ? "#4CAF50"
                      : "#5c6ac4"
                    : "#e0e0e0",
                  color: "white",
                  lineHeight: "40px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {s.completed ? "✓" : s.number}
              </div>
              <Text variant="bodySm">{s.title}</Text>
            </Box>
          ))}
        </InlineStack>
      </Card>

      <Divider /> */}

      {/* Step 1: Campaign Name */}
      {step === 1 && (
        <Card sectioned>
          <BlockStack gap="400">
            <Text variant="headingMd" fontWeight="bold">
              Step 1: Name Your Campaign
            </Text>
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
                Next: Choose Category
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      )}

      {/* Step 2: Category Selection */}
      {step === 2 && (
        <Card sectioned>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" fontWeight="bold">
                Step 2: Choose Category
              </Text>
              <Button variant="plain" onClick={handleBack}>
                ← Back
              </Button>
            </InlineStack>

            <InlineStack wrap gap="300" style={{ justifyContent: "space-between" }}>
              {CATEGORIES.map((cat) => (
                <Box
                  key={cat.type}
                  width="300px"
                  minHeight="300px"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ cursor: "pointer" }}
                >
                  <Card
                    sectioned
                    style={{
                      borderColor:
                        selectedCategory?.type === cat.type
                          ? "#5c6ac4"
                          : "#e0e0e0",
                      borderWidth:
                        selectedCategory?.type === cat.type ? "2px" : "1px",
                      transition: "all 0.2s ease",
                      backgroundColor:
                        selectedCategory?.type === cat.type
                          ? "#f5f8ff"
                          : "white",
                    }}
                  >
                    <Box width="300px" height="300px">
                    <BlockStack gap="200" align="center">
                      <cat.icon width="50px" />
                      <Text variant="headingSm">{cat.title}</Text>
                      <Text variant="bodyXs" alignment="center">
                        {cat.description}
                      </Text>
                    </BlockStack>
                    </Box>
                  </Card>
                </Box>
              ))}
            </InlineStack>

            <InlineStack align="end">
              <Button primary onClick={handleNext} disabled={!selectedCategory}>
                Next: Choose Campaign Type
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      )}

      {/* Step 3: Campaign Type Selection */}
      {step === 3 && (
        <Card sectioned>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" fontWeight="bold">
                Step 3: Choose Campaign Type
              </Text>
              <Button variant="plain" onClick={handleBack}>
                ← Back
              </Button>
            </InlineStack>

            <Card sectioned>
              <Text variant="headingSm">{selectedCategory.title}</Text>
              <Text variant="bodyMd" tone="subdued">
                {selectedCategory.description}
              </Text>
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
                width: "100%",
                padding: "10px 0",
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
                />
              ))}
            </div>
          </BlockStack>
        </Card>
      )}
    </Page>
  );
}
