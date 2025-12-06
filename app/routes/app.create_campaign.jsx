import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useNavigate, useFetcher, useLocation, json } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Box,
  Layout,
  ResourceList,
  ResourceItem,
  Image,
  ChoiceList,
  Select,
  Banner,
  RadioButton,
  FormLayout,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import pakg from "react-color";
import "./_index/style.css";
import "./_index/home.css";
import "./_index/preview-styles.css";
import HomeSectionPreview from "./components/preview/HomeSectionPreview";
import save2 from "./_index/media/save-2.png";
import gift from "./_index/media/gift.png";
import free from "./_index/media/shipping.png";
import discou from "./_index/media/disc.png";
const SketchPicker = pakg;
import {
  GiftCardIcon,
  OrderRepeatIcon,
  HeartIcon,
  ClockIcon,
  ChatIcon,
  InfoIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  console.log("<<<<<<<<< +============ Graphql Admin ");
  return null;
};

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

const CampaignCard = memo(
  ({ card, index, campaignName, onSelect, selectedCard }) => {
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
  },
);

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
  const fetcher = useFetcher();
  const location = useLocation();
  const shopify = useAppBridge();
  const [step, setStep] = useState(1);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [placement, setPlacement] = useState("");
  const [dealType, setDealType] = useState("");
  const [currentProgress] = useState(1); // Mock progress for preview

  // Feature Configuration State
  const [barSize, setBarSize] = useState("false");
  const [selectedTriggerType, setSelectedTriggerType] = useState("all");
  const [upsell_allproduct, setUpsell_allproduct] = useState(false);
  const [status, setStatus] = useState({
    active: true,
    badges: false,
    lockedGoals: false,
    showConfetti: true,
  });
  const [upsellselectedItems, setUpsellselectedItems] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [blockProducts, setBlockProducts] = useState([]);
  const [blockProductSearch, setBlockProductSearch] = useState("");
  const [blockProductSelectionType, setBlockProductSelectionType] =
    useState("all");
  const [blockProductCollections, setBlockProductCollections] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBadges, setShowBadges] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showBadgeIcons, setShowBadgeIcons] = useState(false);
  const [showLockedGoals, setShowLockedGoals] = useState(false);
  const [badgeIcon, setBadgeIcon] = useState(null);
  const [mainBtnLoading, setMainBtnLoading] = useState(false);
  const [progressBarStyle, setProgressBarStyle] = useState({
    thickness: "thin",
    cornerRadius: "square",
    primaryColor: "#4CAF50",
    secondaryColor: "#2196F3",
    goalCompleteColor: "#FF9800",
    backgroundColor: "#F5F5F5",
  });
  const [productSearch, setProductSearch] = useState("");
  const [openColorPicker, setOpenColorPicker] = useState(null);
  const [activePreview, setActivePreview] = useState("home");
  const SAVE_BAR_ID = "ID_SAVE_BAR";

  // Preview products for fallback
  const preview_products = [
    {
      id: 1,
      title: "The Collection Snowboard: Liquid",
      price: "749.95",
      image:
        "https://cdn.shopify.com/s/files/1/0642/6063/files/wax-special.png?v=1730040415",
    },
    {
      id: 2,
      title: "Summer T-Shirt Bundle",
      price: "49.99",
      image: save2,
    },
    {
      id: 3,
      title: "Summer PANTS Bundle",
      price: "49.99",
      image:
        "https://cdn.shopify.com/s/files/1/0642/6063/files/wax-special.png?v=1730040415",
    },
  ];

  // Initialize offers based on deal type
  const [offers, setOffers] = useState(() => {
    return [
      {
        id: Date.now() + Math.random(),
        goalType: "quantity",
        goalAmount: "50",
        goalquantity: "1",
        currency: "USD",
        rewardMode: dealType === "flame" ? "flame" : "fixed",
        rewardType: dealType === "flame" ? "gift" : "discount",
        discountCode: "10",
        discountType: "percentage",
        productPickType: "products",
        buyProductPicker: [],
        buyCollectionPicker: [],
        rewardProducts: [],
        rewardCollection: [],
        rewardSelectionType: "all",
        goalTextBefore: "👉🏻 Add {{amount_left}} to unlock {{reward}}!",
        goalTextAfter: "🎉 You've unlocked {{reward}}!",
      },
    ];
  });

  const currencyOptions = [
    { label: "US Dollar (USD)", value: "USD" },
    { label: "Moroccan Dirham (MAD)", value: "MAD" },
  ];

  const goalOptions = [
    { label: "Cart Value", value: "amount_cart" },
    { label: "Product Quantity", value: "quantity" },
  ];

  // Helper function to safely create object URL
  const createObjectURL = (file) => {
    try {
      if (typeof window !== "undefined" && window.URL && file) {
        return URL.createObjectURL(file);
      }
    } catch (error) {
      console.warn("Error creating object URL:", error);
    }
    return "";
  };

  // Filter functions
  const filteredCollections = selectedCollections.filter(
    (c) =>
      c.title?.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      c.handle?.toLowerCase().includes(collectionSearch.toLowerCase()),
  );
  const filteredProducts = upsellselectedItems.filter(
    (p) =>
      p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.handle?.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const filteredBlockProducts = blockProducts.filter(
    (p) =>
      p.title?.toLowerCase().includes(blockProductSearch.toLowerCase()) ||
      p.handle?.toLowerCase().includes(blockProductSearch.toLowerCase()),
  );

  // Remove item helpers
  const removeItem = (id, setItems, items) => {
    setItems(items.filter((item) => item.id !== id));
  };
  const removeProduct = (id) =>
    removeItem(id, setUpsellselectedItems, upsellselectedItems);
  const removeCollection = (id) =>
    removeItem(id, setSelectedCollections, selectedCollections);
  const removeBlockProduct = (id) =>
    removeItem(id, setBlockProducts, blockProducts);
  const removeBlockCollection = (id) => {
    setBlockProductCollections((prev) => prev.filter((col) => col.id !== id));
  };

  // Product/Collection pickers
  const productpicker = async () => {
    try {
      if (typeof window === "undefined" || !window.shopify) {
        console.warn("Shopify resource picker not available");
        return;
      }
      const selectedItems = await window.shopify.resourcePicker({
        selectionIds: upsellselectedItems.map((product) => product.id),
        multiple: true,
        query: "status:active AND published_status:published",
        type: "product",
        action: "select",
        showVariants: true,
      });

      if (selectedItems) {
        const products = selectedItems.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
          variantId: item.variants[0]?.id.split("/").pop(),
          price: item.variants[0]?.price,
          media: item.images[0]?.originalSrc || item.images[0]?.src || null,
        }));

        const uniqueProducts = products.filter(
          (newProduct) =>
            !upsellselectedItems.some(
              (existing) => existing.id === newProduct.id,
            ),
        );
        setUpsellselectedItems((prev) => [...prev, ...uniqueProducts]);
      }
    } catch (error) {
      console.error("Error in product picker:", error);
      shopify.toast.show("Failed to select products.", { isError: true });
    }
  };

  const blockProductPicker = async () => {
    try {
      if (typeof window === "undefined" || !window.shopify) {
        console.warn("Shopify resource picker not available");
        return;
      }
      const selectedItems = await window.shopify.resourcePicker({
        selectionIds: blockProducts.map((product) => product.id),
        multiple: true,
        query: "status:active AND published_status:published",
        type: "product",
        action: "select",
        showVariants: true,
      });

      if (selectedItems) {
        const products = selectedItems.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
          variantId: item.variants[0]?.id.split("/").pop(),
          price: item.variants[0]?.price,
          media: item.images[0]?.originalSrc || item.images[0]?.src || null,
        }));

        const uniqueProducts = products.filter(
          (newProduct) =>
            !blockProducts.some((existing) => existing.id === newProduct.id),
        );
        setBlockProducts((prev) => [...prev, ...uniqueProducts]);
      }
    } catch (error) {
      console.error("Error in block product picker:", error);
      shopify.toast.show("Failed to select block products.", { isError: true });
    }
  };

  const collectionPicker = async () => {
    try {
      if (typeof window === "undefined" || !window.shopify) {
        console.warn("Shopify resource picker not available");
        return;
      }
      const upsell_collection = await window.shopify.resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
      });

      if (upsell_collection) {
        const collections = upsell_collection.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
        }));

        const uniqueCollections = collections.filter(
          (newColl) =>
            !selectedCollections.some((existing) => existing.id === newColl.id),
        );
        setSelectedCollections((prev) => [...prev, ...uniqueCollections]);
      }
    } catch (error) {
      console.error("Error in collection picker:", error);
      shopify.toast.show("Failed to select collections.", { isError: true });
    }
  };

  const blockCollectionPicker = async () => {
    try {
      if (typeof window === "undefined" || !window.shopify) {
        console.warn("Shopify resource picker not available");
        return;
      }
      const selected_collections = await window.shopify.resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
        selectionIds: blockProductCollections.map((col) => col.id),
      });

      if (selected_collections) {
        const collections = selected_collections.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
        }));

        const uniqueCollections = collections.filter(
          (newColl) =>
            !blockProductCollections.some(
              (existing) => existing.id === newColl.id,
            ),
        );
        setBlockProductCollections((prev) => [...prev, ...uniqueCollections]);
      }
    } catch (error) {
      console.error("Error in block collection picker:", error);
      shopify.toast.show("Failed to select block collections.", {
        isError: true,
      });
    }
  };

  // Offer management
  const addOffer = () => {
    const currentDealType = dealType || "fixed";
    const newOffer = {
      id: Date.now() + Math.random(),
      goalType: "quantity",
      goalAmount: "50",
      goalquantity: "1",
      currency: "USD",
      rewardMode: currentDealType === "flame" ? "flame" : "fixed",
      rewardType: currentDealType === "flame" ? "gift" : "discount",
      discountCode: "10",
      discountType: "percentage",
      productPickType: "products",
      buyProductPicker: [],
      buyCollectionPicker: [],
      rewardProducts: [],
      rewardCollection: [],
      rewardSelectionType: "all",
      goalTextBefore: "🛍 Add {{amount_left}} to unlock {{reward}}!",
      goalTextAfter: "🎉 You've unlocked {{reward}}!",
    };
    setOffers((prev) => [...prev, newOffer]);
  };

  const removeOffer = (id) => {
    setHasUnsavedChanges(true);
    setOffers((prev) => prev.filter((offer) => offer.id !== id));
  };

  const updateOffer = (id, field, value) => {
    setHasUnsavedChanges(true);
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === id ? { ...offer, [field]: value } : offer,
      ),
    );
  };

  const updateOfferBatch = (id, updates) => {
    setHasUnsavedChanges(true);
    setOffers((prev) =>
      prev.map((offer) => (offer.id === id ? { ...offer, ...updates } : offer)),
    );
  };

  const handleToggle = () => {
    setShowBadges(!showBadges);
  };

  const handleswitchChange = (field, value) => {
    setStatus((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    if (isClient && shopify) {
      shopify.saveBar.show(SAVE_BAR_ID);
    }
  };

  // Reward picker functions
  const rewardPicker = async (offerId) => {
    const currentOffer = offers.find((o) => o.id === offerId);
    if (!currentOffer) return;

    const currentDealType = dealType;
    const isFixedDeal =
      currentDealType === "fixed" || currentOffer.rewardMode === "fixed";
    const isFlameMatch =
      currentDealType === "flame" || currentOffer.rewardMode === "flame";

    if (isFixedDeal && currentOffer.rewardProducts.length >= 1) {
      if (
        typeof window !== "undefined" &&
        window.shopify &&
        window.shopify.toast
      ) {
        window.shopify.toast.show(
          "Fixed Deal: Only 1 reward product is allowed. Please remove the existing product first.",
          { isError: true },
        );
      }
      return;
    }

    if (isFlameMatch && currentOffer.rewardProducts.length >= 20) {
      if (
        typeof window !== "undefined" &&
        window.shopify &&
        window.shopify.toast
      ) {
        window.shopify.toast.show(
          "Flame Match: Maximum 20 reward products allowed.",
          { isError: true },
        );
      }
      return;
    }

    try {
      if (typeof window === "undefined" || !window.shopify) {
        console.warn("Shopify resource picker not available");
        return;
      }

      const selectedItems = await window.shopify.resourcePicker({
        multiple: !isFixedDeal,
        type: "product",
        action: "select",
      });

      if (selectedItems) {
        const products = selectedItems.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          variantId: item.variants[0]?.id.split("/").pop(),
          price: item.variants[0]?.price,
          media: item.images[0]?.originalSrc || null,
        }));

        const newProducts = products.filter(
          (p) => !currentOffer.rewardProducts.some((pr) => pr.id === p.id),
        );

        const totalProducts =
          currentOffer.rewardProducts.length + newProducts.length;

        if (isFixedDeal && totalProducts > 1) {
          if (
            typeof window !== "undefined" &&
            window.shopify &&
            window.shopify.toast
          ) {
            window.shopify.toast.show(
              "Fixed Deal: Only 1 reward product is allowed. Please select only 1 product.",
              { isError: true },
            );
          }
          return;
        }

        if (isFlameMatch && totalProducts < 2) {
          if (
            typeof window !== "undefined" &&
            window.shopify &&
            window.shopify.toast
          ) {
            window.shopify.toast.show(
              "Flame Match: At least 2 reward products are required. Please select more products.",
              { isError: true },
            );
          }
          return;
        }

        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === offerId
              ? {
                  ...offer,
                  rewardProducts: isFixedDeal
                    ? newProducts.slice(0, 1)
                    : [...currentOffer.rewardProducts, ...newProducts].slice(
                        0,
                        20,
                      ),
                }
              : offer,
          ),
        );
      }
    } catch (error) {
      console.error("Error in reward picker:", error);
      if (
        typeof window !== "undefined" &&
        window.shopify &&
        window.shopify.toast
      ) {
        window.shopify.toast.show("Failed to select reward products.", {
          isError: true,
        });
      }
    }
  };

  const rewardCollectionPicker = async (offerId) => {
    const currentOffer = offers.find((o) => o.id === offerId);
    if (!currentOffer) return;

    try {
      if (typeof window === "undefined" || !window.shopify) {
        console.warn("Shopify resource picker not available");
        return;
      }

      const selectedItems = await window.shopify.resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
        selectionIds: currentOffer.rewardCollection?.map((col) => col.id) || [],
      });

      if (selectedItems) {
        const collections = selectedItems.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
        }));

        const newCollections = collections.filter(
          (c) => !currentOffer.rewardCollection?.some((rc) => rc.id === c.id),
        );

        setOffers((prev) =>
          prev.map((offer) =>
            offer.id === offerId
              ? {
                  ...offer,
                  rewardCollection: [
                    ...(currentOffer.rewardCollection || []),
                    ...newCollections,
                  ],
                }
              : offer,
          ),
        );
      }
    } catch (error) {
      console.error("Error in reward collection picker:", error);
      if (
        typeof window !== "undefined" &&
        window.shopify &&
        window.shopify.toast
      ) {
        window.shopify.toast.show("Failed to select reward collections.", {
          isError: true,
        });
      }
    }
  };

  const removeRewardCollection = (offerId, id) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId
          ? {
              ...offer,
              rewardCollection:
                offer.rewardCollection?.filter((item) => item.id !== id) || [],
            }
          : offer,
      ),
    );
  };

  const removeRewardProduct = (offerId, id) => {
    setOffers((prev) => {
      const updatedOffers = prev.map((offer) =>
        offer.id === offerId
          ? {
              ...offer,
              rewardProducts: offer.rewardProducts.filter(
                (item) => item.id !== id,
              ),
            }
          : offer,
      );
      return updatedOffers;
    });
  };

  // Image upload function
  const uploadImageToShopify = async (file) => {
    try {
      setHasUnsavedChanges(true);
      const formData = new FormData();
      const fileName = `${Date.now()}-${file.name}`;

      formData.append("image", file);
      formData.append("fileName", fileName);
      formData.append("originalSource", "");

      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Image upload error:", error);
      if (typeof shopify !== "undefined" && shopify.toast) {
        shopify.toast.show("Failed to upload image. Please try again.", {
          isError: true,
        });
      }
      return null;
    }
  };

  const handleBadgeIconChange = async (offerId, event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        if (typeof shopify !== "undefined" && shopify.toast) {
          shopify.toast.show("Uploading image...", { isError: false });
        }

        const uploadedUrl = await uploadImageToShopify(file);

        if (uploadedUrl) {
          updateOffer(offerId, "badgeIconUrl", uploadedUrl);
          updateOffer(offerId, "badgeIconFile", null);
          if (typeof shopify !== "undefined" && shopify.toast) {
            shopify.toast.show("Image uploaded successfully!", {
              isError: false,
            });
          }
        } else {
          updateOffer(offerId, "badgeIcon", file);
        }
      } else {
        if (typeof shopify !== "undefined" && shopify.toast) {
          shopify.toast.show("Please upload an image file.", { isError: true });
        }
      }
    }
  };

  // Form submission
  const handleSubmitRef = useRef(null);

  const handleSubmit = useCallback(() => {
    if (!campaignName || !campaignName.trim()) {
      console.log("Campaign name is required.", campaignName);
      shopify.toast.show("Campaign name is required.", { isError: true });
      return;
    }

    if (!dealType) {
      shopify.toast.show(
        "Deal type is required. Please select Fixed Deal or Flame Match.",
        { isError: true },
      );
      return;
    }

    if (!placement) {
      shopify.toast.show("Placement is required.", { isError: true });
      return;
    }

    // Validate offers
    for (const [index, offer] of offers.entries()) {
      if (
        offer.goalType === "amount_cart" &&
        (!offer.goalAmount ||
          isNaN(offer.goalAmount) ||
          parseFloat(offer.goalAmount) <= 0)
      ) {
        shopify.toast.show(
          `Offer ${index + 1}: Valid goal amount is required.`,
          { isError: true },
        );
        return;
      }

      if (
        offer.goalType === "quantity" &&
        (!offer.goalquantity ||
          isNaN(offer.goalquantity) ||
          parseInt(offer.goalquantity) <= 0)
      ) {
        shopify.toast.show(
          `Offer ${index + 1}: Valid goal quantity is required.`,
          { isError: true },
        );
        return;
      }
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("campaignName", campaignName);
    formData.append(
      "selectedCampaignType",
      selectedCard?.type || "add_to_unlock",
    );
    formData.append("selectedTriggerType", selectedTriggerType);
    formData.append("status", JSON.stringify(status));
    formData.append("dealType", dealType);

    if (selectedTriggerType === "products") {
      formData.append("selectedProducts", JSON.stringify(upsellselectedItems));
    } else if (selectedTriggerType === "collections") {
      formData.append(
        "selectedCollections",
        JSON.stringify(selectedCollections),
      );
    } else if (selectedTriggerType === "all") {
      formData.append("upsell_allproducts", "true");
    }

    formData.append("blockProducts", JSON.stringify(blockProducts));
    formData.append("blockProductSelectionType", blockProductSelectionType);
    formData.append(
      "blockProductCollections",
      JSON.stringify(blockProductCollections),
    );

    formData.append("offers", JSON.stringify(offers));
    formData.append("showConfetti", showConfetti ? "on" : "off");
    formData.append("showLockedGoals", showLockedGoals ? "on" : "off");
    formData.append("showBadgeIcons", showBadgeIcons ? "on" : "off");
    formData.append("progressBarStyle", JSON.stringify(progressBarStyle));
    // Send placement as string, not array
    formData.append("placement", placement || "");

    console.log("📤 Submitting campaign:", {
      campaignName,
      dealType,
      placement,
      offersCount: offers.length,
      selectedTriggerType,
      hasOffers: offers.length > 0,
    });

    console.log("formData", formData);

    setMainBtnLoading(true);

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/addtounlock",
      encType: "multipart/form-data",
    });

    setHasUnsavedChanges(false);
  }, [
    campaignName,
    selectedCard,
    selectedTriggerType,
    upsellselectedItems,
    selectedCollections,
    blockProducts,
    upsell_allproduct,
    offers,
    showConfetti,
    showLockedGoals,
    showBadgeIcons,
    progressBarStyle,
    placement,
    status,
    dealType,
    fetcher,
    shopify,
  ]);

  const handleSave = useCallback(() => {
    console.log("handleSave called");
    // Call handleSubmit directly - it's already a stable callback
    handleSubmit();
    // Hide save bar after submission starts
    if (shopify) {
      shopify.saveBar.hide(SAVE_BAR_ID);
    }
  }, [handleSubmit, shopify]);

  const handleDiscard = useCallback(() => {
    setHasUnsavedChanges(false);
    if (shopify) {
      shopify.saveBar.hide(SAVE_BAR_ID);
    }
    navigate("/app/upsell_engine");
  }, [navigate, shopify]);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Always update the ref with the latest handleSubmit
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (!isClient || !shopify) return;

    if (hasUnsavedChanges) {
      shopify.saveBar.show(SAVE_BAR_ID);
    } else {
      shopify.saveBar.hide(SAVE_BAR_ID);
    }
  }, [hasUnsavedChanges, isClient, shopify]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [
    campaignName,
    selectedTriggerType,
    upsellselectedItems,
    selectedCollections,
    blockProducts,
    blockProductSelectionType,
    blockProductCollections,
    placement,
    offers,
    status,
    progressBarStyle,
    showBadges,
    dealType,
  ]);

  useEffect(() => {
    console.log("🔄 Fetcher state:", fetcher.state, "Data:", fetcher.data);

    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        console.log("✅ Campaign saved successfully!");
        shopify.toast.show("Campaign saved successfully!", { isError: false });
        setMainBtnLoading(false);
        setTimeout(() => {
          navigate("/app/upsell_engine");
        }, 2000);
      } else if (fetcher.data.error) {
        console.error("❌ Save error:", fetcher.data.error);
        const errorMessage =
          fetcher.data.error || "Failed to save campaign. Please try again.";
        shopify.toast.show(errorMessage, {
          isError: true,
        });
        setMainBtnLoading(false);

        // If it's an authentication error, suggest refreshing
        if (
          errorMessage.includes("Session expired") ||
          errorMessage.includes("Authentication")
        ) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        // No success or error - might be an unexpected response
        console.warn("⚠️ Unexpected response:", fetcher.data);
        shopify.toast.show(
          "Unexpected response from server. Please check console.",
          {
            isError: true,
          },
        );
        setMainBtnLoading(false);
      }
    } else if (fetcher.state === "submitting") {
      console.log("📤 Submitting form...");
    } else if (fetcher.state === "loading") {
      console.log("⏳ Loading response...");
    }
  }, [fetcher.state, fetcher.data, navigate, shopify]);

  // Update offers when deal type changes
  useEffect(() => {
    if (dealType && offers.length > 0) {
      const updatedOffers = offers.map((offer) => ({
        ...offer,
        rewardMode: dealType === "flame" ? "flame" : "fixed",
        rewardType:
          dealType === "flame"
            ? offer.rewardType || "gift"
            : offer.rewardType || "discount",
      }));
      setOffers(updatedOffers);
    }
  }, [dealType]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openColorPicker &&
        !event.target.closest("[data-color-picker]") &&
        !event.target.closest("[data-color-button]")
      ) {
        setOpenColorPicker(null);
      }
    };

    if (openColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openColorPicker]);

  // Sync preview with placement selection
  useEffect(() => {
    if (placement) {
      setActivePreview(placement);
    }
  }, [placement]);

  // Render Preview Function
  const renderPreview = () => {
    const sortedOffers = [...offers].sort((a, b) =>
      a.goalType === "quantity"
        ? parseInt(a.goalquantity) - parseInt(b.goalquantity)
        : parseFloat(a.goalAmount) - parseFloat(b.goalAmount),
    );

    const defaultGoal = {
      goalType: "quantity",
      goalquantity: "1",
      goalAmount: "1",
      currency: "USD",
    };

    const maxGoal =
      sortedOffers.length > 0
        ? sortedOffers[sortedOffers.length - 1]
        : defaultGoal;

    let activeOffer = null;
    if (sortedOffers.length > 0) {
      for (const offer of sortedOffers) {
        const goalValue =
          offer.goalType === "quantity"
            ? parseInt(offer.goalquantity) || 1
            : parseFloat(offer.goalAmount) || 1;
        if (currentProgress < goalValue) {
          activeOffer = offer;
          break;
        }
        activeOffer = offer;
      }
    }

    const progressPercentage = activeOffer
      ? activeOffer.goalType === "quantity"
        ? Math.min(
            (currentProgress / (parseInt(activeOffer.goalquantity) || 1)) * 100,
          )
        : Math.min(
            (currentProgress / (parseFloat(activeOffer.goalAmount) || 1)) * 100,
            100,
          )
      : currentProgress >= 100
        ? 100
        : (currentProgress / 1) * 100;

    const getOfferProgressPercentage = (offer) => {
      const goalValue =
        offer.goalType === "quantity"
          ? parseInt(offer.goalquantity) || 1
          : parseFloat(offer.goalAmount) || 1;
      const percent = Math.min((currentProgress / goalValue) * 100, 100);
      return percent;
    };

    const getDynamicCartText = () => {
      if (sortedOffers.length === 0) {
        const isGoalReached = currentProgress >= 1;
        return isGoalReached
          ? "🎉 You've unlocked a reward!"
          : `Add ${Math.max(1 - currentProgress, 0)} more item to unlock a reward!`;
      }

      if (!activeOffer) return "No active offer";

      const isGoalReached =
        activeOffer.goalType === "quantity"
          ? currentProgress >= parseInt(activeOffer.goalquantity)
          : currentProgress >= parseFloat(activeOffer.goalAmount);

      const rewardDescription =
        activeOffer.rewardType === "discount"
          ? `${activeOffer.discountCode}${activeOffer.discountType === "percentage" ? "%" : "$"} Discount`
          : activeOffer.rewardType === "shipping"
            ? "Free Shipping"
            : "Free Gift";

      const amountLeft =
        activeOffer.goalType === "quantity"
          ? `${Math.max(parseInt(activeOffer.goalquantity) - currentProgress, 0)} items`
          : `${activeOffer.currency}${Math.max(parseFloat(activeOffer.goalAmount) - currentProgress, 0)}`;

      const goal =
        activeOffer.goalType === "quantity"
          ? `${activeOffer.goalquantity || 0} items`
          : `${activeOffer.currency}${activeOffer.goalAmount || 0}`;

      return isGoalReached
        ? activeOffer.goalTextAfter
            .replace("{{reward}}", rewardDescription)
            .replace("{{goal}}", goal)
        : activeOffer.goalTextBefore
            .replace("{{amount_left}}", amountLeft)
            .replace("{{reward}}", rewardDescription)
            .replace("{{goal}}", goal);
    };

    const maxGoalValue =
      maxGoal?.goalType === "quantity"
        ? parseInt(maxGoal?.goalquantity) || 1
        : parseFloat(maxGoal?.goalAmount) || 1;
    let icons = {
      gift: gift,
      shipping: free,
      discount: discou,
    };

    const offerProgress =
      sortedOffers.length > 0
        ? sortedOffers.map((offer) => {
            const goalValue =
              offer.goalType === "quantity"
                ? parseInt(offer.goalquantity) || 1
                : parseFloat(offer.goalAmount) || 1;
            const offerPercentage = (goalValue / maxGoalValue) * 100;
            const isGoalReached = currentProgress >= goalValue;
            return {
              ...offer,
              percentage: offerPercentage,
              isGoalReached,
              icon: offer.badgeIconUrl
                ? offer.badgeIconUrl
                : offer.badgeIcon
                  ? createObjectURL(offer.badgeIcon)
                  : icons[offer.rewardType] || "",
            };
          })
        : [
            {
              ...defaultGoal,
              percentage: 100,
              isGoalReached: currentProgress >= 1,
              icon: icons.gift || "",
            },
          ];

    const renderGoalText = (offer) => {
      const isGoalReached =
        offer.goalType === "quantity"
          ? currentProgress >= parseInt(offer.goalquantity)
          : currentProgress >= parseFloat(offer.goalAmount);
      const rewardDescription =
        offer.rewardType === "discount"
          ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"} Discount`
          : offer.rewardType === "shipping"
            ? "Free Shipping"
            : "Free Gift";
      const amountLeft =
        offer.goalType === "quantity"
          ? `${parseInt(offer.goalquantity) - currentProgress || 0} items`
          : `${offer.currency}${parseFloat(offer.goalAmount) - currentProgress || 0}`;
      const goal =
        offer.goalType === "quantity"
          ? `${offer.goalquantity || 0} items`
          : `${offer.currency}${offer.goalAmount || 0}`;

      return isGoalReached
        ? offer.goalTextAfter
            .replace("{{reward}}", rewardDescription)
            .replace("{{goal}}", goal)
        : offer.goalTextBefore
            .replace("{{amount_left}}", amountLeft)
            .replace("{{reward}}", rewardDescription)
            .replace("{{goal}}", goal);
    };

    if (!placement) {
      return (
        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd" fontWeight="bold">
              Preview
            </Text>
            <Banner tone="info">
              <Text>Please select a placement above to see the preview.</Text>
            </Banner>
          </BlockStack>
        </Card>
      );
    }

    if (activePreview === "home") {
      const homeProducts =
        blockProducts.length > 0 ? blockProducts : preview_products;
      return (
        <Card title="Homepage Section Preview">
          <HomeSectionPreview
            title="Bundle Deals"
            backgroundColor="#fff"
            products={homeProducts}
            offers={offers}
            showModal={true}
          />
        </Card>
      );
    } else if (activePreview === "Page") {
      return (
        <Card title="Product Page Preview">
          <div
            style={{
              maxWidth: "900px",
              margin: "20px auto",
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
                .preview-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 15px;
                }
                .banner {
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 6px;
                }
                .main-title {
                    text-align: center;
                    font-size: 16px;
                    margin: 15px 0;
                    color: #333;
                    font-weight: 500;
                    line-height: 1.4;
                }
                .offer-card {
                    margin-bottom: 20px;
                }
                .progress-container {
                    margin: 15px 0;
                }
                .progress-bar {
                    width: 100%;
                    background: #f3f3f3;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .progress {
                    height: 100%;
                    width: 0%;
                    transition: width 0.5s ease, background 0.5s ease;
                    border-radius: 10px;
                }
                .product-grid {
                    display: flex;
                    justify-content: start;
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
                    transition: transform 0.2s ease;
                    flex: 0 0 auto;
                    width: 150px;
                }
                .product-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .product-image-container {
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                }
                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    border-radius: 8px;
                }
                .product-title {
                    font-size: 14px;
                    text-align: center;
                    margin-bottom: 8px;
                    color: #333;
                    font-weight: 500;
                    line-height: 1.3;
                    height: 36px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
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
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    width: 100%;
                }
                .add-btn:hover:not(:disabled) {
                    background: #333;
                    transform: translateY(-2px);
                }
                .add-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                .free-shipping-banner {
                    text-align: center;
                    padding: 12px;
                    background: #e8f5e9;
                    border-radius: 6px;
                    margin: 15px 0;
                    color: #2e7d32;
                    font-weight: 500;
                }
                .action-button-container {
                    display: flex;
                    justify-content: center;
                    margin-top: 15px;
                }
                .action-btn {
                    padding: 12px 30px;
                    background: #2c5aa0;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .action-btn:hover:not(:disabled) {
                    background: #1e3f73;
                    transform: translateY(-2px);
                }
                .action-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
            `}</style>
            <div className="preview-container">
              <div className="preview-title">Product Page Preview</div>
              <div className="banner">
                {offerProgress.map((offer) => {
                  let productsToShow = [];
                  if (offer.rewardType === "gift") {
                    productsToShow = offer.rewardProducts || [];
                  } else {
                    if (blockProducts.length > 0) {
                      productsToShow = blockProducts;
                    } else if (upsellselectedItems.length > 0) {
                      productsToShow = upsellselectedItems;
                    } else {
                      productsToShow = preview_products;
                    }
                  }
                  const buttonLabel =
                    offer.rewardType === "shipping"
                      ? "FREE SHIPPING"
                      : offer.rewardType === "discount"
                        ? `APPLY DISCOUNT`
                        : "REDEEM FREE GIFT";

                  const offerProgressPercent =
                    getOfferProgressPercentage(offer);

                  return (
                    <div key={offer.id} className="offer-card">
                      <div className="main-title">
                        <div className="offer-line">
                          <span>{renderGoalText(offer)}</span>
                        </div>
                      </div>
                      <div className="progress-container">
                        <div
                          className="progress-bar"
                          style={{
                            height:
                              progressBarStyle.thickness === "thin"
                                ? "10px"
                                : "15px",
                            background: progressBarStyle.backgroundColor,
                            borderRadius:
                              progressBarStyle.cornerRadius === "square"
                                ? "0px"
                                : progressBarStyle.cornerRadius === "slightly"
                                  ? "6px"
                                  : "10px",
                          }}
                        >
                          <div
                            className="progress"
                            style={{
                              width: `${offerProgressPercent}%`,
                              background:
                                offerProgressPercent >= 100
                                  ? progressBarStyle.goalCompleteColor
                                  : offer.percentage >= 40
                                    ? progressBarStyle.secondaryColor ||
                                      progressBarStyle.primaryColor
                                    : progressBarStyle.primaryColor,
                              borderRadius:
                                progressBarStyle.cornerRadius === "square"
                                  ? "0px"
                                  : progressBarStyle.cornerRadius === "slightly"
                                    ? "6px"
                                    : "10px",
                            }}
                          />
                        </div>
                      </div>
                      {productsToShow.length > 0 && (
                        <div className="product-grid">
                          {productsToShow.map((product) => (
                            <div key={product.id} className="product-card">
                              <div className="product-image-container">
                                <img
                                  src={
                                    product.media ||
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23f0f0f0' width='150' height='150'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"
                                  }
                                  alt={product.title || "Product"}
                                  className="product-image"
                                  onError={(e) => {
                                    e.target.src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23f0f0f0' width='150' height='150'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                              <div className="product-title">
                                {product.title || "No Title"}
                              </div>
                              <div className="product-price">
                                ${product.price || "0.00"}
                              </div>
                              <button
                                className="add-btn"
                                disabled={
                                  offer.rewardType === "gift" &&
                                  !offer.isGoalReached
                                }
                              >
                                {offer.rewardType === "gift"
                                  ? "ADD FREE GIFT"
                                  : "ADD"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {offer.isGoalReached && (
                        <div className="free-shipping-banner">
                          🎉 You've unlocked {offer.rewardType}!
                        </div>
                      )}
                      <div className="action-button-container">
                        <button
                          className="action-btn"
                          disabled={!offer.isGoalReached}
                        >
                          {buttonLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      );
    } else if (activePreview === "cart") {
      return (
        <Card title="Cart Page Preview">
          <BlockStack gap="200">
            <Text variant="headingSm">Cart Drawer Upsell</Text>
            <div
              style={{
                border: "1px solid #ddd",
                overflow: "hidden",
                height: "700px",
              }}
            >
              <iframe
                style={{ width: "100%", height: "100%", border: "none" }}
                srcDoc={`<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <style>
                            .cart-drawer-overlay {
                                position: fixed;
                                top: 0; left: 0;
                                width: 100%; height: 100%;
                                background-color: rgba(0, 0, 0, 0.5);
                                z-index: 1000;
                            }
                            .cart-drawer {
                                margin-right: 5px;
                                margin-top: 8px;
                                border-radius: 16px;
                                position: fixed;
                                top: 0; right: 0;
                                width: 97%;
                                height: 97%;
                                background: #fff;
                                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                                z-index: 1001;
                                display: flex;
                                flex-direction: column;
                                transition: right 0.3s ease;
                                border-left: none;
                            }
                            .cart-header {
                                display: flex;
                                justify-content: space-around;
                                flex-direction: column;
                                padding: 16px;
                                border-bottom: 1px solid #eee;
                            }
                            .cart-title {
                                font-size: 1.2rem;
                                font-weight: 700;
                                text-align: center;
                            }
                            .close-cart {
                                border: none;
                                background: none;
                                font-size: 1.5rem;
                                cursor: pointer;
                            }
                            .cart-content {
                                flex: 1;
                                overflow-y: auto;
                                padding: 16px;
                            }
                            .gift-section {
                                margin-top: 20px;
                                padding: 16px;
                                background-color: #f9f9f9;
                                border-radius: 8px;
                            }
                            .gift-section-title {
                                font-size: 18px;
                                font-weight: 600;
                                margin-bottom: 16px;
                                text-align: center;
                            }
                            .gift-items-container {
                                display: flex;
                                flex-direction: column;
                                gap: 12px;
                            }
                            .gift-item {
                                display: flex;
                                padding: 10px;
                                background-color: white;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                border: 1px solid #eee;
                            }
                            .gift-item-image {
                                width: 60px;
                                height: 60px;
                                margin-right: 10px;
                            }
                            .gift-item-image img {
                                width: 100%;
                                height: 100%;
                                object-fit: contain;
                            }
                            .gift-item-details {
                                flex: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                            }
                            .gift-item-title {
                                font-weight: 500;
                                font-size: 14px;
                                margin-bottom: 4px;
                            }
                            .gift-item-variant {
                                font-size: 12px;
                                color: #666;
                                margin-bottom: 4px;
                            }
                            .gift-item-price {
                                font-weight: 600;
                                color: #5c6ac4;
                                font-size: 14px;
                            }
                            .gift-badge {
                                background-color: #5c6ac4;
                                color: white;
                                font-size: 10px;
                                padding: 2px 6px;
                                border-radius: 4px;
                                margin-left: 8px;
                            }
                            .gift-item-actions {
                                display: flex;
                                align-items: center;
                                margin-top: 8px;
                            }
                            .add-to-cart-btn {
                                background-color: #5c6ac4;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                padding: 6px 12px;
                                font-size: 12px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: background-color 0.2s;
                            }
                            .dsicount-title {
                                font-size: 1rem;
                                font-weight: 700;
                                margin-bottom: 12px;
                                text-align: center;
                                color: #333;
                            }
                            .un-fill {
                                background: ${progressBarStyle.backgroundColor};
                                width: 100%;
                                height: 12px;
                                border-radius: 15px;
                                margin: 20px 0px;
                                overflow: hidden;
                                border: 1px solid #e0e0e0;
                            }
                            .fill {
                                background: #5A75F8;
                                height: 100%;
                                border-radius: 15px;
                            }
                            .cart-item {
                                display: flex;
                                padding: 12px 0;
                                border-bottom: 1px solid #eee;
                            }
                            .cart-item-image {
                                width: 80px; height: 80px;
                                margin-right: 12px;
                            }
                            .cart-item-image img {
                                width: 100%; height: 100%;
                                object-fit: contain;
                            }
                            .cart-item-title { font-weight: 600; margin-bottom: 4px; }
                            .cart-item-variant { font-size: 0.85rem; color: #666; margin-bottom: 4px; }
                            .cart-item-price { font-weight: 600; color: #5c6ac4; }
                            .cart-footer {
                                padding: 16px;
                                border-top: 1px solid #eee;
                            }
                            .cart-subtotal {
                                display: flex;
                                justify-content: space-between;
                                margin-bottom: 12px;
                                font-weight: 600;
                            }
                            .cart-buttons button {
                                width: 100%;
                                padding: 10px;
                                border-radius: 8px;
                                font-weight: 600;
                                margin-bottom: 8px;
                                cursor: pointer;
                            }
                            .view-cart {
                                background: #fff;
                                border: 1px solid #5c6ac4;
                                color: #5c6ac4;
                            }
                            .checkout {
                                background: #5c6ac4;
                                border: none;
                                color: #fff;
                                height: 60px;
                                font-weight: 700;
                                font-size: 24px;
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0 20px;
                            }
                            .multi_step_progress {
                                position: relative;
                                width: 100%;
                                margin: 20px 0;
                            }
                            .progress_step {
                                position: absolute;
                                top: 65px;
                                transform: translateX(-125%);
                                text-align: center;
                            }
                            .progress_step .circle {
                                border-radius: 50%;
                                font-size: 14px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #fff;
                            }
                            .progress_step .step_goal {
                                font-size: 12px;
                                margin-top: 4px;
                            }
                            .header-top {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 15px;
                            }
                            .discount-container {
                                text-align: center;
                                margin: 10px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="cart-drawer-overlay"></div>
                        <div class="cart-drawer">
                        <div>
              ${
                status.showConfetti === true
                  ? `
             <canvas id="confetti-canvas" style="
                position:fixed;
                top:0;left:0;
                width:100%;height:100%;
                pointer-events:none;
                z-index:2000;
              "></canvas>
              <script>
                (function() {
                  const script = document.createElement('script');
                  script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
                  script.onload = () => {
                    const canvas = document.getElementById("confetti-canvas");
                    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
                    function randomInRange(min, max) {
                      return Math.random() * (max - min) + min;
                    }
                    const end = Date.now() + 100;
                    (function frame() {
                      myConfetti({
                        angle: randomInRange(-100, -90),
                        spread: randomInRange(150, 150),
                        particleCount: randomInRange(10, 20),
                        origin: { y: 0.0 },
                      });
                      if (Date.now() < end) requestAnimationFrame(frame);
                    })();
                  };
                  document.body.appendChild(script);
                })();
              </script>
              `
                  : ""
              }
                           </div>
                                                        <div class="cart-header">
<div style="position: relative; text-align: center; margin-bottom: 25px;">
  <span
    class="cart-title"
    style="font-weight: 600; font-size: 16px; position: absolute; left: 50%; transform: translateX(-50%);"
  >
    Your Cart
  </span>

  <button
    class="close-cart"
    style="background: transparent; border: none; font-size: 20px; cursor: pointer; position: absolute; right: 0;"
  >
    &times;
  </button>
</div>

                                            <div class="discount-container">
                                                <div class="dsicount-title">${getDynamicCartText()}</div>
                                                <div class="un-fill"
                                                    style="
                                                        background: ${progressBarStyle.backgroundColor};
                                                        border-radius: ${progressBarStyle.cornerRadius === "square" ? "0px" : progressBarStyle.cornerRadius === "slightly" ? "4px" : "15px"};
                                                        height: ${barSize ? "7px" : "12px"};">
                                                <div
                                                class="fill"
                                                style="
                                                    width: ${progressPercentage}%;
                                                    background: ${progressPercentage >= 100 ? progressBarStyle.goalCompleteColor : progressBarStyle.primaryColor};
                                                    border-radius: ${progressBarStyle.cornerRadius === "square" ? "0px" : progressBarStyle.cornerRadius === "slightly" ? "4px" : "15px"};
                                                    height: ${barSize ? "100%" : "100%"};
                                                    transition: width 0.3s ease-in-out, height 0.3s ease-in-out, background 0.3s ease-in-out;
                                                "
                                                ></div>

${
  showBadges
    ? offerProgress
        .map(
          (offer) => `
          <div class="progress_step" style="left: ${Math.min(offer.percentage, 100)}%;">

              <div
                class="circle"
                style="
                  background: ${progressPercentage >= 100 ? progressBarStyle.goalCompleteColor : progressBarStyle.primaryColor};
                  width: 50px;
                  height: 50px;
                  border-radius: 50%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 600;
                  text-align: center;
                  font-size: 10px;
                  gap: 4px;
                  margin-top: 5px;
                "
              >

                  <img
                    src="${offer.badgeIconUrl ? offer.badgeIconUrl : offer.badgeIcon ? createObjectURL(offer.badgeIcon) : offer.icon}"
                    width="25px"
                    alt="${offer.rewardType} Icon"
                  />
              </div>

              <div class="step_goal" style="margin-top: 6px;">
                ${
                  offer.goalType === "quantity"
                    ? offer.goalquantity
                    : `${offer.currency}${offer.goalAmount}`
                }
              </div>
          </div>
        `,
        )
        .join("")
    : ""
}

                                                </div>

                                            </div>
                                        </div>
                                        <div class="cart-content">
${
  upsellselectedItems.length > 0
    ? upsellselectedItems
        .map(
          (item) => `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.media || save2}" alt="${item.title}" />
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-variant">Blue / M</div>
          <div class="cart-item-price">$${item.price}</div>
        </div>
      </div>
    `,
        )
        .join("")
    : `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${save2}" alt="Product" />
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">Sample Product</div>
          <div class="cart-item-variant">Blue / M</div>
          <div class="cart-item-price">$29.99</div>
        </div>
      </div>
    `
}
                                                    <div class="gift-section">
                <div class="gift-section-title">🎁 Gift Items</div>
                <div class="gift-items-container">
${
  offers.length > 0
    ? offers
        .map((offer) =>
          offer.rewardProducts && offer.rewardProducts.length > 0
            ? offer.rewardProducts
                .map(
                  (item) => `
                <div class="gift-item">
                    <div class="gift-item-image">
                        <img src="${item.media || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}" alt="${item.title}" />
                    </div>
                    <div class="gift-item-details">
                        <div class="gift-item-title">
                            ${item.title} <span class="gift-badge">FREE</span>
                        </div>
                        <div class="gift-item-actions">
                            <button class="add-to-cart-btn" data-product="${item.id}">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `,
                )
                .join("")
            : "",
        )
        .join("")
    : ""
}

                                      <div class="cart-footer">
                                            <div class="cart-subtotal">
                                                <span>Subtotal</span>
                                                <span>$${
                                                  upsellselectedItems.length > 0
                                                    ? upsellselectedItems
                                                        .reduce(
                                                          (total, item) =>
                                                            total +
                                                            parseFloat(
                                                              item.price || 0,
                                                            ),
                                                          0,
                                                        )
                                                        .toFixed(2)
                                                    : "29.99"
                                                }</span>
                                            </div>
                                            <div class="cart-buttons">
                                                <button class="checkout">Checkout . $${
                                                  upsellselectedItems.length > 0
                                                    ? upsellselectedItems
                                                        .reduce(
                                                          (total, item) =>
                                                            total +
                                                            parseFloat(
                                                              item.price || 0,
                                                            ),
                                                          0,
                                                        )
                                                        .toFixed(2)
                                                    : "29.99"
                                                }</button>
                                            </div>
                                        </div>
                                    </div>
                                </body>
                                </html>`}
              />
            </div>
          </BlockStack>
        </Card>
      );
    }

    return null;
  };

  // Memoize filtered campaign cards to avoid re-filtering on every render
  const filteredCampaignCards = useMemo(() => {
    if (!selectedCategory) return [];
    return CAMPAIGN_CARDS.filter(
      (card) => card.category === selectedCategory.type,
    );
  }, [selectedCategory]);

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
    setIsLoadingStep(true);
    if (step === 2) {
      setStep(1);
      setSelectedCategory(null);
      setTimeout(() => setIsLoadingStep(false), 50);
    } else if (step === 3) {
      setStep(2);
      setSelectedCard(null);
      setPlacement("");
      setDealType("");
      setTimeout(() => setIsLoadingStep(false), 50);
    }
  };

  const handleCardSelect = (card) => {
    console.log("Campaign card selected:", card);
    console.log("Card type:", card.type);
    setIsLoadingStep(true);
    setSelectedCard(card);
    // Use setTimeout to allow UI to update before heavy rendering
    setTimeout(() => {
      setStep(3); // Goes to configuration page
      setIsLoadingStep(false);
    }, 50);
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
      title: "Configuration",
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
      {isClient && (
        <SaveBar id={SAVE_BAR_ID}>
          <button
            variant="primary"
            onClick={handleSave}
            disabled={mainBtnLoading}
            loading={mainBtnLoading ? "" : undefined}
          >
            Save
          </button>
          <button onClick={handleDiscard} disabled={mainBtnLoading}>
            Discard
          </button>
        </SaveBar>
      )}
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
                          setIsLoadingStep(true);
                          setSelectedCategory(cat);
                          // Use setTimeout to allow UI to update before heavy rendering
                          setTimeout(() => {
                            setStep(2);
                            setIsLoadingStep(false);
                          }, 50);
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

          {isLoadingStep && (
            <Card sectioned>
              <BlockStack gap="300" align="center">
                <Text variant="bodyMd">Loading...</Text>
              </BlockStack>
            </Card>
          )}

          {!isLoadingStep && step === 2 && (
            <div>
              <Card sectioned>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Button variant="plain" onClick={handleBack}>
                      ← Back to Category
                    </Button>
                    <Text variant="headingMd" fontWeight="bold">
                      Step 2: Choose feature
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
                {filteredCampaignCards.map((card) => (
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

          {!isLoadingStep && step === 3 && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <Button variant="plain" onClick={handleBack}>
                  ← Back
                </Button>
              </div>

              {/* Two-column layout: Configuration on left, Preview on right */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  alignItems: "start",
                }}
              >
                {/* Left Column: Configuration Options */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    marginBottom: "20px",
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
                  <div style={{ marginBottom: "20px" }}>
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
                              You choose specific items for customers
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
                              Allow customers to choose items from your
                              selection
                            </Text>
                          </div>
                        </div>
                      </BlockStack>
                    </Card>
                  </div>

                  {/* Feature Configuration Section - Trigger Products */}
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Selected Products Upsell
                      </Text>
                      <Text as="p">
                        Choose which products will trigger the upsell offer.
                      </Text>
                      {!dealType && (
                        <Banner tone="warning">
                          <Text>
                            Please select a deal type above before configuring
                            trigger products.
                          </Text>
                        </Banner>
                      )}
                      {!placement && (
                        <Banner tone="info">
                          <Text>
                            Please select a placement above before choosing
                            trigger products.
                          </Text>
                        </Banner>
                      )}
                      <InlineStack gap="200">
                        <RadioButton
                          label="All products"
                          checked={selectedTriggerType === "all"}
                          name="triggerType"
                          disabled={!placement || !dealType}
                          onChange={() => {
                            setSelectedTriggerType("all");
                            setUpsell_allproduct(true);
                          }}
                        />
                        <RadioButton
                          label="Specific products"
                          checked={selectedTriggerType === "products"}
                          name="triggerType"
                          disabled={!placement || !dealType}
                          onChange={() => setSelectedTriggerType("products")}
                        />
                        <RadioButton
                          label="Specific collections"
                          checked={selectedTriggerType === "collections"}
                          name="triggerType"
                          disabled={!placement || !dealType}
                          onChange={() => setSelectedTriggerType("collections")}
                        />
                      </InlineStack>
                      {selectedTriggerType === "products" && (
                        <Box padding="200" borderStyle="base">
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingSm" fontWeight="bold">
                              Selected Products
                            </Text>
                            <InlineStack gap="200">
                              <Button
                                onClick={productpicker}
                                size="medium"
                                disabled={!placement || !dealType}
                                accessibilityLabel="Browse products for upsell"
                              >
                                Browse Products
                              </Button>
                            </InlineStack>
                            {filteredProducts.length > 0 ? (
                              <ResourceList
                                resourceName={{
                                  singular: "product",
                                  plural: "products",
                                }}
                                items={filteredProducts}
                                renderItem={(item) => {
                                  const { id, title, handle, price, media } =
                                    item;
                                  return (
                                    <ResourceItem id={id}>
                                      <InlineStack
                                        align="space-between"
                                        gap="300"
                                      >
                                        <InlineStack gap="300" align="center">
                                          {media && (
                                            <Image
                                              source={media}
                                              alt={title}
                                              width="60px"
                                            />
                                          )}
                                          <BlockStack>
                                            <Text fontWeight="bold">
                                              {title}
                                            </Text>
                                            <Text>Price: ${price}</Text>
                                            <Text>Handle: {handle}</Text>
                                          </BlockStack>
                                        </InlineStack>
                                        <Button
                                          tone="critical"
                                          onClick={() => removeProduct(id)}
                                          size="medium"
                                        >
                                          Remove
                                        </Button>
                                      </InlineStack>
                                    </ResourceItem>
                                  );
                                }}
                              />
                            ) : (
                              <Text>No matching products</Text>
                            )}
                          </BlockStack>
                        </Box>
                      )}
                      {selectedTriggerType === "collections" && (
                        <Box padding="200" borderStyle="base">
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingSm" fontWeight="bold">
                              Selected Collections
                            </Text>
                            <InlineStack gap="200">
                              <Button
                                onClick={collectionPicker}
                                size="medium"
                                disabled={!placement || !dealType}
                                accessibilityLabel="Browse collections for upsell"
                              >
                                Browse Collections
                              </Button>
                            </InlineStack>
                            {filteredCollections.length > 0 ? (
                              <ResourceList
                                resourceName={{
                                  singular: "collection",
                                  plural: "collections",
                                }}
                                items={filteredCollections}
                                renderItem={(item) => {
                                  const { id, title, handle } = item;
                                  return (
                                    <ResourceItem id={id}>
                                      <InlineStack
                                        align="space-between"
                                        gap="300"
                                      >
                                        <BlockStack>
                                          <Text fontWeight="bold">{title}</Text>
                                          <Text>Handle: {handle}</Text>
                                        </BlockStack>
                                        <Button
                                          tone="critical"
                                          onClick={() => removeCollection(id)}
                                          size="medium"
                                        >
                                          Remove
                                        </Button>
                                      </InlineStack>
                                    </ResourceItem>
                                  );
                                }}
                              />
                            ) : (
                              <Text>No matching collections</Text>
                            )}
                          </BlockStack>
                        </Box>
                      )}

                      <Box paddingBlockStart="200">
                        <BlockStack gap={"300"}>
                          <InlineStack align="space-between">
                            <label className="switch-container">
                              <input
                                type="checkbox"
                                checked={status.active}
                                onChange={(e) =>
                                  handleswitchChange("active", e.target.checked)
                                }
                                className="switch-input"
                              />
                              <span className="switch-slider"></span>
                            </label>
                            <Text as="h4" variant="headingMd">
                              Enable
                            </Text>
                          </InlineStack>
                          <InlineStack align="space-between">
                            <label className="switch-container">
                              <input
                                type="checkbox"
                                checked={status.showConfetti}
                                onChange={(e) =>
                                  handleswitchChange(
                                    "showConfetti",
                                    e.target.checked,
                                  )
                                }
                                className="switch-input"
                              />
                              <span className="switch-slider"></span>
                            </label>
                            <Text as="h4" variant="headingMd">
                              Show Confetti
                            </Text>
                          </InlineStack>
                          <InlineStack align="space-between">
                            <label className="switch-container">
                              <input
                                type="checkbox"
                                className="switch-input"
                                checked={showBadges}
                                onChange={handleToggle}
                              />
                              <span className="switch-slider"></span>
                            </label>

                            <Text as="h4" variant="headingMd">
                              {showBadges ? "Hide Badges" : "Show Badges"}
                            </Text>
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    </BlockStack>
                  </Card>

                  {/* Block Products Section - Only show if placement is not cart */}
                  {placement !== "cart" && (
                    <Card>
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingMd" fontWeight="bold">
                          Block Products{" "}
                          <Text tone="subdued" variant="bodySm">
                            (Optional)
                          </Text>
                        </Text>
                        <Text as="p">
                          Choose which products will appear in the upsell block.
                          These are the products customers will see in the
                          upsell widget. If not selected, trigger products will
                          be shown.
                        </Text>
                        {!placement && (
                          <Banner tone="info">
                            <Text>
                              Please select a placement above before choosing
                              block products.
                            </Text>
                          </Banner>
                        )}
                        {!dealType && (
                          <Banner tone="warning">
                            <Text>
                              Please select a deal type above before configuring
                              block products.
                            </Text>
                          </Banner>
                        )}
                        <InlineStack gap="200">
                          <RadioButton
                            label="All Products"
                            checked={blockProductSelectionType === "all"}
                            name="blockProductType"
                            disabled={!placement || !dealType}
                            onChange={() => {
                              setBlockProductSelectionType("all");
                              setBlockProducts([]);
                              setBlockProductCollections([]);
                            }}
                          />
                          <RadioButton
                            label="Specific Products"
                            checked={blockProductSelectionType === "products"}
                            name="blockProductType"
                            disabled={!placement || !dealType}
                            onChange={() => {
                              setBlockProductSelectionType("products");
                              setBlockProductCollections([]);
                            }}
                          />
                          <RadioButton
                            label="Specific Collections"
                            checked={
                              blockProductSelectionType === "collections"
                            }
                            name="blockProductType"
                            disabled={!placement || !dealType}
                            onChange={() => {
                              setBlockProductSelectionType("collections");
                              setBlockProducts([]);
                            }}
                          />
                        </InlineStack>
                        {blockProductSelectionType === "products" && (
                          <Box padding="200" borderStyle="base">
                            <BlockStack gap="200">
                              <Text
                                as="h3"
                                variant="headingSm"
                                fontWeight="bold"
                              >
                                Selected Block Products
                              </Text>
                              <InlineStack gap="200">
                                <Button
                                  onClick={blockProductPicker}
                                  size="medium"
                                  disabled={!placement || !dealType}
                                  accessibilityLabel="Browse products for upsell block"
                                >
                                  Browse Block Products
                                </Button>
                              </InlineStack>
                              {filteredBlockProducts.length > 0 ? (
                                <ResourceList
                                  resourceName={{
                                    singular: "block product",
                                    plural: "block products",
                                  }}
                                  items={filteredBlockProducts}
                                  renderItem={(item) => {
                                    const { id, title, handle, price, media } =
                                      item;
                                    return (
                                      <ResourceItem id={id}>
                                        <InlineStack
                                          align="space-between"
                                          gap="300"
                                        >
                                          <InlineStack gap="300" align="center">
                                            {media && (
                                              <Image
                                                source={media}
                                                alt={title}
                                                width="60px"
                                              />
                                            )}
                                            <BlockStack>
                                              <Text fontWeight="bold">
                                                {title}
                                              </Text>
                                              <Text>Price: ${price}</Text>
                                              <Text>Handle: {handle}</Text>
                                            </BlockStack>
                                          </InlineStack>
                                          <Button
                                            tone="critical"
                                            onClick={() =>
                                              removeBlockProduct(id)
                                            }
                                            size="medium"
                                          >
                                            Remove
                                          </Button>
                                        </InlineStack>
                                      </ResourceItem>
                                    );
                                  }}
                                />
                              ) : (
                                <Text>
                                  No block products selected. Products shown in
                                  the upsell block will be the trigger products.
                                </Text>
                              )}
                            </BlockStack>
                          </Box>
                        )}
                        {blockProductSelectionType === "collections" && (
                          <Box padding="200" borderStyle="base">
                            <BlockStack gap="200">
                              <Text
                                as="h3"
                                variant="headingSm"
                                fontWeight="bold"
                              >
                                Selected Block Collections
                              </Text>
                              <InlineStack gap="200">
                                <Button
                                  onClick={blockCollectionPicker}
                                  size="medium"
                                  disabled={!placement || !dealType}
                                  accessibilityLabel="Browse collections for upsell block"
                                >
                                  Browse Block Collections
                                </Button>
                              </InlineStack>
                              {blockProductCollections.length > 0 ? (
                                <ResourceList
                                  resourceName={{
                                    singular: "block collection",
                                    plural: "block collections",
                                  }}
                                  items={blockProductCollections}
                                  renderItem={(item) => {
                                    const { id, title, handle } = item;
                                    return (
                                      <ResourceItem id={id}>
                                        <InlineStack
                                          align="space-between"
                                          gap="300"
                                        >
                                          <BlockStack>
                                            <Text fontWeight="bold">
                                              {title}
                                            </Text>
                                            <Text>Handle: {handle}</Text>
                                          </BlockStack>
                                          <Button
                                            tone="critical"
                                            onClick={() =>
                                              removeBlockCollection(id)
                                            }
                                            size="medium"
                                          >
                                            Remove
                                          </Button>
                                        </InlineStack>
                                      </ResourceItem>
                                    );
                                  }}
                                />
                              ) : (
                                <Text>
                                  No block collections selected. Products shown
                                  in the upsell block will be the trigger
                                  products.
                                </Text>
                              )}
                            </BlockStack>
                          </Box>
                        )}
                      </BlockStack>
                    </Card>
                  )}

                  {/* Offers Section */}
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd" as="h2">
                        Offers
                      </Text>
                      <Button
                        icon={PlusIcon}
                        onClick={addOffer}
                        variant="primary"
                        disabled={!dealType}
                        accessibilityLabel="Add new offer"
                      >
                        Add Offer
                      </Button>
                    </InlineStack>
                    {!dealType && (
                      <Banner tone="warning">
                        <Text>
                          Please select a deal type above before adding offers.
                        </Text>
                      </Banner>
                    )}

                    {offers.map((offer, index) => (
                      <Card key={offer.id} sectioned background="">
                        <BlockStack gap="300">
                          <InlineStack align="space-between">
                            <Text variant="headingMd" as="h3">
                              Offer {index + 1}
                            </Text>
                            {offers.length > 1 && (
                              <Button
                                icon={DeleteIcon}
                                tone="critical"
                                onClick={() => removeOffer(offer.id)}
                                accessibilityLabel={`Remove offer ${index + 1}`}
                              >
                                Remove
                              </Button>
                            )}
                          </InlineStack>

                          <Card sectioned>
                            <BlockStack gap="300">
                              <Text variant="headingMd" as="h3">
                                Goal Configuration
                              </Text>
                              <Box paddingBlockStart="200">
                                <BlockStack gap={"300"}>
                                  <InlineStack
                                    gap="200"
                                    blockAlign="center"
                                    wrap={false}
                                  >
                                    {goalOptions.map((type) => (
                                      <Button
                                        key={type.value}
                                        pressed={offer.goalType === type.value}
                                        onClick={() =>
                                          updateOffer(
                                            offer.id,
                                            "goalType",
                                            type.value,
                                          )
                                        }
                                        size="medium"
                                      >
                                        {type.label}
                                      </Button>
                                    ))}
                                  </InlineStack>
                                </BlockStack>
                              </Box>
                              {offer.goalType === "amount_cart" && (
                                <BlockStack gap="200">
                                  <Select
                                    label="Currency"
                                    options={currencyOptions}
                                    value={offer.currency}
                                    onChange={(value) =>
                                      updateOffer(offer.id, "currency", value)
                                    }
                                  />
                                  <TextField
                                    label="Cart Total Goal"
                                    type="number"
                                    value={offer.goalAmount}
                                    onChange={(value) => {
                                      updateOffer(
                                        offer.id,
                                        "goalAmount",
                                        value,
                                      );
                                    }}
                                    prefix={offer.currency}
                                    requiredIndicator
                                    helpText="Set the minimum cart total required to unlock the reward"
                                    error={
                                      !offer.goalAmount
                                        ? "Cart total goal is required"
                                        : ""
                                    }
                                  />
                                </BlockStack>
                              )}
                              {offer.goalType === "quantity" && (
                                <TextField
                                  label="Product Quantity Goal"
                                  type="number"
                                  min={1}
                                  value={offer.goalquantity}
                                  onChange={(value) => {
                                    updateOffer(
                                      offer.id,
                                      "goalquantity",
                                      value,
                                    );
                                  }}
                                  requiredIndicator
                                  helpText="How many products need to be added to the cart to unlock the reward"
                                  error={
                                    !offer.goalquantity
                                      ? "Quantity goal is required"
                                      : ""
                                  }
                                />
                              )}
                            </BlockStack>
                          </Card>

                          <Card sectioned>
                            <BlockStack gap="300">
                              <Text variant="headingMd" as="h3">
                                Reward Type
                              </Text>

                              {offer.rewardMode === "fixed" && (
                                <BlockStack gap="200">
                                  <ChoiceList
                                    choices={[
                                      { label: "Discount", value: "discount" },
                                      {
                                        label: "Free Shipping",
                                        value: "shipping",
                                      },
                                      {
                                        label: "Free Gift",
                                        value: "gift",
                                      },
                                    ]}
                                    selected={[offer.rewardType]}
                                    onChange={(value) => {
                                      const rewardType = value[0];
                                      updateOfferBatch(offer.id, {
                                        rewardType: rewardType,
                                        rewardTypeName:
                                          rewardType === "discount"
                                            ? "Fixed Discount"
                                            : rewardType === "shipping"
                                              ? "Free Shipping"
                                              : "Free Gift",
                                      });
                                    }}
                                  />
                                </BlockStack>
                              )}

                              {offer.rewardMode === "flame" && (
                                <BlockStack gap="200">
                                  <Banner tone="info">
                                    <Text fontWeight="medium">
                                      Flame Match: Customers can choose their
                                      preferred reward from available options
                                    </Text>
                                  </Banner>
                                  <ChoiceList
                                    choices={[
                                      { label: "Discount", value: "discount" },
                                      {
                                        label: "Free Shipping",
                                        value: "shipping",
                                      },
                                      {
                                        label: "Free Gift",
                                        value: "gift",
                                      },
                                    ]}
                                    selected={[offer.rewardType]}
                                    onChange={(value) => {
                                      const rewardType = value[0];
                                      updateOfferBatch(offer.id, {
                                        rewardType: rewardType,
                                        rewardTypeName:
                                          rewardType === "discount"
                                            ? "Flame Match Discount"
                                            : rewardType === "shipping"
                                              ? "Free Shipping"
                                              : "Customer Choice Gift",
                                      });
                                    }}
                                  />
                                </BlockStack>
                              )}
                            </BlockStack>
                          </Card>

                          <Card sectioned>
                            <BlockStack gap="300">
                              <Text variant="headingMd" as="h3">
                                Reward Product
                              </Text>
                              {offer.rewardType === "discount" && (
                                <BlockStack gap="300">
                                  <TextField
                                    label="Discount Value"
                                    placeholder="10, 20, etc."
                                    value={offer.discountCode}
                                    onChange={(value) =>
                                      updateOffer(
                                        offer.id,
                                        "discountCode",
                                        value,
                                      )
                                    }
                                    type="number"
                                    error={
                                      !offer.discountCode
                                        ? "Discount value is required"
                                        : ""
                                    }
                                  />
                                  <Select
                                    label="Discount Type"
                                    options={[
                                      {
                                        label: "Percentage (%)",
                                        value: "percentage",
                                      },
                                      {
                                        label: "Fixed Amount ($)",
                                        value: "amount",
                                      },
                                    ]}
                                    value={offer.discountType}
                                    onChange={(value) =>
                                      updateOffer(
                                        offer.id,
                                        "discountType",
                                        value,
                                      )
                                    }
                                  />
                                  {(() => {
                                    const currentDealType =
                                      dealType || offer.rewardMode;
                                    const isFixedDeal =
                                      currentDealType === "fixed" ||
                                      offer.rewardMode === "fixed";
                                    const isFlameMatch =
                                      currentDealType === "flame" ||
                                      offer.rewardMode === "flame";

                                    if (isFixedDeal) {
                                      return (
                                        <BlockStack gap="300">
                                          <Banner tone="info">
                                            <Text fontWeight="medium">
                                              Fixed Deal: Only 1 product in the
                                              chosen reward category (fixed
                                              deal).
                                            </Text>
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                            >
                                              Selected:{" "}
                                              {offer.rewardProducts.length}/1
                                            </Text>
                                          </Banner>
                                          <Button
                                            onClick={() =>
                                              rewardPicker(offer.id)
                                            }
                                            variant="primary"
                                            size="medium"
                                            disabled={
                                              offer.rewardProducts.length >= 1
                                            }
                                          >
                                            {offer.rewardProducts.length >= 1
                                              ? "1 Product Selected (Max Reached)"
                                              : "Select Reward Product "}
                                          </Button>
                                          {offer.rewardProducts.length > 0 && (
                                            <Box paddingBlockStart="200">
                                              <Text fontWeight="semibold">
                                                Selected Reward Product:
                                              </Text>
                                              <BlockStack gap="100">
                                                {offer.rewardProducts.map(
                                                  (item) => (
                                                    <InlineStack
                                                      key={item.id}
                                                      align="space-between"
                                                      blockAlign="center"
                                                    >
                                                      <Text>{item.title}</Text>
                                                      <Button
                                                        tone="critical"
                                                        size="medium"
                                                        onClick={() =>
                                                          removeRewardProduct(
                                                            offer.id,
                                                            item.id,
                                                          )
                                                        }
                                                      >
                                                        Remove
                                                      </Button>
                                                    </InlineStack>
                                                  ),
                                                )}
                                              </BlockStack>
                                            </Box>
                                          )}
                                        </BlockStack>
                                      );
                                    }

                                    if (isFlameMatch) {
                                      return (
                                        <BlockStack gap="300">
                                          <Banner
                                            tone={
                                              offer.rewardProducts.length >= 2
                                                ? "success"
                                                : "warning"
                                            }
                                          >
                                            <Text fontWeight="medium">
                                              Flame Match: At least 2 reward
                                              products are required (2-20
                                              products).
                                            </Text>
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                            >
                                              Selected:{" "}
                                              {offer.rewardProducts.length}/2
                                              (minimum)
                                            </Text>
                                          </Banner>
                                          <Button
                                            onClick={() =>
                                              rewardPicker(offer.id)
                                            }
                                            variant="primary"
                                            size="medium"
                                            disabled={
                                              offer.rewardProducts.length >= 20
                                            }
                                          >
                                            {offer.rewardProducts.length >= 20
                                              ? "20 Products Selected (Max Reached)"
                                              : "Select Reward Products"}
                                          </Button>
                                          {offer.rewardProducts.length > 0 && (
                                            <Box paddingBlockStart="200">
                                              <Text fontWeight="semibold">
                                                Selected Reward Products (
                                                {offer.rewardProducts.length}):
                                              </Text>
                                              <BlockStack gap="100">
                                                {offer.rewardProducts.map(
                                                  (item) => (
                                                    <InlineStack
                                                      key={item.id}
                                                      align="space-between"
                                                      blockAlign="center"
                                                    >
                                                      <Text>{item.title}</Text>
                                                      <Button
                                                        tone="critical"
                                                        size="medium"
                                                        onClick={() =>
                                                          removeRewardProduct(
                                                            offer.id,
                                                            item.id,
                                                          )
                                                        }
                                                      >
                                                        Remove
                                                      </Button>
                                                    </InlineStack>
                                                  ),
                                                )}
                                              </BlockStack>
                                            </Box>
                                          )}
                                        </BlockStack>
                                      );
                                    }

                                    return null;
                                  })()}
                                </BlockStack>
                              )}
                              {offer.rewardType === "shipping" && (
                                <BlockStack gap="300">
                                  <Banner tone="success">
                                    Free shipping will be automatically applied
                                    to Selected Trigger Products
                                  </Banner>
                                </BlockStack>
                              )}
                              {offer.rewardType === "gift" && (
                                <BlockStack gap="300">
                                  {(() => {
                                    const currentDealType =
                                      dealType || offer.rewardMode;
                                    const isFixedDeal =
                                      currentDealType === "fixed" ||
                                      offer.rewardMode === "fixed";
                                    const isFlameMatch =
                                      currentDealType === "flame" ||
                                      offer.rewardMode === "flame";

                                    return (
                                      <>
                                        {isFixedDeal && (
                                          <Banner tone="info">
                                            <Text fontWeight="medium">
                                              Fixed Deal: Only 1 product in the
                                              chosen reward category (fixed
                                              deal).
                                            </Text>
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                            >
                                              Selected:{" "}
                                              {offer.rewardSelectionType ===
                                              "products"
                                                ? `${offer.rewardProducts.length}/1`
                                                : offer.rewardSelectionType ===
                                                    "collections"
                                                  ? `${offer.rewardCollection?.length || 0} collection(s)`
                                                  : "All Products"}
                                            </Text>
                                          </Banner>
                                        )}
                                        {isFlameMatch && (
                                          <Banner
                                            tone={
                                              (offer.rewardSelectionType ===
                                                "products" &&
                                                offer.rewardProducts.length >=
                                                  2) ||
                                              (offer.rewardSelectionType ===
                                                "collections" &&
                                                offer.rewardCollection?.length >
                                                  0) ||
                                              offer.rewardSelectionType ===
                                                "all"
                                                ? "success"
                                                : "warning"
                                            }
                                          >
                                            <Text fontWeight="medium">
                                              Flame Match: At least 2 reward
                                              products are required (2-20
                                              products).
                                            </Text>
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                            >
                                              Selected:{" "}
                                              {offer.rewardSelectionType ===
                                              "products"
                                                ? `${offer.rewardProducts.length}/2 (minimum)`
                                                : offer.rewardSelectionType ===
                                                    "collections"
                                                  ? `${offer.rewardCollection?.length || 0} collection(s)`
                                                  : "All Products"}
                                            </Text>
                                          </Banner>
                                        )}
                                      </>
                                    );
                                  })()}

                                  <Text variant="bodySm" fontWeight="medium">
                                    Choose what to include in the reward
                                    selection:
                                  </Text>
                                  <InlineStack gap="200">
                                    <RadioButton
                                      label="All Products"
                                      checked={
                                        offer.rewardSelectionType === "all"
                                      }
                                      name={`rewardSelectionType-${offer.id}`}
                                      onChange={() => {
                                        updateOffer(
                                          offer.id,
                                          "rewardSelectionType",
                                          "all",
                                        );
                                      }}
                                    />
                                    <RadioButton
                                      label="Specific Products"
                                      checked={
                                        offer.rewardSelectionType === "products"
                                      }
                                      name={`rewardSelectionType-${offer.id}`}
                                      onChange={() => {
                                        updateOffer(
                                          offer.id,
                                          "rewardSelectionType",
                                          "products",
                                        );
                                      }}
                                    />
                                    <RadioButton
                                      label="Specific Collections"
                                      checked={
                                        offer.rewardSelectionType ===
                                        "collections"
                                      }
                                      name={`rewardSelectionType-${offer.id}`}
                                      onChange={() => {
                                        updateOffer(
                                          offer.id,
                                          "rewardSelectionType",
                                          "collections",
                                        );
                                      }}
                                    />
                                  </InlineStack>

                                  {offer.rewardSelectionType === "products" && (
                                    <>
                                      <Button
                                        onClick={() => rewardPicker(offer.id)}
                                        variant="primary"
                                        size="medium"
                                        disabled={
                                          (dealType === "fixed" ||
                                            offer.rewardMode === "fixed") &&
                                          offer.rewardProducts.length >= 1
                                        }
                                      >
                                        {(() => {
                                          const currentDealType =
                                            dealType || offer.rewardMode;
                                          const isFixedDeal =
                                            currentDealType === "fixed" ||
                                            offer.rewardMode === "fixed";
                                          if (
                                            isFixedDeal &&
                                            offer.rewardProducts.length >= 1
                                          ) {
                                            return "1 Product Selected (Max Reached)";
                                          }
                                          return "Select Reward Products";
                                        })()}
                                      </Button>
                                      {offer.rewardProducts.length > 0 && (
                                        <Box paddingBlockStart="200">
                                          <Text fontWeight="semibold">
                                            Selected Reward Products (
                                            {offer.rewardProducts.length}):
                                          </Text>
                                          <BlockStack gap="100">
                                            {offer.rewardProducts.map(
                                              (item) => (
                                                <InlineStack
                                                  key={item.id}
                                                  align="space-between"
                                                  blockAlign="center"
                                                >
                                                  <Text>{item.title}</Text>
                                                  <Button
                                                    tone="critical"
                                                    size="medium"
                                                    onClick={() =>
                                                      removeRewardProduct(
                                                        offer.id,
                                                        item.id,
                                                      )
                                                    }
                                                  >
                                                    Remove
                                                  </Button>
                                                </InlineStack>
                                              ),
                                            )}
                                          </BlockStack>
                                        </Box>
                                      )}
                                    </>
                                  )}

                                  {offer.rewardSelectionType ===
                                    "collections" && (
                                    <>
                                      <Button
                                        onClick={() =>
                                          rewardCollectionPicker(offer.id)
                                        }
                                        variant="primary"
                                        size="medium"
                                      >
                                        Select Reward Collections
                                      </Button>
                                      {offer.rewardCollection &&
                                        offer.rewardCollection.length > 0 && (
                                          <Box paddingBlockStart="200">
                                            <Text fontWeight="semibold">
                                              Selected Reward Collections (
                                              {offer.rewardCollection.length}):
                                            </Text>
                                            <BlockStack gap="100">
                                              {offer.rewardCollection.map(
                                                (item) => (
                                                  <InlineStack
                                                    key={item.id}
                                                    align="space-between"
                                                    blockAlign="center"
                                                  >
                                                    <Text>{item.title}</Text>
                                                    <Button
                                                      tone="critical"
                                                      size="medium"
                                                      onClick={() =>
                                                        removeRewardCollection(
                                                          offer.id,
                                                          item.id,
                                                        )
                                                      }
                                                    >
                                                      Remove
                                                    </Button>
                                                  </InlineStack>
                                                ),
                                              )}
                                            </BlockStack>
                                          </Box>
                                        )}
                                    </>
                                  )}
                                </BlockStack>
                              )}
                            </BlockStack>
                          </Card>

                          <Card sectioned>
                            <BlockStack gap="300">
                              <Text variant="headingMd" as="h3">
                                Goal Text Customization
                              </Text>
                              <TextField
                                label="Before Goal is Reached"
                                value={offer.goalTextBefore}
                                onChange={(value) =>
                                  updateOffer(offer.id, "goalTextBefore", value)
                                }
                                helpText="Use smart variables: {{goal}}, {{amount_left}}, {{reward}}"
                              />
                              <TextField
                                label="After Goal is Reached"
                                value={offer.goalTextAfter}
                                onChange={(value) =>
                                  updateOffer(offer.id, "goalTextAfter", value)
                                }
                                helpText="Use smart variables: {{goal}}, {{reward}}"
                              />
                              <Box>
                                <Text as="p">Badge Icon</Text>
                                <input
                                  type="file"
                                  onChange={(event) =>
                                    handleBadgeIconChange(offer.id, event)
                                  }
                                  style={{ marginTop: "8px" }}
                                />
                                {(offer.badgeIconUrl || offer.badgeIcon) && (
                                  <Box paddingBlockStart="200">
                                    <Text fontWeight="semibold">
                                      Selected Badge Icon:
                                    </Text>
                                    <InlineStack
                                      align="space-between"
                                      blockAlign="center"
                                    >
                                      <Image
                                        source={
                                          offer.badgeIconUrl
                                            ? offer.badgeIconUrl
                                            : offer.badgeIcon
                                              ? createObjectURL(offer.badgeIcon)
                                              : ""
                                        }
                                        alt="Badge Icon Preview"
                                        width="50px"
                                      />
                                      <Button
                                        tone="critical"
                                        size="medium"
                                        onClick={() => {
                                          updateOffer(
                                            offer.id,
                                            "badgeIcon",
                                            null,
                                          );
                                          updateOffer(
                                            offer.id,
                                            "badgeIconUrl",
                                            null,
                                          );
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    </InlineStack>
                                  </Box>
                                )}
                              </Box>
                            </BlockStack>
                          </Card>
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>

                  {/* Progress Bar Customization */}
                  <Card sectioned>
                    <Box
                      minHeight="350px"
                      padding={"150"}
                      background="white"
                      borderRadius="10px"
                      boxShadow="0 0 10px 0 rgba(107, 107, 107, 0.1)"
                    >
                      <BlockStack gap="300">
                        <InlineStack gap="200">
                          <h2
                            style={{
                              fontSize: "14px",
                              color: "grey",
                              fontWeight: "600",
                            }}
                          >
                            Progress Bar Colors
                          </h2>
                          <div
                            style={{
                              display: "flex",
                              width: "100%",
                              marginBottom: "16px",
                            }}
                          >
                            {/* Primary color */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                position: "relative",
                              }}
                            >
                              <button
                                data-color-button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenColorPicker(
                                    openColorPicker === "primary"
                                      ? null
                                      : "primary",
                                  );
                                }}
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  backgroundColor:
                                    progressBarStyle.primaryColor,
                                  border: "1px solid #d1d5db",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  padding: 0,
                                  boxShadow:
                                    openColorPicker === "primary"
                                      ? "0 0 0 2px #0066cc"
                                      : "none",
                                }}
                              />
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontWeight: 700,
                                  fontSize: "15px",
                                }}
                              >
                                Primary
                              </span>
                              {openColorPicker === "primary" && (
                                <div
                                  data-color-picker
                                  style={{
                                    position: "absolute",
                                    zIndex: 1000,
                                    top: "0px",
                                    left: "50px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SketchPicker
                                    color={progressBarStyle.primaryColor}
                                    onChange={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        primaryColor: color.hex,
                                      }));
                                    }}
                                    onChangeComplete={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        primaryColor: color.hex,
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Secondary color */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                position: "relative",
                                marginLeft: "130px",
                              }}
                            >
                              <button
                                data-color-button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenColorPicker(
                                    openColorPicker === "secondary"
                                      ? null
                                      : "secondary",
                                  );
                                }}
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  backgroundColor:
                                    progressBarStyle.secondaryColor,
                                  border: "1px solid #d1d5db",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  padding: 0,
                                  boxShadow:
                                    openColorPicker === "secondary"
                                      ? "0 0 0 2px #0066cc"
                                      : "none",
                                }}
                              />
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontWeight: 700,
                                  fontSize: "15px",
                                }}
                              >
                                Secondary
                              </span>
                              {openColorPicker === "secondary" && (
                                <div
                                  data-color-picker
                                  style={{
                                    position: "absolute",
                                    zIndex: 1000,
                                    top: "0px",
                                    left: "50px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SketchPicker
                                    color={progressBarStyle.secondaryColor}
                                    onChange={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        secondaryColor: color.hex,
                                      }));
                                    }}
                                    onChangeComplete={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        secondaryColor: color.hex,
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: "flex", width: "100%" }}>
                            {/* Goal complete color */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                position: "relative",
                              }}
                            >
                              <button
                                data-color-button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenColorPicker(
                                    openColorPicker === "goalComplete"
                                      ? null
                                      : "goalComplete",
                                  );
                                }}
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  backgroundColor:
                                    progressBarStyle.goalCompleteColor,
                                  border: "1px solid #d1d5db",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  padding: 0,
                                  boxShadow:
                                    openColorPicker === "goalComplete"
                                      ? "0 0 0 2px #0066cc"
                                      : "none",
                                }}
                              />
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontWeight: 700,
                                  fontSize: "15px",
                                }}
                              >
                                Goal complete
                              </span>
                              {openColorPicker === "goalComplete" && (
                                <div
                                  data-color-picker
                                  style={{
                                    position: "absolute",
                                    zIndex: 1000,
                                    top: "-70px",
                                    left: "50px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SketchPicker
                                    color={progressBarStyle.goalCompleteColor}
                                    onChange={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        goalCompleteColor: color.hex,
                                      }));
                                    }}
                                    onChangeComplete={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        goalCompleteColor: color.hex,
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Background color */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                position: "relative",
                                marginLeft: "82px",
                              }}
                            >
                              <button
                                data-color-button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenColorPicker(
                                    openColorPicker === "background"
                                      ? null
                                      : "background",
                                  );
                                }}
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  backgroundColor:
                                    progressBarStyle.backgroundColor,
                                  border: "1px solid #d1d5db",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  padding: 0,
                                  boxShadow:
                                    openColorPicker === "background"
                                      ? "0 0 0 2px #0066cc"
                                      : "none",
                                }}
                              />
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontWeight: 700,
                                  fontSize: "15px",
                                }}
                              >
                                Background
                              </span>
                              {openColorPicker === "background" && (
                                <div
                                  data-color-picker
                                  style={{
                                    position: "absolute",
                                    zIndex: 1000,
                                    top: "-70px",
                                    left: "50px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SketchPicker
                                    color={progressBarStyle.backgroundColor}
                                    onChange={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        backgroundColor: color.hex,
                                      }));
                                    }}
                                    onChangeComplete={(color) => {
                                      setProgressBarStyle((prev) => ({
                                        ...prev,
                                        backgroundColor: color.hex,
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </InlineStack>

                        <Text variant="headingMd" as="h3">
                          Design Customization
                        </Text>

                        <Select
                          label="Progress Bar Thickness"
                          options={[
                            { label: "Thin", value: "thin" },
                            { label: "Thick", value: "thick" },
                          ]}
                          value={progressBarStyle.thickness || "thick"}
                          onChange={(value) => {
                            setProgressBarStyle((prev) => ({
                              ...prev,
                              thickness: value,
                            }));

                            if (value === "thin") {
                              setBarSize(true);
                            } else {
                              setBarSize(false);
                            }
                          }}
                        />
                        <Select
                          label="Corner Radius"
                          options={[
                            { label: "Square", value: "square" },
                            { label: "Slightly Rounded", value: "slightly" },
                            { label: "Fully Rounded", value: "rounded" },
                          ]}
                          value={progressBarStyle.cornerRadius}
                          onChange={(value) =>
                            setProgressBarStyle((prev) => ({
                              ...prev,
                              cornerRadius: value,
                            }))
                          }
                        />
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* Save Button */}
                  <Box padding={"200"}>
                    <BlockStack>
                      <InlineStack gap="200">
                        <Button
                          loading={mainBtnLoading}
                          variant="primary"
                          onClick={handleSave}
                        >
                          {mainBtnLoading ? "Saving..." : "Save Campaign"}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleDiscard}
                          disabled={mainBtnLoading}
                        >
                          Cancel
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Box>
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
                  <BlockStack gap="300">
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
                </div>
              </div>
            </div>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
