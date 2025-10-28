import {
  Card,
  TextField,
  Select,
  Text,
  RadioButton,
  Button,
  InlineStack,
  BlockStack,
  Checkbox,
  Divider,
  Box,
  Page,
  Layout,
  ResourceItem,
  ResourceList,
  Image,
  ChoiceList,
  FormLayout,
  Banner,
  Icon,
} from "@shopify/polaris";
import "./_index/style.css";
import { useEffect, useState } from "react";
import BuyMore from "./components/BuyMore";
import BogoUpsell from "./components/BogoUpsell";
import { useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { add_to_unlock_ } from "./utils/add_unlock";
import { buy_more_save_more } from "./utils/buy_more_save_more";
import { Bogo } from "./utils/BoGo";
import OrderBump from "./components/order_bump";
import { OrderBump_backend } from "./utils/Bump_Order";
import CheckoutUI from "./components/Checkout_upsell";
import { checkout_upsell_backend } from "./utils/checkout_upsell";
import Post_Perchess from "./components/Post_Perchess";
import { Post_Perchess_backend } from "./utils/Post_Perchess_beckend";
import {
  ButtonIcon,
  CartFilledIcon,
  DesktopIcon,
  HomeFilledIcon,
  ProductIcon,
} from "@shopify/polaris-icons";
import HomePreview from "./components/preview/HomePreview";
import HomeSectionPreview from "./components/preview/HomeSectionPreview";

const SHOPIFY_API_VERSION = "2024-10";

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

  const campaignName = formData.get("campaignName");
  const placement = JSON.parse(formData.get("placement") || "[]");
  const selectedCampaignType = formData.get("selectedCampaignType");
  const selectedTriggerType = formData.get("selectedTriggerType");

  const selectedProducts = JSON.parse(formData.get("selectedProducts") || "[]");

  const selectedCollections = JSON.parse(
    formData.get("selectedCollections") || "[]",
  );
  const rewardProducts = JSON.parse(formData.get("rewardProducts") || "[]");
  const reward_collection = JSON.parse(
    formData.get("reward_collection") || "[]",
  );
  const buyCollectionPicker_BOGO = JSON.parse(
    formData.get("buyCollectionPicker_BOGO") || "[]",
  ); // Extract BOGO collection picker
  const buyProductPicker_BOGO = JSON.parse(
    formData.get("buyProductPicker_BOGO") || "[]",
  ); // Extract BOGO product picker
  const Buy_products = JSON.parse(formData.get("Buy_productPicker") || "[]"); // Extract BOGO product picker
  const upsell_allproducts = formData.get("upsell_allproducts");
  const goalType = formData.get("goalType");
  const goalAmounts = formData.get("goalAmount") || "0";
  const goalQuantity = formData.get("goalquantity");
  const currencys = formData.get("currency") || "USD";

  const rewardType = formData.get("rewardType");
  const rewardMode = formData.get("rewardMode");
  const discountCode = formData.get("discountCode");
  const discountType = formData.get("discountType");
  const discount_Value = formData.get("discount_Value") || "0";

  const selectedProducts_Buy = JSON.parse(
    formData.get("selectedProducts_Buy") || "[]",
  );
  const flameLevel = JSON.parse(formData.get("flameLevels") || "[]");
  const freeItems = JSON.parse(formData.get("freeItems") || "[]");
  const Rules = JSON.parse(formData.get("rules_BOGO") || "[]");
  const checkout_products = JSON.parse(
    formData.get("checkout_products") || "[]",
  );
  //Order Pump id 4
  const bump_title = formData.get("bump_title");
  const bump_description = formData.get("bump_description");
  const bump_iconUrl = formData.get("bump_iconUrl");
  const precheck = formData.get("preChecked") ? true : false;
  const bump_onetickProducts = formData.get("button_variant");
  const tick_products = JSON.parse(formData.get("addOnProduct"));
  const bump_countries = JSON.parse(formData.get("targetCountries"));
  const offerType = formData.get("OfferType");

  const showConfetti = formData.get("showConfetti");
  const goalText = formData.get("goalText");
  const preGoalText = formData.get("preGoalText");
  const showLockedGoals = formData.get("showLockedGoals");
  const badgeImageRaw = formData.get("badgeImage");
  const badgeImageUrl = badgeImageRaw ? String(badgeImageRaw) : null;
  const barStyle = formData.get("barStyle");
  const barRadius = formData.get("barRadius");
  const barColors = JSON.parse(formData.get("barColors"));
  const upsellCampaign = await prisma.UpsellCampaign.create({
    data: {
      name: campaignName,
      type: selectedCampaignType,
      placement: JSON.stringify(placement),
      goalType,
      goalAmount: parseInt(goalAmounts),
      goalquantity: parseInt(goalQuantity),
      currency: currencys,
      shop: String(shop),
      rewardMode,
      rewardType,
      discountCode,
      discountType,
      // showConfetti: showConfetti === "on" || false,
      // showLockedGoals: showLockedGoals === "on", ===========>>> Please Fix` Error
      badgeImageUrl,
      barStyle,
      barRadius,
      barColors: JSON.stringify(barColors),
      goalText,
      preGoalText,
    },
  });

  if (selectedTriggerType === "products" && selectedProducts.length > 0) {
    await prisma.upsellTriggerProduct.createMany({
      data: selectedProducts.map((p) => ({
        campaignId: upsellCampaign.id,
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
    await prisma.UpsellTriggerCollection.createMany({
      data: selectedCollections.map((col) => ({
        campaignId: upsellCampaign.id,
        collectionId: col.id,
        title: col.title,
        handle: col.handle,
      })),
    });
    const collectionIds = selectedCollections.map((col) => col.id);
    await trigger_coll(collectionIds, shop, accessToken, upsellCampaign.id);
  } else {
    await trigger_all(shop, upsell_allproducts, accessToken, upsellCampaign.id);
  }

  if (selectedCampaignType === "add_to_unlock") {
    await add_to_unlock_(
      shop,
      accessToken,
      rewardType,
      campaignName,
      goalType,
      goalQuantity,
      goalAmounts,
      discountCode,
      rewardProducts,
      upsellCampaign,
      reward_collection,
      rewardMode,
      discountType,
      admin,
      Buy_products,
      selectedCollections,
    );
  } else if (selectedCampaignType === "buy_more_save_more") {
    await buy_more_save_more(
      accessToken,
      shop,
      selectedProducts_Buy,
      admin,
      selectedProducts,
      rewardMode,
      flameLevel,
      upsellCampaign,
    );
  } else if (selectedCampaignType === "buy_one_get_one") {
    console.log(
      "BOGO Campaign Triggered",
      buyCollectionPicker_BOGO,
      buyProductPicker_BOGO,
      Rules,
      freeItems,
    );
    await Bogo(
      accessToken,
      admin,
      upsellCampaign,
      buyProductPicker_BOGO, // Use BOGO-specific product picker
      freeItems,
      Rules,
      buyCollectionPicker_BOGO, // Use BOGO-specific collection picker
      reward_collection, // Use reward_collection instead of freeCollections
    );
  } else if (selectedCampaignType === "order_bump") {
    const Bumpdata = await OrderBump_backend(
      admin,
      upsellCampaign,
      bump_title,
      bump_description,
      bump_onetickProducts,
      bump_countries,
      bump_iconUrl,
      precheck,
      tick_products,
      offerType,
    );
  } else if (selectedCampaignType === "checkout_upsell") {
    console.log(selectedProducts, ",,,<<<<<<<<<<<<<===============");
    checkout_upsell_backend(
      admin,
      upsellCampaign,
      rewardType,
      rewardMode,
      discountType,
      discount_Value,
      checkout_products,
      selectedProducts,
    );
  } else if (selectedCampaignType === "post_purchase") {
    Post_Perchess_backend(
      admin,
      upsellCampaign,
      rewardType,
      rewardMode,
      discountType,
      discount_Value,
      checkout_products,
      selectedProducts,
    );
  }

  return {
    success: true,
    campaignID: upsellCampaign.id,
    message: "Campaign created successfully!",
  };
};

const ProgressBarPreview = ({
  barStyle,
  barRadius,
  barColors,
  badgeImage,
  showConfetti,
}) => {
  const style = {
    height: barStyle === "thin" ? "8px" : "16px",
    borderRadius:
      barRadius === "square" ? "0" : barRadius === "rounded" ? "4px" : "999px",
    backgroundColor: barColors.background,
    overflow: "hidden",
    position: "relative",
    backgroundImage: badgeImage ? `url(${badgeImage})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
  const progress = {
    width: "50%",
    height: "100%",
    backgroundColor: barColors.primary,
    transition: "width 0.3s ease-in-out",
    opacity: badgeImage ? "0.8" : "1",
  };

  return (
    <Card>
      <BlockStack gap="200">
        <Text variant="headingSm">Progress Bar Preview</Text>
        {showConfetti && (
          <div
            style={{
              textAlign: "center",
              padding: "8px",
              backgroundColor: "#f0f9ff",
              borderRadius: "6px",
              border: "1px solid #0ea5e9",
              marginBottom: "12px",
            }}
          >
            <Text
              variant="bodySm"
              style={{ color: "#0ea5e9", fontWeight: "600" }}
            >
              🎉 Confetti animation will show when goal is reached!
            </Text>
          </div>
        )}
        <Box paddingBlockStart="200">
          <div style={style}>
            <div style={progress}></div>
            {badgeImage && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "white",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              >
                🎁
              </div>
            )}
          </div>
        </Box>
        {badgeImage && (
          <Text variant="bodySm" tone="subdued" alignment="center">
            Background image applied to progress bar
          </Text>
        )}
      </BlockStack>
    </Card>
  );
};

export default function UpsellCampaignForm() {
  const fetcher = useFetcher();

  const [mainBtnLoading, setMainBtnLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [goalType, setGoalType] = useState("amount_cart");
  const [currency, setCurrency] = useState("MAD");
  const [goalAmount, setGoalAmount] = useState("");
  const [rewardType, setRewardType] = useState("manual");
  const [showConfetti, setShowConfetti] = useState(false);
  const [goalText, setGoalText] = useState("🎉 Goal reached!");
  const [preGoalText, setPreGoalText] = useState(
    "👉 Add {{amount_left}} to get free shipping",
  );
  const [rewardProducts, setRewardProducts] = useState([]);
  const [placement, setPlacement] = useState(["home"]);
  const [selectedTriggerType, setSelectedTriggerType] = useState("all");
  const [upsellselectedItems, setUpsellselectedItems] = useState([]);
  const [goalquantity, setGoalquantity] = useState("");
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] =
    useState("add_to_unlock");
  const [upsell_allproduct, setUpsell_allproduct] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState([]);
  const [freeItems, setFreeItems] = useState([]);
  const [rules, setRules] = useState([{ buy: "1", get: "1" }]);
  const [selectedProducts_Buy, setSelectedProducts_Buy] = useState([]);
  const [flameLevels, setFlameLevels] = useState([]);
  const [min_quantity, setMin_Quantity] = useState("3");
  const [discount_Value, setDiscount_Value] = useState("");
  const [rewardMode, setRewardMode] = useState("fixed");
  const [showLockedGoals, setShowLockedGoals] = useState(false);
  const [badgeImage, setBadgeImage] = useState(null);
  const [rewardCollection, setRewardCollection] = useState([]);
  const [checkout_products, setCheckout_Products] = useState([]);

  const [barStyle, setBarStyle] = useState("thin");
  const [barRadius, setBarRadius] = useState("rounded");
  const [barColors, setBarColors] = useState({
    primary: "#000000",
    secondary: "#cccccc",
    background: "#f2f2f2",
    goalComplete: "#4caf50",
  });
  const [buyCollectionPicker, setBuyCollectionPicker] = useState([]);
  const [buyCollectionPicker_BOGO, setBuyCollectionPicker_BOGO] = useState([]);
  const [buyProductPicker, setBuyProductPicker] = useState([]);
  const [buyProductPicker_BOGO, setBuyProductPicker_BOGO] = useState([]);
  const [productPickType, setProductPickType] = useState("products");
  const [freeGiftProducts, setFreeGiftProducts] = useState([]);
  const [offerType, setOfferType] = useState("shipping");

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show(
          fetcher.data.message || "Campaign created successfully!",
        );
      } else {
        shopify.toast.show(
          fetcher.data.message || "Failed to create campaign.",
          { isError: true },
        );
      }
      setMainBtnLoading(false);
    }
  }, [fetcher]);

  const getAmountLeft = () => {
    if (goalType === "amount_cart") {
      const goal = parseFloat(goalAmount || 0);
      const cartTotal = 0;
      return `${Math.max(goal - cartTotal, 0)} ${currency}`;
    }
    if (goalType === "quantity") {
      const goal = parseInt(goalquantity || 0);
      const currentQty = 0;
      return `${Math.max(goal - currentQty, 0)} items`;
    }
    return "";
  };

  const getRewardDescription = () => {
    if (rewardType === "discount")
      return `${discountCode} ${discountType === "percentage" ? "% off" : "off"}`;
    if (rewardType === "shipping") return "Free Shipping";
    if (rewardType === "gift")
      return rewardMode === "flame"
        ? "a free gift of your choice"
        : rewardProducts[0]?.title || "a free gift";
    return "reward";
  };

  const formattedGoalText = goalText
    .replace(/{{reward}}/g, getRewardDescription())
    .replace(/{{goal}}/g, goalAmount);
  const formattedPreGoalText = preGoalText
    .replace(/{{amount_left}}/g, getAmountLeft())
    .replace(/{{goal}}/g, goalAmount);

  const filteredProducts = upsellselectedItems.filter(
    (p) =>
      p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.handle?.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const filteredCollections = selectedCollections.filter(
    (c) =>
      c.title?.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      c.handle?.toLowerCase().includes(collectionSearch.toLowerCase()),
  );

  const removeItem = (id, setState, state) => {
    setState(state.filter((item) => item.id !== id));
  };

  const removeProduct = (id) =>
    removeItem(id, setUpsellselectedItems, upsellselectedItems);
  const removeCollection = (id) =>
    removeItem(id, setSelectedCollections, selectedCollections);
  const removeRewardProduct = (id) =>
    removeItem(id, setRewardProducts, rewardProducts);
  const removeRewardCollection = (id) =>
    removeItem(id, setRewardCollection, rewardCollection);

  const removeBuyProduct = (id) =>
    removeItem(id, setBuyProductPicker, buyProductPicker);
  const removeBuyProduct_BOGO = (id) =>
    removeItem(id, setBuyProductPicker_BOGO, buyProductPicker_BOGO);
  const removeBuyCollection = (id) =>
    removeItem(id, setBuyCollectionPicker, buyCollectionPicker);
  const removeBuyCollection_BOGO = (id) =>
    removeItem(id, setBuyCollectionPicker_BOGO, buyCollectionPicker_BOGO);
  const removeFreeItem = (id) => removeItem(id, setFreeItems, freeItems);

  const productpicker = async () => {
    try {
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

  const collectionPicker = async () => {
    try {
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

  const rewardPicker = async () => {
    if (rewardProducts.length >= 4) {
      shopify.toast.show("You can only select up to 4 reward products.", {
        isError: true,
      });
      return;
    }

    try {
      const selectedItems = await window.shopify.resourcePicker({
        multiple: true,
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

        const newItems = products.filter(
          (p) => !rewardProducts.some((pr) => pr.id === p.id),
        );

        setRewardProducts((prev) => {
          const combined = [...prev, ...newItems];
          if (combined.length > 4) {
            shopify.toast.show("Only 4 reward products can be selected.", {
              isError: true,
            });
          }
          return combined.slice(0, 4);
        });
      }
    } catch (error) {
      console.error("Error in reward picker:", error);
      shopify.toast.show("Failed to select reward products.", {
        isError: true,
      });
    }
  };

  const rewardCollectionPicker = async () => {
    try {
      const selectedCollections = await window.shopify.resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
      });

      if (selectedCollections) {
        const collections = selectedCollections.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
        }));
        setRewardCollection((prev) => [
          ...prev,
          ...collections.filter(
            (c) => !prev.some((existing) => existing.id === c.id),
          ),
        ]);
      }
    } catch (error) {
      console.error("Error in reward collection picker:", error);
      shopify.toast.show("Failed to select reward collections.", {
        isError: true,
      });
    }
  };

  const Free_gift_piker = async () => {
    try {
      const selectedItems = await window.shopify.resourcePicker({
        multiple: true,
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
        setFreeItems((prev) => [
          ...prev,
          ...products.filter((p) => !prev.find((pr) => pr.id === p.id)),
        ]);
      }
    } catch (error) {
      console.error("Error in free gift picker:", error);
      shopify.toast.show("Failed to select free gift products.", {
        isError: true,
      });
    }
  };

  const BuyCollectionPicker = async () => {
    try {
      const Buy_products = await window.shopify.resourcePicker({
        type: "collection",
        multiple: false,
        action: "select",
      });

      if (Buy_products && Buy_products.length > 0) {
        const selected = Buy_products[0];
        const products = {
          id: selected.id.split("/").pop(),
          title: selected.title,
          handle: selected.handle,
        };
        setBuyCollectionPicker([products]);
      }
    } catch (error) {
      console.error("Error in buy collection picker:", error);
      shopify.toast.show("Failed to select buy collection.", { isError: true });
    }
  };

  const Buyproductpicker = async () => {
    try {
      const selectedItems = await window.shopify.resourcePicker({
        selectionIds: buyProductPicker.map((product) => product.id),
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
            !buyProductPicker.some((existing) => existing.id === newProduct.id),
        );
        setBuyProductPicker((prev) => [...prev, ...uniqueProducts]);
      }
    } catch (error) {
      console.error("Error in buy product picker:", error);
      shopify.toast.show("Failed to select buy products.", { isError: true });
    }
  };

  // const addRule = () => {
  //   setRules([...rules, { buy: "1", get: "1" }]);
  // };

  // const updateRule = (index, field, value) => {
  //   const newRules = [...rules];
  //   newRules[index][field] = value;
  //   setRules(newRules);
  // };

  // const removeRule = (index) => {
  //   setRules(rules.filter((_, i) => i !== index));
  // };

  const handleSubmit = () => {
    if (!campaignName) {
      shopify.toast.show("Campaign name is required.", { isError: true });
      return;
    }
    if (selectedCampaignType === "add_to_unlock") {
      console.log(discountType, "thsi New VAlue");
      if (
        discountType === "percentage" &&
        (discountCode <= 0 || discountCode > 100.1)
      ) {
        shopify.toast.show("Discount percentage must be between 1 and 100.", {
          isError: true,
        });
        return;
      }
      if (goalType === "amount_cart" && !goalAmount) {
        shopify.toast.show("Goal amount is required.", { isError: true });
        return;
      }
      if (goalType === "quantity" && !goalquantity) {
        shopify.toast.show("Goal quantity is required.", { isError: true });
        return;
      }
    }
    if (
      selectedCampaignType === "buy_one_get_one" &&
      (!freeItems.length || !rules.length)
    ) {
      shopify.toast.show("BOGO requires free items and rules.", {
        isError: true,
      });
      return;
    }
    if (selectedCampaignType === "buy_more_save_more") {
      // 🔹 Validate Buy More Save More + Fixed
      if (rewardMode === "fixed") {
        for (const product of selectedProducts_Buy) {
          for (const level of product.levels) {
            const discountValue = parseFloat(level.discount);
            const discountType = level.DiscountType;

            if (
              discountType === "percentage" &&
              (isNaN(discountValue) ||
                discountValue <= 0 ||
                discountValue > 100)
            ) {
              shopify.toast.show(
                `Invalid discount for "${product.title}": Percentage must be between 1 and 100.`,
                { isError: true },
              );
              return;
            }
          }
        }
      }

      // 🔹 Validate Buy More Save More + Flame
      if (rewardMode === "flame") {
        for (const level of flameLevels) {
          const discountValue = parseFloat(level.discount);
          const discountType = level.discountType;

          if (
            discountType === "percentage" &&
            (isNaN(discountValue) || discountValue <= 0 || discountValue > 100)
          ) {
            shopify.toast.show(
              `Invalid flame level discount: Percentage must be between 1 and 100.`,
              { isError: true },
            );
            return;
          }
        }
      }
    }
    if (selectedCampaignType === "order_bump") {
      if (addOnProduct === null) {
        shopify.toast.show("Please select a product for the Order Bump", {
          isError: true,
        });
        return;
      }
    }

    setMainBtnLoading(true);
    const formData = new FormData();

    formData.append("campaignName", campaignName);
    formData.append("selectedCampaignType", selectedCampaignType);
    formData.append("selectedTriggerType", selectedTriggerType);

    formData.append("iconSize", iconSize);
    formData.append("addOnProduct", JSON.stringify(addOnProduct || {}));
    formData.append("bump_title", offerTitle);
    formData.append("bump_description", offerDescription);
    formData.append("preChecked", preChecked ? "true" : "false");
    formData.append("button_variant", buttonVariant);
    formData.append("targetCountries", JSON.stringify(targetCountries));
    formData.append("excludeCountries", JSON.stringify(excludeCountries));
    formData.append("OfferType", offerType);
    formData.append("checkout_products", JSON.stringify(checkout_products));

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
    formData.append("rewardType", rewardType);
    formData.append("rewardMode", rewardMode);
    formData.append("goalType", goalType);
    formData.append("goalAmount", goalAmount || "0");
    formData.append("goalquantity", goalquantity || "0");
    formData.append("currency", currency);
    formData.append("discount_Value", discount_Value || "0");
    formData.append("discountCode", discountCode);
    formData.append("discountType", discountType) || "percentage";
    formData.append("rewardProducts", JSON.stringify(rewardProducts));
    formData.append("reward_collection", JSON.stringify(rewardCollection));
    formData.append(
      "selectedProducts_Buy",
      JSON.stringify(selectedProducts_Buy),
    );
    formData.append("flameLevels", JSON.stringify(flameLevels));
    formData.append("freeItems", JSON.stringify(freeItems));
    formData.append(
      "buyCollectionPicker_BOGO",
      JSON.stringify(buyCollectionPicker_BOGO),
    ); // Add BOGO collection picker
    formData.append(
      "buyProductPicker_BOGO",
      JSON.stringify(buyProductPicker_BOGO),
    ); // Add BOGO product picker
    formData.append("Buy_productPicker", JSON.stringify(buyProductPicker));
    formData.append("rules_BOGO", JSON.stringify(rules));
    formData.append("showConfetti", showConfetti ? "on" : "off");
    formData.append("goalText", goalText);
    formData.append("preGoalText", preGoalText);
    formData.append("placement", JSON.stringify(placement));
    formData.append("showLockedGoals", showLockedGoals ? "on" : "off");
    formData.append("badgeImage", badgeImage || "");
    formData.append("barStyle", barStyle);
    formData.append("barRadius", barRadius);
    formData.append("barColors", JSON.stringify(barColors));

    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
  };

  const goalOptions = [
    { label: "$ Amount in Cart", value: "amount_cart" },
    { label: "Quantity", value: "quantity" },
  ];
  const selected_campaign_type = [
    { label: "Add To Unlock", value: "add_to_unlock" },
    { label: "Buy More Save More", value: "buy_more_save_more" },
    { label: "Buy One Get One", value: "buy_one_get_one" },
    { label: "Order Bump", value: "order_bump" },
    { label: "Checkout Upsell", value: "checkout_upsell" },
    { label: "Post Purchase", value: "post_purchase" },
  ];
  const currencies = [
    { label: "MAD", value: "MAD" },
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
  ];

  // Order Bump state variables
  const [addOnProduct, setAddOnProduct] = useState(null);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [preChecked, setPreChecked] = useState(false);
  const [buttonVariant, setButtonVariant] = useState("primary");
  const [iconSize, setIconSize] = useState("medium");
  const [targetCountries, setTargetCountries] = useState([]);
  const [excludeCountries, setExcludeCountries] = useState([]);

  return (
    <Page title="Create Upsell Campaign" fullWidth padding="400">
      <FormLayout>
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <TextField
                    label="Campaign Name"
                    value={campaignName}
                    onChange={setCampaignName}
                    requiredIndicator
                  />
                  <Divider />
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Select a Campaign Type
                  </Text>
                  <InlineStack gap="400">
                    {selected_campaign_type.map((type) => (
                      <Button
                        key={type.value}
                        pressed={selectedCampaignType === type.value}
                        onClick={() => setSelectedCampaignType(type.value)}
                        size="medium"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </InlineStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Selected Products Upsell
                  </Text>
                  <Text as="p">
                    Choose which products will trigger the upsell offer.
                  </Text>
                  <InlineStack gap="200">
                    <RadioButton
                      label="All products"
                      checked={selectedTriggerType === "all"}
                      name="triggerType"
                      onChange={() => {
                        setSelectedTriggerType("all");
                        setUpsell_allproduct(true);
                      }}
                    />
                    <RadioButton
                      label="Specific products"
                      checked={selectedTriggerType === "products"}
                      name="triggerType"
                      onChange={() => setSelectedTriggerType("products")}
                    />
                    <RadioButton
                      label="Specific collections"
                      checked={selectedTriggerType === "collections"}
                      name="triggerType"
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
                          <Button onClick={productpicker} size="medium">
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
                          <Button onClick={collectionPicker} size="medium">
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
                                  <InlineStack align="space-between" gap="300">
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
                </BlockStack>
              </Card>
              {selectedCampaignType === "add_to_unlock" && (
                <Card>
                  <BlockStack gap="400">
                    <Card sectioned>
                      <BlockStack gap="300">
                        <Text variant="headingMd" as="h3">
                          Goal Configuration
                        </Text>
                        <Box paddingBlockStart="200">
                          <Text variant="bodyMd" fontWeight="semibold">
                            Trigger Type
                          </Text>
                          <InlineStack
                            gap="200"
                            blockAlign="center"
                            wrap={false}
                          >
                            {goalOptions.map((type) => (
                              <Button
                                key={type.value}
                                pressed={goalType === type.value}
                                onClick={() => setGoalType(type.value)}
                                size="medium"
                              >
                                {type.label}
                              </Button>
                            ))}
                          </InlineStack>
                        </Box>
                        {goalType === "amount_cart" && (
                          <TextField
                            label="Cart Total Goal"
                            type="number"
                            value={goalAmount}
                            onChange={(value) => {
                              setGoalAmount(value);
                              setGoalquantity("");
                            }}
                            prefix="$"
                            requiredIndicator
                            helpText="Set the minimum cart total required to unlock the reward"
                          />
                        )}
                        {goalType === "quantity" && (
                          <TextField
                            label="Product Quantity Goal"
                            type="number"
                            value={goalquantity}
                            onChange={(value) => {
                              setGoalAmount("");
                              setGoalquantity(value);
                            }}
                            requiredIndicator
                            helpText="How many products need to be added to the cart to unlock the reward"
                          />
                        )}
                      </BlockStack>
                    </Card>
                    <Card sectioned>
                      <BlockStack gap="300">
                        <Text variant="headingMd" as="h3">
                          Reward Type
                        </Text>
                        <Box paddingBlockStart="100">
                          <ChoiceList
                            title="Reward Mode"
                            choices={[
                              { label: "Fixed Deal", value: "fixed" },
                              {
                                label: "Flame Match (Customer picks)",
                                value: "flame",
                              },
                            ]}
                            selected={[rewardMode]}
                            onChange={(value) => {
                              const mode = value[0];
                              setRewardMode(mode);
                              setRewardType(
                                mode === "flame" ? "gift" : "discount",
                              );
                            }}
                          />
                        </Box>
                        {rewardMode === "fixed" && (
                          <ChoiceList
                            title="Reward Type"
                            choices={[
                              { label: "Discount", value: "discount" },
                              { label: "Free Shipping", value: "shipping" },
                              { label: "Free Gift", value: "gift" },
                            ]}
                            selected={[rewardType]}
                            onChange={(value) => setRewardType(value[0])}
                          />
                        )}
                      </BlockStack>
                    </Card>
                    <Card>
                      <BlockStack gap="200">
                        {rewardType === "gift" && (
                          <>
                            <Text as="h2" variant="headingMd" fontWeight="bold">
                              Buy X Configuration
                            </Text>
                            <Text as="p">
                              Choose which products or collections will trigger
                              the Buy X, Get Y offer.
                            </Text>
                            <InlineStack gap="200">
                              <RadioButton
                                label="Specific products"
                                checked={productPickType === "products"}
                                name="triggerType"
                                onChange={() => setProductPickType("products")}
                              />
                              <RadioButton
                                label="Specific collections"
                                checked={productPickType === "collections"}
                                name="triggerType"
                                onChange={() =>
                                  setProductPickType("collections")
                                }
                              />
                            </InlineStack>
                            {productPickType === "products" && (
                              <Box padding="200" borderStyle="base">
                                <BlockStack gap="200">
                                  <Text
                                    as="h3"
                                    variant="headingSm"
                                    fontWeight="bold"
                                  >
                                    Selected Products
                                  </Text>
                                  <InlineStack gap="200">
                                    <Button
                                      onClick={Buyproductpicker}
                                      size="medium"
                                    >
                                      Browse Products
                                    </Button>
                                  </InlineStack>
                                  {buyProductPicker.length > 0 ? (
                                    <ResourceList
                                      resourceName={{
                                        singular: "product",
                                        plural: "products",
                                      }}
                                      items={buyProductPicker}
                                      renderItem={(item) => {
                                        const {
                                          id,
                                          title,
                                          handle,
                                          price,
                                          media,
                                        } = item;
                                        return (
                                          <ResourceItem id={id}>
                                            <InlineStack
                                              align="space-between"
                                              gap="300"
                                            >
                                              <InlineStack
                                                gap="300"
                                                align="center"
                                              >
                                                {media ? (
                                                  <Image
                                                    source={media}
                                                    alt={title}
                                                    width="60px"
                                                  />
                                                ) : (
                                                  <Text>No image</Text>
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
                                                  removeBuyProduct(id)
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
                                    <Text>No products selected</Text>
                                  )}
                                </BlockStack>
                              </Box>
                            )}
                            {productPickType === "collections" && (
                              <Box padding="200" borderStyle="base">
                                <BlockStack gap="200">
                                  <Text
                                    as="h3"
                                    variant="headingSm"
                                    fontWeight="bold"
                                  >
                                    Selected Collections
                                  </Text>
                                  <InlineStack gap="200">
                                    <Button
                                      onClick={BuyCollectionPicker}
                                      size="medium"
                                    >
                                      Browse Collections
                                    </Button>
                                  </InlineStack>
                                  {buyCollectionPicker.length > 0 ? (
                                    <ResourceList
                                      resourceName={{
                                        singular: "collection",
                                        plural: "collections",
                                      }}
                                      items={buyCollectionPicker}
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
                                                  removeBuyCollection(id)
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
                                    <Text>No collections selected</Text>
                                  )}
                                </BlockStack>
                              </Box>
                            )}
                          </>
                        )}
                      </BlockStack>
                    </Card>
                    <Card sectioned>
                      <BlockStack gap="300">
                        <Text variant="headingMd" as="h3">
                          Reward Setup
                        </Text>
                        {rewardType === "discount" && (
                          <BlockStack gap="300">
                            <TextField
                              label="Discount Value"
                              placeholder="10, 20, etc."
                              value={discountCode}
                              onChange={setDiscountCode}
                              type="number"
                              helpText="Customers will use this code at checkout"
                            />
                            <Select
                              label="Discount Type"
                              options={[
                                {
                                  label: "Percentage (%)",
                                  value: "percentage",
                                },
                                { label: "Fixed Amount ($)", value: "amount" },
                              ]}
                              value={discountType}
                              onChange={setDiscountType}
                            />
                            <Box paddingBlockStart="200">
                              <Button
                                onClick={rewardPicker}
                                variant="primary"
                                size="medium"
                              >
                                Select Eligible Products
                              </Button>
                              {rewardProducts.length > 0 && (
                                <Box paddingBlockStart="200">
                                  <Text fontWeight="semibold">
                                    Selected Products:
                                  </Text>
                                  <BlockStack gap="100">
                                    {rewardProducts.map((item) => (
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
                                            removeRewardProduct(item.id)
                                          }
                                        >
                                          Remove
                                        </Button>
                                      </InlineStack>
                                    ))}
                                  </BlockStack>
                                </Box>
                              )}
                            </Box>
                          </BlockStack>
                        )}
                        {rewardType === "shipping" && (
                          <BlockStack gap="300">
                            <Banner tone="success">
                              Free shipping will be automatically applied when
                              the goal is reached
                            </Banner>
                            <Button
                              onClick={rewardPicker}
                              variant="primary"
                              size="medium"
                            >
                              Select Eligible Products
                            </Button>
                            {rewardProducts.length > 0 && (
                              <Box paddingBlockStart="200">
                                <Text fontWeight="semibold">
                                  Selected Products:
                                </Text>
                                <BlockStack gap="100">
                                  {rewardProducts.map((item) => (
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
                                          removeRewardProduct(item.id)
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
                        {rewardType === "gift" && rewardMode === "fixed" && (
                          <BlockStack gap="300">
                            <Text variant="bodyMd" tone="subdued">
                              Select the specific product that will be given as
                              a free gift when the goal is reached.
                            </Text>
                            <Button
                              onClick={rewardPicker}
                              variant="primary"
                              size="medium"
                            >
                              Select Free Gift Product
                            </Button>
                            {rewardProducts.length > 0 && (
                              <Box paddingBlockStart="200">
                                <Text fontWeight="semibold">
                                  Selected Free Gift:
                                </Text>
                                <BlockStack gap="100">
                                  {rewardProducts.map((item) => (
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
                                          removeRewardProduct(item.id)
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
                        {rewardType === "gift" && rewardMode === "flame" && (
                          <BlockStack gap="300">
                            <Text variant="bodyMd" tone="subdued">
                              Select collections of products that customers can
                              choose from when they qualify for a free gift.
                            </Text>
                            <Button
                              onClick={rewardCollectionPicker}
                              variant="primary"
                              size="medium"
                            >
                              Select Reward Collections
                            </Button>
                            {rewardCollection.length > 0 && (
                              <Box>
                                <Text fontWeight="semibold">
                                  Selected Reward Collections:
                                </Text>
                                <BlockStack gap="100">
                                  {rewardCollection.map((item) => (
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
                                          removeRewardCollection(item.id)
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
                  </BlockStack>
                </Card>
              )}
              {selectedCampaignType === "buy_more_save_more" && (
                <BuyMore
                  discount_Value={discount_Value}
                  discount_type={discountType}
                  min_quantity={min_quantity}
                  rewardMode={rewardMode}
                  selectedProducts={selectedProducts_Buy}
                  flameLevels={flameLevels}
                  setFlameLevels={setFlameLevels}
                  setRewardMode={setRewardMode}
                  setSelectedProducts={setSelectedProducts_Buy}
                />
              )}
              {selectedCampaignType === "buy_one_get_one" && (
                <>
                  <BogoUpsell
                    initialFreeItems={freeItems}
                    rules={rules}
                    mode={rewardMode}
                    setMode={setRewardMode}
                    setFreeItems={setFreeItems}
                    setRules={setRules}
                    setBuyProductPicker_BOGO={setBuyProductPicker_BOGO}
                    buyProductPicker_BOGO={buyProductPicker_BOGO}
                    buyCollectionPicker_BOGO={buyCollectionPicker_BOGO}
                    setBuyCollectionPicker_BOGO={setBuyCollectionPicker_BOGO}
                    productPickType={productPickType}
                    setProductPickType={setProductPickType}
                  />
                </>
              )}
              {selectedCampaignType === "order_bump" && (
                <OrderBump
                  addOnProduct={addOnProduct}
                  setAddOnProduct={setAddOnProduct}
                  offerTitle={offerTitle}
                  setOfferTitle={setOfferTitle}
                  offerDescription={offerDescription}
                  setOfferDescription={setOfferDescription}
                  preChecked={preChecked}
                  setPreChecked={setPreChecked}
                  buttonVariant={buttonVariant}
                  setButtonVariant={setButtonVariant}
                  iconSize={iconSize}
                  setIconSize={setIconSize}
                  targetCountries={targetCountries}
                  setTargetCountries={setTargetCountries}
                  excludeCountries={excludeCountries}
                  setExcludeCountries={setExcludeCountries}
                  offerType={offerType}
                  setOfferType={setOfferType}
                />
              )}
              {selectedCampaignType === "checkout_upsell" && (
                <CheckoutUI
                  discountType={discountType}
                  setDiscountType={setDiscountType}
                  discountValue={discount_Value}
                  setDiscountValue={setDiscount_Value}
                  setUpsellType={setRewardMode}
                  upsellType={rewardMode}
                  selectedProducts={checkout_products}
                  setSelectedProducts={setCheckout_Products}
                />
              )}
              {selectedCampaignType === "post_purchase" && (
                <Post_Perchess
                  discountType={discountType}
                  setDiscountType={setDiscountType}
                  discountValue={discount_Value}
                  setDiscountValue={setDiscount_Value}
                  setUpsellType={setRewardMode}
                  upsellType={rewardMode}
                  selectedProducts={checkout_products}
                  setSelectedProducts={setCheckout_Products}
                />
              )}

              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd">Progress Bar Design</Text>
                  <Select
                    label="Bar Thickness"
                    options={[
                      { label: "Thin", value: "thin" },
                      { label: "Thick", value: "thick" },
                    ]}
                    value={barStyle}
                    onChange={setBarStyle}
                  />
                  <Select
                    label="Corner Radius"
                    options={[
                      { label: "Square", value: "square" },
                      { label: "Slightly Rounded", value: "rounded" },
                      { label: "Fully Rounded", value: "full" },
                    ]}
                    value={barRadius}
                    onChange={setBarRadius}
                  />

                  {/* Background Image Upload */}
                  <Divider />
                  <Text variant="headingMd">Background Customization</Text>
                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="semibold">
                      Progress Bar Background Image
                    </Text>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setBadgeImage(event.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ marginBottom: "8px" }}
                    />
                    {badgeImage && (
                      <div
                        style={{
                          padding: "10px",
                          border: "1px solid #e1e1e1",
                          borderRadius: "8px",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        <Text variant="bodySm" fontWeight="semibold">
                          Preview:
                        </Text>
                        <img
                          src={badgeImage}
                          alt="Background preview"
                          style={{
                            width: "100%",
                            maxWidth: "200px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            marginTop: "8px",
                          }}
                        />
                      </div>
                    )}
                  </BlockStack>

                  <Divider />
                  <Text variant="headingMd">Visual Effects</Text>
                  <Checkbox
                    label="Show Confetti Animation"
                    checked={showConfetti}
                    onChange={setShowConfetti}
                    helpText="Display confetti animation when customers reach their goal"
                  />
                  <Checkbox
                    label="Show Locked Goals"
                    checked={showLockedGoals}
                    onChange={setShowLockedGoals}
                    helpText="Display locked goals to encourage customers to reach higher tiers"
                  />
                  <Checkbox
                    label="Show Badge Icons"
                    checked={badgeImage !== null}
                    onChange={(checked) => {
                      if (!checked) setBadgeImage(null);
                    }}
                    helpText="Display custom badge icons on the progress bar"
                  />
                  <BlockStack gap="200">
                    <Text variant="headingMd">Progress Bar Colors</Text>
                    <InlineStack gap="500">
                      <BlockStack gap="150">
                        <Text>Primary</Text>
                        <TextField
                          type="color"
                          value={barColors.primary}
                          onChange={(value) =>
                            setBarColors({ ...barColors, primary: value })
                          }
                        />
                      </BlockStack>
                      <BlockStack gap="150">
                        <Text>Secondary</Text>
                        <TextField
                          type="color"
                          value={barColors.secondary}
                          onChange={(value) =>
                            setBarColors({ ...barColors, secondary: value })
                          }
                        />
                      </BlockStack>
                      <BlockStack gap="150">
                        <Text>Background</Text>
                        <TextField
                          type="color"
                          value={barColors.background}
                          onChange={(value) =>
                            setBarColors({ ...barColors, background: value })
                          }
                        />
                      </BlockStack>
                      <BlockStack gap="150">
                        <Text>Goal Complete</Text>
                        <TextField
                          type="color"
                          value={barColors.goalComplete}
                          onChange={(value) =>
                            setBarColors({ ...barColors, goalComplete: value })
                          }
                        />
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <ProgressBarPreview
                barStyle={barStyle}
                barRadius={barRadius}
                barColors={barColors}
                badgeImage={badgeImage}
                showConfetti={showConfetti}
              />
              <Card title="Goal Text Customization">
                <BlockStack gap="300">
                  <Text variant="headingSm">
                    Insert Smart Variables into Text
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Add variables like <code>{"{{goal}}"}</code> or{" "}
                    <code>{"{{reward}}"}</code> to personalize messaging.
                  </Text>
                  <TextField
                    label="Goal Reached Text"
                    value={goalText}
                    onChange={setGoalText}
                    multiline
                    helpText="Use variables like {{goal}}, {{reward}}"
                  />
                  <TextField
                    label="Before Goal Reached Text"
                    value={preGoalText}
                    onChange={setPreGoalText}
                    multiline
                    helpText="Use variables like {{amount_left}}, {{goal}}"
                  />
                </BlockStack>
              </Card>
              <InlineStack>
                <Button
                  onClick={handleSubmit}
                  loading={mainBtnLoading}
                  size="medium"
                >
                  Submit
                </Button>
              </InlineStack>
            </BlockStack>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <div style={{ position: "sticky", top: "20px" }}>
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="200">
                    <ChoiceList
                      title="Select Campaign Placement"
                      choices={[
                        { label: "Homepage", value: "home" },
                        { label: "Product", value: "Page" },
                        { label: "Cart Page", value: "cart" },
                      ]}
                      selected={placement}
                      allowMultiple
                      onChange={setPlacement}
                    />
                  </BlockStack>
                </Card>

                {/* Homepage Customization */}
                {placement.includes("home") && (
                  <Card>
                    <BlockStack gap="200">
                      <Text variant="headingMd">
                        Homepage Block Customization
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        Customize how the upsell offer appears as a block on
                        your homepage
                      </Text>
                      <TextField
                        label="Block Title"
                        value={goalText}
                        onChange={setGoalText}
                        placeholder="e.g., Unlock Free Shipping!"
                        helpText="This will be the main heading of the homepage block"
                      />
                      <TextField
                        label="Block Description"
                        value={preGoalText}
                        onChange={setPreGoalText}
                        placeholder="e.g., Add $25 more to get free shipping"
                        helpText="This will be the description text below the title"
                      />
                      <Select
                        label="Block Position"
                        options={[
                          { label: "Top of Page", value: "top" },
                          { label: "Middle of Page", value: "middle" },
                          { label: "Bottom of Page", value: "bottom" },
                        ]}
                        value="middle"
                        onChange={() => {}}
                        helpText="Choose where the block appears on your homepage"
                      />
                      <Checkbox
                        label="Show Progress Bar"
                        checked={true}
                        onChange={() => {}}
                        helpText="Display the progress bar in the homepage block"
                      />
                    </BlockStack>
                  </Card>
                )}

                <Card title="Live Preview">
                  <BlockStack gap="200">
                    <Text variant="headingSm">Preview</Text>

                    {/* Placement-specific previews */}
                    {placement.includes("home") && (
                      <Card padding="300">
                        <BlockStack gap="200">
                          <Text variant="headingSm" fontWeight="semibold">
                            Homepage Section Preview
                          </Text>
                          <HomeSectionPreview
                            title="Bundle Deals"
                            backgroundColor="#fff"
                            products={filteredProducts}
                            offers={offers}
                            showModal={true}
                          />
                        </BlockStack>
                      </Card>
                    )}

                    {placement.includes("Page") && (
                      <Card padding="300">
                        <BlockStack gap="200">
                          <Text variant="headingSm" fontWeight="semibold">
                            Product Page Preview
                          </Text>
                          <div
                            style={{
                              padding: "15px",
                              border: "1px solid #e1e1e1",
                              borderRadius: "6px",
                              backgroundColor: "#fff",
                            }}
                          >
                            <Text variant="bodyMd" fontWeight="semibold">
                              {formattedGoalText}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              {formattedPreGoalText}
                            </Text>
                          </div>
                        </BlockStack>
                      </Card>
                    )}

                    {placement.includes("cart") && (
                      <Card padding="300">
                        <BlockStack gap="200">
                          <Text variant="headingSm" fontWeight="semibold">
                            Cart Page Preview - Monstercart Style
                          </Text>
                          <div
                            style={{
                              padding: "0",
                              border: "1px solid #e1e1e1",
                              borderRadius: "12px",
                              backgroundColor: "#fff",
                              fontFamily:
                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                              overflow: "hidden",
                            }}
                          >
                            {/* Cart Header */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "20px 20px 16px 20px",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                            >
                              <Text
                                variant="headingMd"
                                fontWeight="bold"
                                style={{ color: "#333" }}
                              >
                                Your Cart
                              </Text>
                              <button
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  fontSize: "20px",
                                  color: "#666",
                                  cursor: "pointer",
                                  padding: "4px",
                                }}
                              >
                                ✕
                              </button>
                            </div>

                            {/* Progress Bar Section */}
                            <div
                              style={{
                                padding: "20px",
                                backgroundColor: "#f8f9fa",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "12px",
                                }}
                              >
                                <span style={{ fontSize: "16px" }}>👉</span>
                                <Text
                                  variant="bodyMd"
                                  fontWeight="semibold"
                                  style={{ color: "#333" }}
                                >
                                  Add 30.00 dh to get a Free Gift
                                </Text>
                              </div>

                              {/* Progress Bar */}
                              <div
                                style={{
                                  position: "relative",
                                  height: "12px",
                                  backgroundColor: "#e5e7eb",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  marginBottom: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "25%",
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)",
                                    borderRadius: "6px",
                                    transition: "width 0.3s ease-in-out",
                                  }}
                                ></div>

                                {/* Goal Indicator */}
                                <div
                                  style={{
                                    position: "absolute",
                                    right: "-6px",
                                    top: "-6px",
                                    width: "24px",
                                    height: "24px",
                                    backgroundColor: "#8b5cf6",
                                    borderRadius: "50%",
                                    border: "3px solid white",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                  }}
                                >
                                  🎁
                                </div>
                              </div>

                              {/* Goal Text */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "12px",
                                  color: "#666",
                                }}
                              >
                                <span>Free Gift</span>
                                <span
                                  style={{
                                    fontWeight: "600",
                                    color: "#8b5cf6",
                                  }}
                                >
                                  40.00 dh
                                </span>
                              </div>
                            </div>

                            {/* Cart Items */}
                            <div style={{ padding: "20px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  marginBottom: "16px",
                                }}
                              >
                                <img
                                  src="https://via.placeholder.com/60x60/ffd700/ffffff?text=🎁"
                                  alt="Gift Card"
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <Text
                                    variant="bodyMd"
                                    fontWeight="semibold"
                                    style={{
                                      color: "#333",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    Gift Card
                                  </Text>
                                  <Text
                                    variant="bodySm"
                                    style={{ color: "#666" }}
                                  >
                                    10.00 dh
                                  </Text>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "6px",
                                    padding: "4px",
                                  }}
                                >
                                  <button
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      border: "1px solid #e1e1e1",
                                      borderRadius: "4px",
                                      backgroundColor: "white",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    -
                                  </button>
                                  <span
                                    style={{
                                      minWidth: "20px",
                                      textAlign: "center",
                                      fontSize: "14px",
                                    }}
                                  >
                                    1
                                  </span>
                                  <button
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      border: "1px solid #e1e1e1",
                                      borderRadius: "4px",
                                      backgroundColor: "white",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#666",
                                    cursor: "pointer",
                                    padding: "8px",
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Free Gift Offer */}
                            <div
                              style={{
                                padding: "20px",
                                backgroundColor: "#f8f9fa",
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              <div
                                style={{
                                  backgroundColor: "white",
                                  border: "2px solid #8b5cf6",
                                  borderRadius: "12px",
                                  padding: "16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "16px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    backgroundColor: "#f3f4f6",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                  }}
                                >
                                  🎁
                                </div>
                                <div style={{ flex: 1 }}>
                                  <Text
                                    variant="bodyMd"
                                    fontWeight="bold"
                                    style={{
                                      color: "#333",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    Add 30.00 dh to unlock Free Gift 🎁
                                  </Text>
                                  <Text
                                    variant="bodySm"
                                    style={{
                                      color: "#666",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    Today only offer
                                  </Text>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <Text
                                      variant="bodySm"
                                      style={{
                                        textDecoration: "line-through",
                                        color: "#999",
                                      }}
                                    >
                                      2,629.95 dh
                                    </Text>
                                    <Text
                                      variant="headingSm"
                                      fontWeight="bold"
                                      style={{ color: "#8b5cf6" }}
                                    >
                                      Free
                                    </Text>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </BlockStack>
                      </Card>
                    )}

                    {placement.length === 0 && (
                      <Text tone="subdued">
                        Select a placement to see preview
                      </Text>
                    )}
                  </BlockStack>
                </Card>
              </BlockStack>
            </div>
          </Layout.Section>
        </Layout>
      </FormLayout>
    </Page>
  );
}

// <Card title="Live Preview">
//   <BlockStack gap="200">
//     <InlineStack align="space-between" gap={300}>
//       <Text variant="headingSm">Preview</Text>
//       <InlineStack align="center" gap={200}>
//         {placement.includes("home") && (
//           <Button><Icon tone="subdued" source={HomeFilledIcon} /></Button>
//         )}
//         {placement.includes("product") && (
//           <Button><Icon tone="subdued" source={ProductIcon} /></Button>
//         )}
//         {placement.includes("cart") && (
//           <Button><Icon tone="subdued" source={CartFilledIcon} /></Button>
//         )}
//         {placement.includes("checkout") && (
//           <Button><Icon tone="subdued" source={CheckoutIcon} /></Button>
//         )}
//       </InlineStack>
//     </InlineStack>

//     {/* ✅ Render dynamic preview */}
//     {placement.includes("home") && <HomePreview />}
//     {/* {placement.includes("product") && <ProductPagePreview />}
//     {placement.includes("cart") && <CartPagePreview />}
//     {placement.includes("checkout") && <CheckoutPreview />}
//     {placement.includes("post_purchase") && <PostPurchasePreview />} */}

//   </BlockStack>
// </Card>
