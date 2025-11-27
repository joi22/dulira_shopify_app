import { useState, useEffect, useRef, useCallback } from "react";
import home_icon from "./_index/media/icon-home.png";
import save from "./_index/media/save-1.jpg";
import save2 from "./_index/media/save-2.png";
import gift from "./_index/media/gift.png";
import free from "./_index/media/shipping.png";
import discou from "./_index/media/disc.png";
import "./_index/style.css";
import "./_index/home.css";
import "./_index/preview-styles.css";
import "./components/RewardsCard";
import {
  Page,
  FormLayout,
  Layout,
  BlockStack,
  Card,
  TextField,
  Divider,
  InlineStack,
  Box,
  ResourceList,
  ResourceItem,
  Button,
  Image,
  ChoiceList,
  Text,
  Select,
  Banner,
  Modal,
  RadioButton,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useFetcher, useLocation, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { add_to_unlock_ } from "./utils/add_unlock";
import HomeSectionPreview from "./components/preview/HomeSectionPreview";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import pakg from "react-color";
const SketchPicker = pakg;
const SHOPIFY_API_VERSION = "2025-07";

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    title
    handle
    media(first: 1) {
      edges {
        node {
          preview {
            image {
              url
            }
          }
        }
      }
    }
    variants(first: 1) {
      edges {
        node {
          id
          title
          price
          image {
            url
          }
        }
      }
    }
  }
`;

const trigger_coll = async (collectionIds, shop, accessToken, campaignId) => {
  try {
    for (const colId of collectionIds) {
      const gid = `gid://shopify/Collection/${colId}`;
      const gql = `
        ${PRODUCT_FRAGMENT}
        query($id: ID!) {
          collection(id: $id) {
            products(first: 200) {
              edges {
                node {
                  ...ProductFields
                }
              }
            }
          }
        }
      `;
      const response = await fetch(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query: gql, variables: { id: gid } }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (!result?.data?.collection?.products?.edges) {
        console.warn(`No products found for collection ${colId}`);
        continue;
      }

      const products = result.data.collection.products.edges;
      const productData = products.map(({ node }) => ({
        campaignId,
        productId: node.id.split("/").pop(),
        productTitle: node.title,
        handle: node.handle,
        price: node.variants?.edges?.[0]?.node?.price || "0",
        media: node.media?.edges?.[0]?.node?.preview?.image?.url || null,
      }));

      if (productData.length > 0) {
        await prisma.upsellTriggerProduct.createMany({
          data: productData,
        });
      }
    }
  } catch (error) {
    console.error(
      `Error in trigger_coll for collection ${collectionIds}:`,
      error,
    );
    throw error;
  }
};

const trigger_all = async (
  shop,
  upsell_allproducts,
  accessToken,
  campaignId,
) => {
  try {
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const gql = `
        query($cursor: String) {
          products(first: 250, after: $cursor) {
            edges {
              cursor
              node {
                id
                title
                handle
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price
                    }
                  }
                }
                media(first: 1) {
                  edges {
                    node {
                      preview {
                        image {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query: gql, variables: { cursor } }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      const products = result?.data?.products?.edges || [];

      if (!products.length) {
        console.warn("No products returned.");
        break;
      }

      const productData = products.map(({ node }) => ({
        campaignId,
        productId: node.id.split("/").pop(),
        productTitle: node.title,
        handle: node.handle,
        variantId: node.variants.edges?.[0]?.node?.id.split("/").pop() || null,
        price: node.variants?.edges?.[0]?.node?.price || "0",
        media: node.media?.edges?.[0]?.node?.preview?.image?.url || null,
      }));

      // ⚡ Insert into DB
      if (productData.length > 0) {
        await prisma.upsellTriggerProduct.createMany({
          data: productData,
          skipDuplicates: true, // ✅ avoids duplicate rows if run again
        });
      }

      // pagination info
      hasNextPage = result?.data?.products?.pageInfo?.hasNextPage || false;
      cursor = result?.data?.products?.pageInfo?.endCursor || null;
    }
  } catch (error) {
    console.error("Error in trigger_all:", error);
    throw error;
  }
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const { shop, accessToken } = session;

  // --- Basic Campaign Data
  const campaignName = formData.get("campaignName");
  const selectedCampaignType = formData.get("selectedCampaignType");
  const selectedTriggerType = formData.get("selectedTriggerType");
  const status = JSON.parse(formData.get("status") || "{}");

  // New required fields
  const goalText = formData.get("goalText") || "";
  const preGoalText = formData.get("preGoalText") || "";

  let selectedProducts = [];
  let selectedCollections = [];
  let upsell_allproducts = false;

  if (selectedTriggerType === "products") {
    selectedProducts = JSON.parse(formData.get("selectedProducts") || "[]");
  } else if (selectedTriggerType === "collections") {
    selectedCollections = JSON.parse(
      formData.get("selectedCollections") || "[]",
    );
  } else if (selectedTriggerType === "all") {
    upsell_allproducts = formData.get("upsell_allproducts") === "true";
  }
  const offers = JSON.parse(formData.get("offers") || "[]");

  console.log(offers, "+++++++++=======  Offer ");
  const showConfetti = formData.get("showConfetti") === "on";
  const showLockedGoals = formData.get("showLockedGoals") === "on";
  const showBadgeIcons = formData.get("showBadgeIcons") === "on";
  const badgeImage = formData.get("badgeImage"); // File or null
  const progressBarStyle = JSON.parse(formData.get("progressBarStyle") || "{}");
  const placement = JSON.parse(formData.get("placement") || "{}");

  // --- Create Campaign
  const upsellCampaign = await prisma.upsellCampaign.create({
    data: {
      name: campaignName,
      type: selectedCampaignType,
      placement: JSON.stringify(placement),
      shop: String(shop),
      status: String(status?.active) || "false",
    },
  });

  console.log("Created campaign:", {
    id: upsellCampaign.id,
    name: upsellCampaign.name,
    type: upsellCampaign.type,
  });
  const customiz = await prisma.customiz.create({
    data: {
      campaignId: upsellCampaign.id,
      barStyle: progressBarStyle.thickness || "thin",
      barRadius: progressBarStyle.cornerRadius || "square",
      barColors: JSON.stringify({
        primaryColor: progressBarStyle.primaryColor || "#4CAF50",
        secondaryColor: progressBarStyle.secondaryColor || "#2196F3",
        goalCompleteColor: progressBarStyle.goalCompleteColor || "#FF9800",
        backgroundColor: progressBarStyle.backgroundColor || "#F5F5F5",
      }),
    },
  });

  // --- Triggers
  if (selectedTriggerType === "products" && selectedProducts.length > 0) {
    await prisma.upsellTriggerProduct.createMany({
      data: selectedProducts.map((p) => ({
        campaignId: upsellCampaign.id,
        shop,
        productId: p.id,
        variantId: String(p.variantId),
        productTitle: p.title,
        handle: p.handle,
        price: p.price,
        media: p.media,
      })),
    });
  } else if (
    selectedTriggerType === "collections" &&
    selectedCollections.length > 0
  ) {
    await prisma.upsellTriggerCollection.createMany({
      data: selectedCollections.map((col) => ({
        campaignId: upsellCampaign.id,
        shop,
        collectionId: col.id,
        title: col.title,
        handle: col.handle,
      })),
    });
    const collectionIds = selectedCollections.map((col) => col.id);
    await trigger_coll(collectionIds, shop, accessToken, upsellCampaign.id);
  } else if (upsell_allproducts) {
    await trigger_all(shop, upsell_allproducts, accessToken, upsellCampaign.id);
  }

  // --- Multiple Offers
  for (const offer of offers) {
    const createdOffer = await prisma.addToUnlockOffer.create({
      data: {
        campaignId: upsellCampaign.id,
        shop,
        goalType: offer.goalType,
        goalAmount: offer.goalAmount ? parseInt(offer.goalAmount) : null,
        goalQuantity: offer.goalquantity ? parseInt(offer.goalquantity) : null,
        rewardType: offer.rewardType,
        rewardMode: offer.rewardMode,
        discountType: offer.discountType,
        discountCode: parseFloat(offer.discountCode) || null,
        goalTextBefore: offer.goalTextBefore,
        goalTextAfter: offer.goalTextAfter,

        badgeImageUrl:
          offer.badgeIconUrl || offer.badgeImage || offer.image || null,
      },
    });

    // --- Reward Products
    if (offer.rewardProducts?.length > 0) {
      await prisma.upsellRewardProduct.createMany({
        data: offer.rewardProducts.map((rp) => ({
          campaignId: upsellCampaign.id,
          offerId: createdOffer.id,
          shop,
          productId: rp.id,
          variantId: rp.variantId,
          title: rp.title,
          price: rp.price,
          media: rp.media,
        })),
      });
    }

    // --- Reward Collections
    if (offer.rewardCollection?.length > 0) {
      await prisma.upsellRewardCollection.createMany({
        data: offer.rewardCollection.map((rc) => ({
          offerId: createdOffer.id,
          shop,
          collectionId: rc.id,
          title: rc.title,
        })),
      });
    }

    // --- Buy X Products
    if (
      offer.productPickType === "products" &&
      offer.buyProductPicker?.length > 0
    ) {
      await prisma.buyXProduct.createMany({
        data: offer.buyProductPicker.map((bp) => ({
          offerId: createdOffer.id,
          productId: bp.id,
          variantId: bp.variantId,
          title: bp.title,
        })),
      });
    }

    // --- Buy X Collections
    if (
      offer.productPickType === "collections" &&
      offer.buyCollectionPicker?.length > 0
    ) {
      await prisma.buyXCollection.createMany({
        data: offer.buyCollectionPicker.map((bc) => ({
          offerId: createdOffer.id,
          collectionId: bc.id,
          title: bc.title,
        })),
      });
    }
  }

  await add_to_unlock_(
    shop,
    accessToken,
    upsellCampaign,
    selectedProducts,
    offers,
    admin,
  );

  return {
    success: true,
    data: {
      campaignId: upsellCampaign.id,
      campaignName,
      offersCount: offers.length,
    },
  };
};

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

export default function AddToUnlock() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
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
  const [placement, setPlacement] = useState("");
  const [blockProducts, setBlockProducts] = useState([]);
  const [blockProductSearch, setBlockProductSearch] = useState("");
  const [formattedGoalText, setFormattedGoalText] = useState(
    "Spend $50 to unlock a free gift!",
  );
  const [formattedPreGoalText, setFormattedPreGoalText] = useState(
    "Add more to your cart to unlock rewards.",
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBadges, setShowBadges] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  // 'dealType' parameter ki value
  const dealTypeFromUrl = urlParams.get("dealType");
  const rewardTypeParam = urlParams.get("rewardType"); // Get reward type from URL

  // State for deal type - use URL param if available, otherwise allow selection
  const [dealType, setDealType] = useState(dealTypeFromUrl || "");

  const rewardModeOptions = [
    dealType !== "flame" && { label: "Fixed Deal", value: "fixed" },
    dealType !== "fixed" && {
      label: "Flame Match (Customer picks)",
      value: "flame",
    },
  ].filter(Boolean);
  const handleToggle = () => {
    setShowBadges(!showBadges); // true ↔ false
  };
  const location = useLocation();
  const shopify = useAppBridge();
  const searchParams = new URLSearchParams(location.search);
  const campaignNames = searchParams.get("name") || "";
  const campaignType = searchParams.get("type") || "";
  const placementParam = searchParams.get("placement") || "";
  const SAVE_BAR_ID = "ID_SAVE_BAR";
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
  const [currentProgress, setCurrentProgress] = useState(1);
  const [activePreview, setActivePreview] = useState("home");
  const [completedGoals, setCompletedGoals] = useState([]);
  const [openColorPicker, setOpenColorPicker] = useState(null); // Track which color picker is open
  const [shouldShowConfetti, setShouldShowConfetti] = useState(false);
  const completedGoalsRef = useRef([]);
  const confettiTriggeredRef = useRef([]);
  const confettiShownOnceRef = useRef(false);

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

  const removeItem = (id, setItems, items) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const removeProduct = (id) =>
    removeItem(id, setUpsellselectedItems, upsellselectedItems);
  const removeCollection = (id) =>
    removeItem(id, setSelectedCollections, selectedCollections);
  const removeBlockProduct = (id) =>
    removeItem(id, setBlockProducts, blockProducts);

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

  // Initialize offers based on deal type
  useEffect(() => {
    const currentDealType = dealType || dealTypeFromUrl;
    if (currentDealType && offers.length > 0) {
      const updatedOffers = offers.map((offer) => ({
        ...offer,
        rewardMode: currentDealType === "flame" ? "flame" : "fixed",
        rewardType:
          currentDealType === "flame"
            ? offer.rewardType || "gift" // Preserve existing reward type for flame match, default to "gift" if not set
            : rewardTypeParam || offer.rewardType || "discount",
      }));
      setOffers(updatedOffers);
    }
  }, [dealType, dealTypeFromUrl, rewardTypeParam]);

  const [offers, setOffers] = useState(() => {
    const initialDealType = dealTypeFromUrl || "";
    return [
      {
        id: Date.now() + Math.random(), // More unique ID
        goalType: "quantity",
        goalAmount: "50",
        goalquantity: "1",
        currency: "USD",
        rewardMode: initialDealType === "flame" ? "flame" : "fixed",
        rewardType:
          initialDealType === "flame" ? "gift" : rewardTypeParam || "discount", // Use rewardType from URL
        discountCode: "10",
        discountType: "percentage",
        productPickType: "products",
        buyProductPicker: [],
        buyCollectionPicker: [],
        rewardProducts: [],
        rewardCollection: [],
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

  const addOffer = () => {
    const currentDealType = dealType || dealTypeFromUrl || "fixed";
    const newOffer = {
      id: Date.now() + Math.random(), // More unique ID
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
      goalTextBefore: "🛍 Add {{amount_left}} to unlock {{reward}}!",
      goalTextAfter: "🎉 You've unlocked {{reward}}!",
    };

    console.log("Adding new offer:", newOffer);
    setOffers((prev) => {
      const updated = [...prev, newOffer];

      return updated;
    });
  };

  const removeOffer = (id) => {
    setHasUnsavedChanges(true);
    setOffers((prev) => prev.filter((offer) => offer.id !== id));
  };

  const updateOffer = (id, field, value) => {
    console.log(`Updating offer ${id}: ${field} = ${value}`);
    setHasUnsavedChanges(true);
    setOffers((prev) => {
      const updated = prev.map((offer) =>
        offer.id === id ? { ...offer, [field]: value } : offer,
      );
      console.log("Updated offers:", updated);
      return updated;
    });
  };

  // Batch update function for multiple fields
  const updateOfferBatch = (id, updates) => {
    console.log(`Batch updating offer ${id}:`, updates);
    setHasUnsavedChanges(true);
    setOffers((prev) => {
      const updated = prev.map((offer) =>
        offer.id === id ? { ...offer, ...updates } : offer,
      );
      console.log("Batch updated offers:", updated);
      return updated;
    });
  };

  useEffect(() => {
    const updatedPreGoalTexts = offers.map((offer) => {
      console.log(offer);
      const rewardDescription =
        offer.rewardType === "discount"
          ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"} Discount`
          : offer.rewardType === "shipping"
            ? "Free Shipping"
            : "Free Gift";
      const amountLeft =
        offer.goalType === "amount_cart"
          ? `${offer.currency}${Math.max(parseFloat(offer.goalAmount) - currentProgress, 0)}`
          : offer.goalType === "quantity"
            ? `${Math.max(parseInt(offer.goalquantity) - currentProgress, 0)} items`
            : "";
      const goal =
        offer.goalType === "amount_cart"
          ? `${offer.currency}${offer.goalAmount || 0}`
          : offer.goalType === "quantity"
            ? `${offer.goalquantity || 0} items`
            : "";
      return offer.goalTextBefore
        .replace("{{amount_left}}", amountLeft)
        .replace("{{reward}}", rewardDescription)
        .replace("{{goal}}", goal);
    });
    const updatedGoalTexts = offers.map((offer) => {
      const rewardDescription =
        offer.rewardType === "discount"
          ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"} Discount`
          : offer.rewardType === "shipping"
            ? "Free Shipping"
            : "Free Gift";
      const goal =
        offer.goalType === "amount_cart"
          ? `${offer.currency}${offer.goalAmount || 0}`
          : offer.goalType === "quantity"
            ? `${offer.goalquantity || 0} items`
            : "";
      return offer.goalTextAfter
        .replace("{{reward}}", rewardDescription)
        .replace("{{goal}}", goal);
    });

    setFormattedPreGoalText(updatedPreGoalTexts.join(" | "));
    setFormattedGoalText(updatedGoalTexts.join(" | "));
  }, [offers, currentProgress]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        setShowConfetti(true);
        shopify.toast.show("Campaign saved successfully!", { isError: false });
        setMainBtnLoading(false);
        setTimeout(() => {
          navigate("/app/upsell_engine");
        }, 3500); // 3.5 second delay to show confetti
      } else if (fetcher.data.error) {
        shopify.toast.show(fetcher.data.error || "Failed to save campaign", {
          isError: true,
        });
        setMainBtnLoading(false);
      }
    }
  }, [fetcher.state, fetcher.data, navigate]);

  // Auto-hide confetti after animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000); // Hide confetti after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  useEffect(() => {
    console.log("Offers state changed:", offers);
    console.log("Number of offers:", offers.length);
    offers.forEach((offer, index) => {
      console.log(`Offer ${index + 1}:`, {
        id: offer.id,
        goalType: offer.goalType,
        goalAmount: offer.goalAmount,
        goalquantity: offer.goalquantity,
        rewardMode: offer.rewardMode,
        rewardType: offer.rewardType,
      });
    });
  }, [offers]);

  useEffect(() => {
    if (offers.length === 0) {
      setShouldShowConfetti(false);
      return;
    }

    const sortedOffers = [...offers].sort((a, b) =>
      a.goalType === "quantity"
        ? parseInt(a.goalquantity) - parseInt(b.goalquantity)
        : parseFloat(a.goalAmount) - parseFloat(b.goalAmount),
    );

    let newCompletedGoals = [];

    sortedOffers.forEach((offer) => {
      const goalValue =
        offer.goalType === "quantity"
          ? parseInt(offer.goalquantity) || 0
          : parseFloat(offer.goalAmount) || 0;
      const isGoalReached = currentProgress >= goalValue;

      if (isGoalReached) {
        // Check if this goal was already completed using the ref
        const wasAlreadyCompleted = completedGoalsRef.current.some(
          (completed) => completed.id === offer.id,
        );

        if (wasAlreadyCompleted) {
          // Goal was already completed, mark as still completed
          const existing = completedGoalsRef.current.find(
            (c) => c.id === offer.id,
          );
          newCompletedGoals.push(
            existing || { id: offer.id, completedAt: Date.now() },
          );
        } else {
          // New goal completed!
          newCompletedGoals.push({ id: offer.id, completedAt: Date.now() });
        }
      }
    });

    // Check if there's a new goal completed
    const hasNewGoalCompleted =
      newCompletedGoals.length > completedGoalsRef.current.length;

    // Find which goals are newly completed
    let newlyCompletedGoalIds = [];
    if (hasNewGoalCompleted) {
      newlyCompletedGoalIds = newCompletedGoals
        .filter(
          (newGoal) =>
            !completedGoalsRef.current.some(
              (existing) => existing.id === newGoal.id,
            ),
        )
        .map((goal) => goal.id);
    }

    // Update completed goals only if changed
    const hasChanged =
      newCompletedGoals.length !== completedGoalsRef.current.length ||
      newCompletedGoals.some((newGoal, index) => {
        const existing = completedGoalsRef.current[index];
        return !existing || newGoal.id !== existing.id;
      });

    if (hasChanged) {
      completedGoalsRef.current = newCompletedGoals;
      setCompletedGoals(newCompletedGoals);
    }

    const untriggeredGoals = newlyCompletedGoalIds.filter(
      (id) => !confettiTriggeredRef.current.includes(id),
    );

    // Only show confetti once if switch is enabled and it hasn't been shown before
    if (
      untriggeredGoals.length > 0 &&
      status.showConfetti &&
      !confettiShownOnceRef.current
    ) {
      console.log("🎉 New goal completed! Showing confetti (one time only)");
      console.log("Newly completed goal IDs:", untriggeredGoals);
      console.log("Already triggered for:", confettiTriggeredRef.current);

      // Mark that confetti has been shown once
      confettiShownOnceRef.current = true;

      // Mark these goals as having triggered confetti
      confettiTriggeredRef.current = [
        ...confettiTriggeredRef.current,
        ...untriggeredGoals,
      ];

      setShouldShowConfetti(true);

      // Reset confetti trigger after showing
      const timer = setTimeout(() => {
        setShouldShowConfetti(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentProgress, offers]);

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

  const rewardPicker = async (offerId) => {
    const currentOffer = offers.find((o) => o.id === offerId);
    if (!currentOffer) return;

    // Get current deal type from URL or offer
    const currentDealType = dealType || currentOffer.rewardMode;
    const isFixedDeal =
      currentDealType === "fixed" || currentOffer.rewardMode === "fixed";
    const isFlameMatch =
      currentDealType === "flame" || currentOffer.rewardMode === "flame";

    // Check limits before opening picker
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
        multiple: !isFixedDeal, // Single selection for fixed deal
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

        // Filter out duplicates
        const newProducts = products.filter(
          (p) => !currentOffer.rewardProducts.some((pr) => pr.id === p.id),
        );

        // Check limits after selection
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
                    ? newProducts.slice(0, 1) // Only 1 for fixed deal
                    : [...currentOffer.rewardProducts, ...newProducts].slice(
                        0,
                        20,
                      ), // Max 20 for flame match
                }
              : offer,
          ),
        );

        // Show success message
        if (
          typeof window !== "undefined" &&
          window.shopify &&
          window.shopify.toast
        ) {
          if (isFixedDeal) {
            window.shopify.toast.show("Reward product selected successfully!", {
              isError: false,
            });
          } else {
            window.shopify.toast.show(
              `${totalProducts} reward products selected. Minimum 2 required for Flame Match.`,
              { isError: false },
            );
          }
        }
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

  const removeRewardProduct = (offerId, id) => {
    setOffers((prev) => {
      const currentOffer = prev.find((o) => o.id === offerId);
      if (!currentOffer) return prev;

      // Get current deal type
      const currentDealType = dealType || currentOffer.rewardMode;
      const isFlameMatch =
        currentDealType === "flame" || currentOffer.rewardMode === "flame";

      // Remove the product
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

      // Check if removal violated minimum requirement after update
      const updatedOffer = updatedOffers.find((o) => o.id === offerId);
      if (
        updatedOffer &&
        isFlameMatch &&
        updatedOffer.rewardProducts.length < 2
      ) {
        // Use setTimeout to ensure toast shows after state update
        setTimeout(() => {
          if (
            typeof window !== "undefined" &&
            window.shopify &&
            window.shopify.toast
          ) {
            window.shopify.toast.show(
              `Flame Match requires at least 2 products. Currently ${updatedOffer.rewardProducts.length} product(s). Please add more.`,
              { isError: true },
            );
          }
        }, 100);
      }

      return updatedOffers;
    });
  };

  const handleswitchChange = (field, value) => {
    setStatus((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    if (isClient && shopify) {
      shopify.saveBar.show(SAVE_BAR_ID);
    }
  };

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [
    campaignName,
    selectedTriggerType,
    upsellselectedItems,
    selectedCollections,
    blockProducts,
    placement,
    offers,
    status,
    progressBarStyle,
    showBadges,
  ]);

  // Image upload function
  const uploadImageToShopify = async (file) => {
    try {
      setHasUnsavedChanges(true);
      const formData = new FormData();
      const fileName = `${Date.now()}-${file.name}`;

      formData.append("image", file);
      formData.append("fileName", fileName);
      formData.append("originalSource", "");

      console.log("Uploading image:", fileName);

      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload success, URL:", data.url);
      return data.url; // Shopify-hosted URL
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
        // Show loading indicator
        if (typeof shopify !== "undefined" && shopify.toast) {
          shopify.toast.show("Uploading image...", { isError: false });
        }

        // Upload to Shopify
        const uploadedUrl = await uploadImageToShopify(file);

        if (uploadedUrl) {
          // Store the Shopify URL instead of the blob
          updateOffer(offerId, "badgeIconUrl", uploadedUrl);
          updateOffer(offerId, "badgeIconFile", null); // Clear the file blob
          if (typeof shopify !== "undefined" && shopify.toast) {
            shopify.toast.show("Image uploaded successfully!", {
              isError: false,
            });
          }
        } else {
          // Fallback: store as blob if upload fails
          updateOffer(offerId, "badgeIcon", file);
        }
      } else {
        if (typeof shopify !== "undefined" && shopify.toast) {
          shopify.toast.show("Please upload an image file.", { isError: true });
        }
      }
    }
  };

  // Client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !shopify) return;

    if (hasUnsavedChanges) {
      shopify.saveBar.show(SAVE_BAR_ID);
    } else {
      shopify.saveBar.hide(SAVE_BAR_ID);
    }
  }, [hasUnsavedChanges, isClient, shopify]);

  useEffect(() => {
    if (campaignNames) {
      setCampaignName(campaignNames);
    }
    if (placementParam) {
      setPlacement(placementParam);
    }
  }, [campaignNames, placementParam]);

  // Sync preview with placement selection
  useEffect(() => {
    if (placement) {
      setActivePreview(placement);
    }
  }, [placement]);

  // Create a ref to store handleSubmit so handleSave can call it
  const handleSubmitRef = useRef(null);

  const handleDiscard = useCallback(() => {
    setHasUnsavedChanges(false);
    if (shopify) {
      shopify.saveBar.hide(SAVE_BAR_ID);
    }
    // Reset form or navigate away
    navigate("/app/upsell_engine");
  }, [navigate, shopify]);

  const handleSave = useCallback(() => {
    if (handleSubmitRef.current) {
      handleSubmitRef.current();
    }
    if (shopify) {
      shopify.saveBar.hide(SAVE_BAR_ID);
    }
  }, [shopify]);

  const handleSubmit = useCallback(() => {
    console.log("Offers data:", offers);
    console.log("Badge icon:", badgeIcon);

    if (!campaignNames) {
      shopify.toast.show("Campaign name is required.", { isError: true });
      return;
    }

    // Validate each offer
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

      if (offer.rewardType === "discount") {
        if (
          !offer.discountCode ||
          isNaN(offer.discountCode) ||
          parseFloat(offer.discountCode) <= 0
        ) {
          shopify.toast.show(
            `Offer ${index + 1}: Valid discount value is required.`,
            { isError: true },
          );
          return;
        }
        if (
          offer.discountType === "percentage" &&
          (parseFloat(offer.discountCode) <= 0 ||
            parseFloat(offer.discountCode) > 100)
        ) {
          shopify.toast.show(
            `Offer ${index + 1}: Discount percentage must be between 1 and 100.`,
            { isError: true },
          );
          return;
        }
      }

      if (offer.rewardType === "gift") {
        // Get current deal type from URL or offer
        const currentDealType = dealType || offer.rewardMode;
        const isFixedDeal =
          currentDealType === "fixed" || offer.rewardMode === "fixed";
        const isFlameMatch =
          currentDealType === "flame" || offer.rewardMode === "flame";

        if (isFixedDeal) {
          if (offer.rewardProducts.length !== 1) {
            shopify.toast.show(
              `Offer ${index + 1}: Fixed Deal requires exactly 1 reward product. Currently ${offer.rewardProducts.length} product(s) selected.`,
              { isError: true },
            );
            return;
          }
        }

        if (isFlameMatch) {
          if (
            offer.rewardProducts.length < 2 &&
            offer.rewardCollection.length === 0
          ) {
            shopify.toast.show(
              `Offer ${index + 1}: Flame Match requires at least 2 reward products. Currently ${offer.rewardProducts.length} product(s) selected.`,
              { isError: true },
            );
            return;
          }
        }
        if (
          offer.productPickType === "collections" &&
          offer.buyCollectionPicker.length === 0
        ) {
          shopify.toast.show(
            `Offer ${index + 1}: At least one collection is required for Buy X configuration.`,
            { isError: true },
          );
          return;
        }
      }
    }

    // Validate triggers
    if (
      selectedTriggerType === "products" &&
      upsellselectedItems.length === 0 &&
      !upsell_allproduct
    ) {
      shopify.toast.show(
        "At least one product is required when selecting specific products.",
        { isError: true },
      );
      return;
    }
    if (
      selectedTriggerType === "collections" &&
      selectedCollections.length === 0
    ) {
      shopify.toast.show(
        "At least one collection is required when selecting specific collections.",
        { isError: true },
      );
      return;
    }
    if (!dealType && !dealTypeFromUrl) {
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

    console.log("Placement:", placement);

    // Prepare form data
    const formData = new FormData();
    formData.append("campaignName", campaignNames);
    formData.append("selectedCampaignType", "add_to_unlock");
    formData.append("selectedTriggerType", selectedTriggerType);
    formData.append("status", JSON.stringify(status));
    // Use dealType from state or URL
    const finalDealType = dealType || dealTypeFromUrl;
    if (finalDealType) {
      formData.append("dealType", finalDealType);
    }

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

    // Append block products
    formData.append("blockProducts", JSON.stringify(blockProducts));

    // Append offers (including gift items)
    formData.append("offers", JSON.stringify(offers));

    formData.append("showConfetti", showConfetti ? "on" : "off");
    formData.append("showLockedGoals", showLockedGoals ? "on" : "off");
    formData.append("showBadgeIcons", showBadgeIcons ? "on" : "off");
    formData.append("progressBarStyle", JSON.stringify(progressBarStyle));
    formData.append("placement", JSON.stringify([placement]));

    // Set loading state
    setMainBtnLoading(true);

    // Submit form
    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });

    // Clear unsaved changes flag after successful submission
    setHasUnsavedChanges(false);
  }, [
    campaignNames,
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
    fetcher,
  ]);

  // Store handleSubmit in ref for handleSave
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const preview_products = [
    {
      id: 1,
      title: "The Collection Snowboard: Liquid",
      price: "749.95",
      image:
        "https://cdn.shopify.com/s/files/1/0642/6063/files/wax-special.png?v=1730040415", // ✅ corrected typo: "imag" → "image"
    },
    {
      id: 2,
      title: "Summer T-Shirt Bundle",
      price: "49.99",
      image: save2, // You can replace with another image variable
    },
    {
      id: 3,
      title: "Summer PANTS Bundle",
      price: "49.99",
      image:
        "https://cdn.shopify.com/s/files/1/0642/6063/files/wax-special.png?v=1730040415", // You can replace with another image variable
    },
  ];

  const renderPreview = () => {
    const sortedOffers = [...offers].sort((a, b) =>
      a.goalType === "quantity"
        ? parseInt(a.goalquantity) - parseInt(b.goalquantity)
        : parseFloat(a.goalAmount) - parseFloat(b.goalAmount),
    );

    // Default goal when no offers are configured
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

    // Find the active offer (next uncompleted goal)
    let activeOffer = null;
    if (sortedOffers.length > 0) {
      for (const offer of sortedOffers) {
        const goalValue =
          offer.goalType === "quantity"
            ? parseInt(offer.goalquantity) || 1
            : parseFloat(offer.goalAmount) || 1;
        if (currentProgress < goalValue) {
          activeOffer = offer; // First uncompleted offer
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

    console.log(
      "=========>>>><<<",
      activeOffer.goalquantity,
      "-----------------",
      currentProgress,
    );

    const getOfferProgressPercentage = (offer) => {
      const goalValue =
        offer.goalType === "quantity"
          ? parseInt(offer.goalquantity) || 1
          : parseFloat(offer.goalAmount) || 1;
      const percent = Math.min((currentProgress / goalValue) * 100, 100);
      console.log(
        `Offer ${offer.id}: currentProgress=${currentProgress}, goalValue=${goalValue}, percent=${percent}`,
      );
      return percent;
    };

    const getDynamicCartText = () => {
      if (sortedOffers.length === 0) {
        // Show default text when no offers are configured
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

    let selectedIcon = ""; // Default value
    offers.forEach((type) => {
      if (icons[type.rewardType]) {
        selectedIcon = icons[type.rewardType];
      }
    });
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
      return (
        <Card title="Homepage Section Preview">
          <HomeSectionPreview
            title="Bundle Deals"
            backgroundColor="#fff"
            products={
              filteredProducts.length > 0 ? filteredProducts : preview_products
            }
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
                .confetti-text, .locked-goals {
                    text-align: center;
                    margin: 10px 0;
                    color: #333;
                }
                .badge-icon {
                    display: block;
                    margin: 0 auto;
                }
                @media (max-width: 768px) {
                    .preview-container {
                        padding: 15px;
                    }
                    .product-grid {
                        gap: 10px;
                    }
                    .product-card {
                        width: 140px;
                        padding: 12px;
                    }
                    .product-image-container {
                        width: 80px;
                        height: 80px;
                    }
                    .product-title {
                        font-size: 13px;
                    }
                    .main-title {
                        font-size: 14px;
                    }
                    .action-btn {
                        padding: 10px 20px;
                        font-size: 14px;
                    }
                }
                @media (max-width: 480px) {
                    .product-grid {
                        gap: 8px;
                    }
                    .product-card {
                        width: calc(50% - 16px);
                        padding: 10px;
                    }
                    .product-image-container {
                        width: 70px;
                        height: 70px;
                    }
                    .add-btn {
                        padding: 8px 12px;
                        font-size: 11px;
                    }
                }
            `}</style>
            <div className="preview-container">
              <div className="preview-title">Product Page Preview</div>
              <div className="banner">
                {offerProgress.map((offer) => {
                  const productsToShow =
                    offer.rewardType === "gift"
                      ? offer.rewardProducts || []
                      : blockProducts.length > 0
                        ? blockProducts
                        : upsellselectedItems.length > 0
                          ? upsellselectedItems
                          : preview_products; // Show default products when none selected
                  const buttonLabel =
                    offer.rewardType === "shipping"
                      ? "FREE SHIPPING"
                      : offer.rewardType === "discount"
                        ? `APPLY DISCOUNT`
                        : "REDEEM FREE GIFT";

                  // Calculate progress for this specific offer
                  const offerProgressPercent =
                    getOfferProgressPercentage(offer);

                  return (
                    <div key={offer.id} className="offer-card">
                      <div className="main-title">
                        {
                          <div className="offer-line">
                            <span>{renderGoalText(offer)}</span>
                          </div>
                        }
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
                                    "https://via.placeholder.com/150"
                                  }
                                  alt={product.title || "Product"}
                                  className="product-image"
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
                {showConfetti &&
                  offerProgress.some((offer) => offer.isGoalReached) && (
                    <div className="confetti-text">
                      🎉 Confetti Animation Triggered!
                    </div>
                  )}
                {showLockedGoals && sortedOffers.length > 1 && (
                  <div className="locked-goals">
                    Locked Goals: Additional rewards to unlock...
                  </div>
                )}
                {showBadgeIcons && badgeIcon && (
                  <img
                    src={createObjectURL(badgeIcon)}
                    alt="Badge Icon"
                    className="badge-icon"
                    style={{ width: "50px" }}
                  />
                )}
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
                // Increased border radius
                overflow: "hidden",
                height: "700px", // Reduced height from 600px to 500px
              }}
            >
              <iframe
                style={{ width: "100%", height: "100%", border: "none" }}
                srcDoc={`<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <style>
                            /* Existing CSS styles */
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
                                width: 97%; ;
                                height: 97%;
                                background: #fff;
                                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                                z-index: 1001;
                                display: flex;
                                flex-direction: column;
                                transition: right 0.3s ease;
                                border-left: none; /* Remove left border */
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

        /* Gift Item Button Styles */
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
                                border-radius: 15px; /* Increased border radius */
                                margin: 20px 0px;
                                overflow: hidden;
                                border: 1px solid #e0e0e0;
                            }
                            .fill {
                                background: #5A75F8;
                                height: 100%;
                                border-radius: 15px; /* Increased border radius */
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
                                border-radius: 8px; /* Increased border radius */
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
    height: 60px;           /* Increased height */
    font-weight: 700;       /* Bold text */
    font-size: 24px;        /* Increased font size */
    border-radius: 6px;     /* Optional: keeps corners rounded */
    cursor: pointer;        /* Pointer on hover */
    padding: 0 20px;        /* Adjust horizontal padding if needed */
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

                            /* New styles for header layout */
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

                                background-color: ${progressPercentage >= 100 ? progressBarStyle.goalCompleteColor : progressBarStyle.secondaryColor};
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
                    <!-- Gift Item 1 -->
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
                        <img src="${item.media || "https://via.placeholder.com/100"}" alt="${item.title}" />
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
  return (
    <Page title="Create Upsell Campaign" fullWidth padding="400">
      {isClient && (
        <SaveBar id={SAVE_BAR_ID} discardConfirmation>
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
      {shouldShowConfetti && status.showConfetti && (
        <div
          key="confetti-container"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <canvas
            key="confetti-canvas"
            id="main-confetti-canvas"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 9999,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if (window.__confettiInitialized__) return;
                  const script = document.createElement('script');
                  script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
                  script.onload = () => {
                    const canvas = document.getElementById("main-confetti-canvas");
                    if (canvas && !window.__confettiRunning__) {
                      window.__confettiRunning__ = true;
                      const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
                      function randomInRange(min, max) {
                        return Math.random() * (max - min) + min;
                      }
                      const end = Date.now() + 3000; // 3 seconds of confetti
                      (function frame() {
                        myConfetti({
                          angle: randomInRange(-100, -80),
                          spread: randomInRange(120, 180),
                          particleCount: randomInRange(50, 100),
                          origin: { y: 0.0 },
                        });
                        if (Date.now() < end) requestAnimationFrame(frame);
                        else window.__confettiRunning__ = false;
                      })();
                    }
                  };
                  document.body.appendChild(script);
                  window.__confettiInitialized__ = true;
                })();
              `,
            }}
          />
        </div>
      )}

      <FormLayout>
        <Layout>
          <div style={{ width: "60%" }}>
            <Layout.Section>
              <BlockStack gap="400">
                {/* Deal Type Selection - Show if not selected from URL */}
                {!dealTypeFromUrl && (
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Choose Deal Type
                      </Text>
                      <Text as="p" tone="subdued">
                        Select the type of deal you want to create. This will
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
                          onClick={() => {
                            setDealType("fixed");
                            setHasUnsavedChanges(true);
                          }}
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
                          onClick={() => {
                            setDealType("flame");
                            setHasUnsavedChanges(true);
                          }}
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
                      {!dealType && (
                        <Banner tone="warning">
                          <Text>Please select a deal type to continue.</Text>
                        </Banner>
                      )}
                    </BlockStack>
                  </Card>
                )}

                {/* Show selected deal type if from URL */}
                {dealTypeFromUrl && (
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Deal Type:{" "}
                        {dealTypeFromUrl === "fixed"
                          ? "Fixed Deal"
                          : "Flame Match"}
                      </Text>
                    </BlockStack>
                  </Card>
                )}

                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Selected Products Upsell
                    </Text>
                    <Text as="p">
                      Choose which products will trigger the upsell offer.
                    </Text>
                    {!dealType && !dealTypeFromUrl && (
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
                        disabled={!placement || (!dealType && !dealTypeFromUrl)}
                        onChange={() => {
                          setSelectedTriggerType("all");
                          setUpsell_allproduct(true);
                        }}
                      />
                      <RadioButton
                        label="Specific products"
                        checked={selectedTriggerType === "products"}
                        name="triggerType"
                        disabled={!placement || (!dealType && !dealTypeFromUrl)}
                        onChange={() => setSelectedTriggerType("products")}
                      />
                      <RadioButton
                        label="Specific collections"
                        checked={selectedTriggerType === "collections"}
                        name="triggerType"
                        disabled={!placement || (!dealType && !dealTypeFromUrl)}
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
                              disabled={
                                !placement || (!dealType && !dealTypeFromUrl)
                              }
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
                                          <Text fontWeight="bold">{title}</Text>
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
                              disabled={
                                !placement || (!dealType && !dealTypeFromUrl)
                              }
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

                {/* Block Products Section - Products shown in the upsell block */}
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Block Products
                    </Text>
                    <Text as="p">
                      Choose which products will appear in the upsell block.
                      These are the products customers will see in the upsell
                      widget.
                    </Text>
                    {!placement && (
                      <Banner tone="info">
                        <Text>
                          Please select a placement above before choosing block
                          products.
                        </Text>
                      </Banner>
                    )}
                    {!dealType && !dealTypeFromUrl && (
                      <Banner tone="warning">
                        <Text>
                          Please select a deal type above before configuring
                          block products.
                        </Text>
                      </Banner>
                    )}
                    <Box padding="200" borderStyle="base">
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm" fontWeight="bold">
                          Selected Block Products
                        </Text>
                        <InlineStack gap="200">
                          <Button
                            onClick={blockProductPicker}
                            size="medium"
                            disabled={
                              !placement || (!dealType && !dealTypeFromUrl)
                            }
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
                              const { id, title, handle, price, media } = item;
                              return (
                                <ResourceItem id={id}>
                                  <InlineStack align="space-between" gap="300">
                                    <InlineStack gap="300" align="center">
                                      {media && (
                                        <Image
                                          source={media}
                                          alt={title}
                                          width="60px"
                                        />
                                      )}
                                      <BlockStack>
                                        <Text fontWeight="bold">{title}</Text>
                                        <Text>Price: ${price}</Text>
                                        <Text>Handle: {handle}</Text>
                                      </BlockStack>
                                    </InlineStack>
                                    <Button
                                      tone="critical"
                                      onClick={() => removeBlockProduct(id)}
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
                            No block products selected. Products shown in the
                            upsell block will be the trigger products.
                          </Text>
                        )}
                      </BlockStack>
                    </Box>
                  </BlockStack>
                </Card>

                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h2">
                      Offers
                    </Text>
                    <Button
                      icon={PlusIcon}
                      onClick={addOffer}
                      variant="primary"
                      disabled={!dealType && !dealTypeFromUrl}
                      accessibilityLabel="Add new offer"
                    >
                      Add Offer
                    </Button>
                  </InlineStack>
                  {!dealType && !dealTypeFromUrl && (
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
                                    updateOffer(offer.id, "goalAmount", value);
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
                                  updateOffer(offer.id, "goalquantity", value);
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
                                    // Batch update reward type and name
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
                                    // Batch update reward type and name
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
                                    updateOffer(offer.id, "discountCode", value)
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
                                    updateOffer(offer.id, "discountType", value)
                                  }
                                />
                                {/* Reward Product Picker for Fixed Deal and Flame Match Discount */}
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
                                            chosen reward category (fixed deal).
                                          </Text>
                                          <Text tone="subdued" variant="bodySm">
                                            Selected:{" "}
                                            {offer.rewardProducts.length}/1
                                          </Text>
                                          {offer.rewardProducts.length ===
                                            0 && (
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                              style={{ marginTop: "8px" }}
                                            >
                                              If no reward product is selected,
                                              the discount will apply to trigger
                                              products.
                                            </Text>
                                          )}
                                        </Banner>
                                        <Button
                                          onClick={() => rewardPicker(offer.id)}
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
                                          <Text tone="subdued" variant="bodySm">
                                            Selected:{" "}
                                            {offer.rewardProducts.length}/2
                                            (minimum)
                                          </Text>
                                          {offer.rewardProducts.length ===
                                            0 && (
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                              style={{ marginTop: "8px" }}
                                            >
                                              If no reward product is selected,
                                              the discount will apply to trigger
                                              products.
                                            </Text>
                                          )}
                                        </Banner>
                                        <Button
                                          onClick={() => rewardPicker(offer.id)}
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
                                  Selected Tigger Products{" "}
                                </Banner>
                                {/* Reward Product Picker for Fixed Deal and Flame Match Shipping */}
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
                                            chosen reward category (fixed deal).
                                          </Text>
                                          <Text tone="subdued" variant="bodySm">
                                            Selected:{" "}
                                            {offer.rewardProducts.length}/1
                                          </Text>
                                          {offer.rewardProducts.length ===
                                            0 && (
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                              style={{ marginTop: "8px" }}
                                            >
                                              If no reward product is selected,
                                              free shipping will apply to
                                              trigger products.
                                            </Text>
                                          )}
                                        </Banner>
                                        <Button
                                          onClick={() => rewardPicker(offer.id)}
                                          variant="primary"
                                          size="medium"
                                          disabled={
                                            offer.rewardProducts.length >= 1
                                          }
                                        >
                                          {offer.rewardProducts.length >= 1
                                            ? "1 Product Selected (Max Reached)"
                                            : "Select Reward Product (Optional)"}
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
                                          <Text tone="subdued" variant="bodySm">
                                            Selected:{" "}
                                            {offer.rewardProducts.length}/2
                                            (minimum)
                                          </Text>
                                          {offer.rewardProducts.length ===
                                            0 && (
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                              style={{ marginTop: "8px" }}
                                            >
                                              If no reward product is selected,
                                              free shipping will apply to
                                              trigger products.
                                            </Text>
                                          )}
                                        </Banner>
                                        <Button
                                          onClick={() => rewardPicker(offer.id)}
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
                            {offer.rewardType === "gift" && (
                              <BlockStack gap="300">
                                {/* Reminder banners for Fixed Deal vs Flame Match */}
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
                                            chosen reward category (fixed deal).
                                          </Text>
                                          <Text tone="subdued" variant="bodySm">
                                            Selected:{" "}
                                            {offer.rewardProducts.length}/1
                                          </Text>
                                          {offer.rewardProducts.length ===
                                            0 && (
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                              style={{ marginTop: "8px" }}
                                            >
                                              If no reward product is selected,
                                              the free gift will apply to
                                              trigger products.
                                            </Text>
                                          )}
                                        </Banner>
                                      )}
                                      {isFlameMatch && (
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
                                          <Text tone="subdued" variant="bodySm">
                                            Selected:{" "}
                                            {offer.rewardProducts.length}/2
                                            (minimum)
                                          </Text>
                                          {offer.rewardProducts.length ===
                                            0 && (
                                            <Text
                                              tone="subdued"
                                              variant="bodySm"
                                              style={{ marginTop: "8px" }}
                                            >
                                              If no reward product is selected,
                                              the free gift will apply to
                                              trigger products.
                                            </Text>
                                          )}
                                        </Banner>
                                      )}
                                    </>
                                  );
                                })()}
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
                                    return "Select Free Products";
                                  })()}
                                </Button>
                                {offer.rewardProducts.length > 0 && (
                                  <Box paddingBlockStart="200">
                                    <Text fontWeight="semibold">
                                      Selected Free Products (
                                      {offer.rewardProducts.length}):
                                    </Text>
                                    <BlockStack gap="100">
                                      {offer.rewardProducts.map((item) => (
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
                                      ))}
                                    </BlockStack>
                                  </Box>
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
                          Progree Bar Colors
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            marginBottom: "16px",
                          }}
                        >
                          {/* First color */}
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
                                backgroundColor: progressBarStyle.primaryColor,
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

                          {/* Second color */}
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
                          {/* Third color */}
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

                          {/* Fourth color */}
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
                        value={progressBarStyle.thickness || "thick"} // default value
                        onChange={(value) => {
                          // Update the thickness in progressBarStyle
                          setProgressBarStyle((prev) => ({
                            ...prev,
                            thickness: value,
                          }));

                          // Update barSize state if the value is thin
                          if (value === "thin") {
                            setBarSize(true);
                            console.log("value", barSize);
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
                      <style>
                        {`
                        input[type="color"]::-webkit-color-swatch-wrapper {
                          padding: 0;
                          border-radius: 3px;
                        }
                        input[type="color"]::-webkit-color-swatch {
                          border: none;
                          border-radius: 3px;
                        }
                        input[type="color"] {
                          border: none;
                          border-radius: 3px;
                          padding: 0;
                          cursor: pointer;
                          appearance: none;
                          outline: none;
                          box-shadow: 0 0 0 1px #d1d5db; /* light premium grey border */
                        }
                      `}
                      </style>
                    </BlockStack>
                  </Box>
                </Card>
                <Box padding={"200"}>
                  <BlockStack>
                    <InlineStack gap="200">
                      <Button
                        loading={mainBtnLoading}
                        variant="primary"
                        onClick={handleSave}
                      >
                        {mainBtnLoading ? "Saving..." : "Save"}
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
              </BlockStack>
            </Layout.Section>
          </div>
          <div style={{ position: "sticky", top: "10px", width: "40%" }}>
            <Layout.Section position="sticky" top="10px" variant="oneHalf">
              <BlockStack gap="400">{renderPreview()}</BlockStack>
            </Layout.Section>
          </div>
        </Layout>
      </FormLayout>
    </Page>
  );
}
