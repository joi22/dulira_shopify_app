import {
  GiftCardIcon,
  OrderRepeatIcon,
  HeartIcon,
  ClockIcon,
  ChatIcon,
  PlusIcon,
  AlertCircleIcon,
} from "@shopify/polaris-icons";
import "./_index/style.css";
import {
  Page,
  Card,
  ButtonGroup,
  Button,
  IndexTable,
  Text,
  EmptyState,
  Layout,
  ActionMenu,
  Modal,
  InlineStack,
  Box,
  BlockStack,
  TextField,
  Divider,
  Icon,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";

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

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const campaigns = await prisma.UpsellCampaign.findMany({
    where: { shop: session.shop },
    include: {
      offers: { select: { rewardMode: true, rewardType: true } },
      BuyMoreRule: { select: { discountType: true } },
      BogoRule: { select: { buyQty: true, getQty: true } },
      OrderBump: { select: { offerTitle: true } },
      checkout_upsell: { select: { discountType: true } },
      PostPurchaseUpsell: { select: { discountType: true } },
    },
  });

  return {
    campaigns: campaigns.map((campaign) => {
      let rewardMode = null;
      let rewardType = null;

      // Determine reward mode and type based on campaign type
      if (campaign.type === "add_to_unlock") {
        rewardMode = campaign.offers?.[0]?.rewardMode || null;
        rewardType = campaign.offers?.[0]?.rewardType || null;
      } else if (campaign.type === "buy_more_save_more") {
        rewardMode = campaign.BuyMoreRule?.[0] ? "fixed" : null;
        rewardType = "discount";
      } else if (campaign.type === "buy_one_get_one") {
        rewardMode = "fixed";
        rewardType = "gift";
      } else if (campaign.type === "order_bump") {
        rewardMode = "fixed";
        rewardType = "product";
      } else if (campaign.type === "checkout_upsell") {
        rewardMode = "fixed";
        rewardType = "discount";
      } else if (campaign.type === "post_purchase") {
        rewardMode = "fixed";
        rewardType = "discount";
      }

      return {
        ...campaign,
        rewardMode,
        rewardType,
      };
    }),
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formdata = await request.formData();
  const delete_id = formdata.get("del_Id");

  if (!delete_id) return null;

  const deleteOperations = [
    prisma.addToUnlockOffer,
    prisma.upsellTriggerProduct,
    prisma.upsellTriggerCollection,
    prisma.upsellRewardProduct,
    prisma.upsellRewardCollection,
    prisma.upsellFreeGiftProduct,
    prisma.customiz,
    prisma.buyMoreRule,
    prisma.bogoRule,
    prisma.bogoFreeItem,
    prisma.orderBump,
    prisma.campaignTargetCountry,
    prisma.campaignExcludeCountry,
    prisma.checkout_upsell,
    prisma.postPurchaseUpsell,
  ];

  await Promise.all(
    deleteOperations.map((op) =>
      op.deleteMany({ where: { campaignId: parseInt(delete_id) } }),
    ),
  );
  await prisma.UpsellCampaign.delete({ where: { id: parseInt(delete_id) } });

  return null;
};

const CampaignCard = ({ card, index, campaignName, onSelect }) => {
  const handleSelect = () => {
    if (!campaignName.trim())
      return alert("Please enter a campaign name first.");
    onSelect(card);
  };

  const handleTutorialClick = (e) => {
    e.stopPropagation();
    window.open(card.tutorialLink, "_blank");
  };

  // Get appropriate image based on card type
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
        background: "#fff",
        border: "1px solid #e4e4e4",
        borderRadius: "14px",
        padding: "18px 16px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "210px",
        width: "100%",
        maxWidth: "350px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        alignItems: "center",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onClick={handleSelect}
    >
      {/* Top image section */}
      <div
        style={{
          position: "relative",
          marginTop: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px",
          height: "60px",
          width: "80%",
          border: "1px solid #ccc",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.05)",
        }}
      >
        {/* Text inside border */}
        <span
          style={{
            position: "absolute",
            top: "-10px",
            background: "#fff",
            padding: "0 8px",
            left: "10%",
            fontSize: "12px",
            color: "#333",
            fontWeight: "500",
          }}
        >
          {card.category === "upsell"
            ? "Upsell"
            : card.category === "cross_sell"
              ? "Cross-sell"
              : card.category}
        </span>
        {/* <span
          style={{
            position: "absolute",
            top: "-10px",
            background: "#fff",
            padding: "0 10px",
            right: "10%",
            fontSize: "12px",
            color: "#333",
            fontWeight: "500",
          }}
        >
          Save <span style={{ color: "#FF0000" }}>20%</span>
        </span> */}

        {/* Single Image display */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "40px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px dashed #ccc",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={getCardImage()}
              alt={card.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </div>

      {/* Card title and description */}
      <div
        style={{
          textAlign: "left",
          marginBottom: "12px",
          width: "100%",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
            margin: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#333",
              margin: 0,
              paddingLeft: "8px",
            }}
          >
            {card.title}
          </h3>
          <Icon source={AlertCircleIcon} tone="base" />
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "#666",
            margin: 0,
            paddingLeft: "8px",
            lineHeight: "1.3",
          }}
        >
          {card.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ width: "100%", display: "flex", gap: "8px" }}>
        <Button
          fullWidth
          tone="success"
          variant="secondary"
          onClick={handleSelect}
        >
          Select
        </Button>
        <Button
          variant="secondary"
          onClick={handleTutorialClick}
          style={{ minWidth: "40px", padding: "0 12px" }}
        >
          📹
        </Button>
      </div>
    </div>
  );
};


export default function UpsellEngine() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { campaigns } = useLoaderData();
  const [campaignName, setCampaignName] = useState("");
  const [active, setActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDealTypeModal, setShowDealTypeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleChange = useCallback(() => {
    
    navigate("/app/create_campaign");
  }, [navigate]);

  const handeldelete = async (id) => {
    if (!id || !window.confirm(`Are you sure you want to delete this offer?`))
      return;
    const formData = new FormData();
    formData.append("del_Id", id);
    await fetcher.submit(formData, {
      method: "DELETE",
      encType: "multipart/form-data",
    });
  };


  return (
    <Page
      title="Upsell Engine"
      primaryAction={{
        content: "New Campaign",
        icon: PlusIcon,
        onAction: handleChange,
      }}
    >
      <style>{`
        .Polaris-Modal-Dialog__Modal { 
          width: 90vw !important; 
          height: 90vh !important; 
          max-width: none !important; 
          max-height: none !important; 
        } 
        .Polaris-Modal__Body { 
          height: 90%; 
          overflow-y: auto; 
          padding: 20px !important;
        }
        .Polaris-Modal-Section {
          padding: 0 !important;
        }
      `}</style>

      <Layout sectioned>
        <Card>
          {!campaigns || campaigns.length === 0 ? (
            <EmptyState
              heading="No campaigns yet"
              action={{ content: "Create campaign", onAction: handleChange }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create an upsell campaign to start boosting revenue.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{ singular: "campaign", plural: "campaigns" }}
              itemCount={campaigns.length}
              selectable={false}
              headings={[
                { title: "Status" },
                { title: "Campaign" },
                { title: "Type" },
                { title: "Placement" },
                { title: "Offer Type" },
                { title: "Reward Type" },
                { title: "Created At" },
                { title: "Actions" },
              ]}
            >
              {campaigns.map((campaign, index) => (
                <IndexTable.Row
                  id={campaign.id}
                  key={campaign.id}
                  position={index}
                >
                  <IndexTable.Cell>
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        checked={campaign.status || false}
                        onChange={(e) =>
                          console.log("Toggle", campaign.id, e.target.checked)
                        }
                        className="switch-input"
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text>{campaign.name}</Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{campaign.type}</IndexTable.Cell>
                  <IndexTable.Cell>{campaign.placement}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {campaign.rewardMode === "fixed"
                      ? "Fixed Deal"
                      : campaign.rewardMode === "flame"
                        ? "Flame Match"
                        : "N/A"}
                  </IndexTable.Cell>
                  <IndexTable.Cell>{campaign.rewardType}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <ButtonGroup>
                      <ActionMenu
                        actions={[
                          {
                            content: "Preview",
                            onAction: () => console.log("Preview", campaign.id),
                          },
                          {
                            content: "Edit",
                            onAction: () => console.log("Edit", campaign.id),
                          },
                          {
                            content: "Delete",
                            onAction: () => handeldelete(campaign.id),
                            destructive: true,
                          },
                        ]}
                      />
                    </ButtonGroup>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </Card>
      </Layout>
    </Page>
  );
}
