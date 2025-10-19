import { useState, useEffect } from "react";
import home_icon from './_index/media/icon-home.png';
import save from './_index/media/save-1.jpg'
import save2 from './_index/media/save-2.png'
import gift from './_index/media/gift.png'
import free from './_index/media/shipping.png'
import discou from './_index/media/disc.png'
import './_index/style.css';
import './_index/home.css'
import './_index/preview-styles.css';
import './components/RewardsCard';
import {
    Page,
    FormLayout,
    Layout,
    BlockStack,
    Card,
    TextField,
    Divider,
    InlineStack,
    RadioButton,
    Box,
    ResourceList,
    ResourceItem,
    Button,
    Image,
    ChoiceList,
    Text,
    Select,
    Banner,
    Checkbox,
    Icon,
    Modal,
    Thumbnail,
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon, ButtonIcon, HomeIcon, CartIcon, ProductIcon } from "@shopify/polaris-icons";
import { useFetcher, useLocation, useNavigate } from '@remix-run/react';
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { add_to_unlock_ } from "./utils/add_unlock";

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
            const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: JSON.stringify({ query: gql, variables: { id: gid } }),
            });

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
                productId: node.id.split('/').pop(),
                productTitle: node.title,
                handle: node.handle,
                price: node.variants?.edges?.[0]?.node?.price || '0',
                media: node.media?.edges?.[0]?.node?.preview?.image?.url || null,
            }));

            if (productData.length > 0) {
                await prisma.upsellTriggerProduct.createMany({
                    data: productData,
                });
            }
        }
    } catch (error) {
        console.error(`Error in trigger_coll for collection ${collectionIds}:`, error);
        throw error;
    }
};

const trigger_all = async (shop, upsell_allproducts, accessToken, campaignId) => {
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

            const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({ query: gql, variables: { cursor } }),
            });

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
        selectedCollections = JSON.parse(formData.get("selectedCollections") || "[]");
    } else if (selectedTriggerType === "all") {
        upsell_allproducts = formData.get("upsell_allproducts") === "true";
    }
    const offers = JSON.parse(formData.get("offers") || "[]");

    console.log(offers, "+++++++++=======  Offer ")
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
    const customiz = await prisma.customiz.create({
        data: {
            campaignId: upsellCampaign.id,
            barStyle: progressBarStyle.thickness || "thin",
            barRadius: progressBarStyle.cornerRadius || "square",
            barColors: {
                primaryColor: progressBarStyle.primaryColor || "#4CAF50",
                secondaryColor: progressBarStyle.secondaryColor || "#2196F3",
                goalCompleteColor: progressBarStyle.goalCompleteColor || "#FF9800",
                backgroundColor: progressBarStyle.backgroundColor || "#F5F5F5",
            },

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
    } else if (selectedTriggerType === "collections" && selectedCollections.length > 0) {
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

                // 👇 Ye line add karo
                badgeImageUrl: offer.badgeImageUrl || null,
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
        if (offer.productPickType === "products" && offer.buyProductPicker?.length > 0) {
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
        if (offer.productPickType === "collections" && offer.buyCollectionPicker?.length > 0) {
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
    const [placement, setPlacement] = useState([]);
    const [formattedGoalText, setFormattedGoalText] = useState("Spend $50 to unlock a free gift!");
    const [formattedPreGoalText, setFormattedPreGoalText] = useState("Add more to your cart to unlock rewards.");
    const [showConfetti, setShowConfetti] = useState(false);
    const [showBadges, setShowBadges] = useState(true);
    const urlParams = new URLSearchParams(window.location.search);

    // 'dealType' parameter ki value
    const dealType = urlParams.get('dealType');

    console.log(dealType);
    const rewardModeOptions = [
        dealType !== "flame" && { label: "Fixed Deal", value: "fixed" },
        dealType !== "fixed" && { label: "Flame Match (Customer picks)", value: "flame" },
    ].filter(Boolean);
    const handleToggle = () => {
        setShowBadges(!showBadges); // true ↔ false
    };
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
    const [activePreview, setActivePreview] = useState("home"); // New state for tracking preview placement
    const [isHomepageModalOpen, setIsHomepageModalOpen] = useState(false); // State for Homepage modal

    const filteredCollections = selectedCollections.filter(
        (c) => c.title?.toLowerCase().includes(collectionSearch.toLowerCase()) || c.handle?.toLowerCase().includes(collectionSearch.toLowerCase())
    );
    const filteredProducts = upsellselectedItems.filter(
        (p) => p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.handle?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const removeItem = (id, setItems, items) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const removeProduct = (id) => removeItem(id, setUpsellselectedItems, upsellselectedItems);
    const removeCollection = (id) => removeItem(id, setSelectedCollections, selectedCollections);

    const [offers, setOffers] = useState([
        {
            id: Date.now(),
            goalType: "amount_cart",
            goalAmount: "",
            goalquantity: "",
            currency: "USD",
            rewardMode: "fixed",
            rewardType: "discount",
            discountCode: "",
            discountType: "percentage",
            productPickType: "products",
            buyProductPicker: [],
            buyCollectionPicker: [],
            rewardProducts: [],
            rewardCollection: [],
            goalTextBefore: "👉🏻 Add {{amount_left}} to unlock {{reward}}!",
            goalTextAfter: "🎉 You’ve unlocked {{reward}}!",
        },
    ]);

    const currencyOptions = [
        { label: "US Dollar (USD)", value: "USD" },
        { label: "Moroccan Dirham (MAD)", value: "MAD" },
    ];

    const goalOptions = [
        { label: "Cart Value", value: "amount_cart" },
        { label: "Product Quantity", value: "quantity" },
    ];

    const addOffer = () => {
        setOffers((prev) => [
            ...prev,
            {
                id: Date.now(),
                goalType: "amount_cart",
                goalAmount: "",
                goalquantity: "",
                currency: "USD",
                rewardMode: "fixed",
                rewardType: "discount",
                discountCode: "",
                discountType: "percentage",
                productPickType: "products",
                buyProductPicker: [],
                buyCollectionPicker: [],
                rewardProducts: [],
                rewardCollection: [],
                goalTextBefore: "🛍 Add {{amount_left}} to unlock {{reward}}!",
                goalTextAfter: "🎉 You’ve unlocked {{reward}}!",
            },
        ]);
    };

    const removeOffer = (id) => {
        setOffers((prev) => prev.filter((offer) => offer.id !== id));
    };

    const updateOffer = (id, field, value) => {
        setOffers((prev) =>
            prev.map((offer) =>
                offer.id === id ? { ...offer, [field]: value } : offer
            )
        );
    };

    useEffect(() => {
        const updatedPreGoalTexts = offers.map((offer) => {
            console.log(offer)
            const rewardDescription =
                offer.rewardType === "discount"
                    ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"} Discount`
                    : offer.rewardType === "shipping"
                        ? "Free Shipping"
                        : "Free Gift";
            const amountLeft =
                offer.goalType === "amount_cart"
                    ? `${offer.currency}${parseFloat(offer.goalAmount) - 50 || 0}`
                    : offer.goalType === "quantity"
                        ? `${parseInt(offer.goalquantity) - 1 || 0} items`
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
    }, [offers]);

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
                    (newProduct) => !upsellselectedItems.some((existing) => existing.id === newProduct.id)
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
                    (newColl) => !selectedCollections.some((existing) => existing.id === newColl.id)
                );
                setSelectedCollections((prev) => [...prev, ...uniqueCollections]);
            }
        } catch (error) {
            console.error("Error in collection picker:", error);
            shopify.toast.show("Failed to select collections.", { isError: true });
        }
    };

    const rewardPicker = async (offerId) => {
        setOffers((prev) =>
            prev.map((offer) => {
                if (offer.id !== offerId) return offer;
                if (offer.rewardProducts.length >= 4) {
                    shopify.toast.show("You can only select up to 4 reward products.", { isError: true });
                    return offer;
                }
                return offer;
            })
        );

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

                setOffers((prev) =>
                    prev.map((offer) =>
                        offer.id === offerId
                            ? {
                                ...offer,
                                rewardProducts: [
                                    ...offer.rewardProducts,
                                    ...products.filter(
                                        (p) => !offer.rewardProducts.some((pr) => pr.id === p.id)
                                    ),
                                ].slice(0, 4),
                            }
                            : offer
                    )
                );
            }
        } catch (error) {
            console.error("Error in reward picker:", error);
            shopify.toast.show("Failed to select reward products.", { isError: true });
        }
    };

    const removeRewardProduct = (offerId, id) => {
        setOffers((prev) =>
            prev.map((offer) =>
                offer.id === offerId
                    ? {
                        ...offer,
                        rewardProducts: offer.rewardProducts.filter((item) => item.id !== id),
                    }
                    : offer
            )
        );
    };

    const handleswitchChange = (field, value) => {
        setStatus((prev) => ({ ...prev, [field]: value }));
    };

    const handleBadgeIconChange = (offerId, event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                updateOffer(offerId, "badgeIcon", file);
            } else {
                shopify.toast.show("Please upload an image file.", { isError: true });
            }
        }
    };

    const ProgressBar = ({ progress, style }) => {
        return (
            <Box padding="200">
                <div
                    style={{
                        height: style.thickness === "thin" ? "10px" : "20px",
                        borderRadius:
                            style.cornerRadius === "square"
                                ? "0"
                                : style.cornerRadius === "slightly"
                                    ? "4px"
                                    : "20px",
                        backgroundColor: style.backgroundColor,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${Math.min(progress, 100)}%`,
                            height: "100%",
                            backgroundColor: progress >= 100 ? style.goalCompleteColor : style.primaryColor,
                            transition: "width 0.3s ease-in-out",
                        }}
                    />
                    <div className="offer-icons">
                        <img src="" alt="icon " />
                        <span>20</span>
                    </div>


                </div>
            </Box >
        );
    };

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const campaignNames = searchParams.get("name") || "";

    const handleSubmit = () => {
        console.log( "this propes >><<<<", offers)
        console.log(badgeIcon, "this ")
        if (!campaignNames) {
            shopify.toast.show("Campaign name is required.", { isError: true });
            return;
        }

        for (const [index, offer] of offers.entries()) {
            if (offer.goalType === "amount_cart" && (!offer.goalAmount || isNaN(offer.goalAmount) || parseFloat(offer.goalAmount) <= 0)) {
                shopify.toast.show(`Offer ${index + 1}: Valid goal amount is required.`, { isError: true });
                return;
            }
            if (offer.goalType === "quantity" && (!offer.goalquantity || isNaN(offer.goalquantity) || parseInt(offer.goalquantity) <= 0)) {
                shopify.toast.show(`Offer ${index + 1}: Valid goal quantity is required.`, { isError: true });
                return;
            }

            if (offer.rewardType === "discount") {
                if (!offer.discountCode || isNaN(offer.discountCode) || parseFloat(offer.discountCode) <= 0) {
                    shopify.toast.show(`Offer ${index + 1}: Valid discount value is required.`, { isError: true });
                    return;
                }
                if (
                    offer.discountType === "percentage" &&
                    (parseFloat(offer.discountCode) <= 0 || parseFloat(offer.discountCode) > 100)
                ) {
                    shopify.toast.show(
                        `Offer ${index + 1}: Discount percentage must be between 1 and 100.`,
                        { isError: true }
                    );
                    return;
                }
            }

            if (offer.rewardType === "gift" && offer.rewardMode === "fixed" && offer.rewardProducts.length === 0) {
                shopify.toast.show(`Offer ${index + 1}: At least one reward product is required for Fixed Deal.`, {
                    isError: true,
                });
                return;
            }
            if (
                offer.rewardType === "gift" &&
                offer.rewardMode === "flame" &&
                offer.rewardProducts.length === 0 &&
                offer.rewardCollection.length === 0
            ) {
                shopify.toast.show(
                    `Offer ${index + 1}: At least one reward product or collection is required for Flame Match.`,
                    { isError: true }
                );
                return;
            }

            // if (
            //     offer.rewardType === "gift" &&
            //     offer.productPickType === "products" &&
            //     offer.buyProductPicker.length === 0
            // ) {
            //     shopify.toast.show(`Offer ${index + 1}: At least one product is required for Buy X configuration.`, {
            //         isError: true,
            //     });
            //     return;
            // }
            if (
                offer.rewardType === "gift" &&
                offer.productPickType === "collections" &&
                offer.buyCollectionPicker.length === 0
            ) {
                shopify.toast.show(
                    `Offer ${index + 1}: At least one collection is required for Buy X configuration.`,
                    { isError: true }
                );
                return;
            }
        }

        if (
            selectedTriggerType === "products" &&
            upsellselectedItems.length === 0 &&
            !upsell_allproduct
        ) {
            shopify.toast.show("At least one product is required when selecting specific products.", {
                isError: true,
            });
            return;
        }
        if (selectedTriggerType === "collections" && selectedCollections.length === 0) {
            shopify.toast.show("At least one collection is required when selecting specific collections.", {
                isError: true,
            });
            return;
        }
        if (!placement || placement.length === 0) {
            shopify.toast.show(
                "At least one placement is required when selecting placement.",
                { isError: true }
            );
            return;
        }
        console.log(placement, "THis placement")

        //        setMainBtnLoading(true);

        const formData = new FormData();
        formData.append("campaignName", campaignNames);
        formData.append("selectedCampaignType", "add_to_unlock");
        formData.append("selectedTriggerType", selectedTriggerType);
        formData.append("status", JSON.stringify(status));

        if (selectedTriggerType === "products") {
            formData.append("selectedProducts", JSON.stringify(upsellselectedItems));
        } else if (selectedTriggerType === "collections") {
            formData.append("selectedCollections", JSON.stringify(selectedCollections));
        } else if (selectedTriggerType === "all") {
            formData.append("upsell_allproducts", "true");
        }

        formData.append("offers", JSON.stringify(offers));
        formData.append("showConfetti", showConfetti ? "on" : "off");
        formData.append("showLockedGoals", showLockedGoals ? "on" : "off");
        formData.append("showBadgeIcons", showBadgeIcons ? "on" : "off");
        
        formData.append("progressBarStyle", JSON.stringify(progressBarStyle));
        formData.append("placement", JSON.stringify(placement));

        fetcher.submit(formData, {
            method: "POST",
            encType: "multipart/form-data",
        });
        setMainBtnLoading(false)
    };

    const preview_products = [
        {
            id: 1,
            title: "The Collection Snowboard: Liquid",
            price: "749.95",
            image: save, // ✅ corrected typo: "imag" → "image"
        },
        {
            id: 2,
            title: "Summer T-Shirt Bundle",
            price: "49.99",
            image: save2, // You can replace with another image variable
        },
    ];

    const renderPreview = () => {
        const sortedOffers = offers.sort((a, b) =>
            a.goalType === "quantity" ? parseInt(a.goalquantity) - parseInt(b.goalquantity) : parseFloat(a.goalAmount) - parseFloat(b.goalAmount)
        );
        const maxGoal = sortedOffers[sortedOffers.length - 1];
        const progressPercentage =
            maxGoal?.goalType === "quantity"
                ? (currentProgress / (parseInt(maxGoal?.goalquantity) || 1)) * 100
                : (currentProgress / (parseFloat(maxGoal?.goalAmount) || 1)) * 100;

        const maxGoalValue =
            maxGoal?.goalType === "quantity"
                ? parseInt(maxGoal?.goalquantity) || 1
                : parseFloat(maxGoal?.goalAmount) || 1;
        let icons = {
            gift: gift,
            shipping: free,
            discount: discou
        };

        let selectedIcon = "";  // Default value
        offers.forEach((type) => {
            if (icons[type.rewardType]) {
                selectedIcon = icons[type.rewardType];
            }
        });
        const offerProgress = sortedOffers.map((offer) => {
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
                icon: icons[offer.rewardType] || "",
            };
        });


        const renderGoalText = (offer) => {
            const isGoalReached = offer.goalType === "quantity" ? currentProgress >= parseInt(offer.goalquantity) : currentProgress >= parseFloat(offer.goalAmount);
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
                offer.goalType === "quantity" ? `${offer.goalquantity || 0} items` : `${offer.currency}${offer.goalAmount || 0}`;

            return isGoalReached
                ? offer.goalTextAfter.replace("{{reward}}", rewardDescription).replace("{{goal}}", goal)
                : offer.goalTextBefore.replace("{{amount_left}}", amountLeft).replace("{{reward}}", rewardDescription).replace("{{goal}}", goal);
        };
        let formattedPreGoalText = "No offers available";
        if (sortedOffers.length > 0) {
            let activeOffer = null;
            for (const offer of sortedOffers) {
                const goalValue =
                    offer.goalType === "quantity"
                        ? parseInt(offer.goalquantity) || 1
                        : parseFloat(offer.goalAmount) || 1;
                if (currentProgress < goalValue) {
                    activeOffer = offer; // First uncompleted offer
                    break;
                }
                activeOffer = offer; // Keep track of the last completed offer
            }
            if (activeOffer) {
                formattedPreGoalText = renderGoalText(activeOffer);
            }
        }
        const renderRewardContent = (offer) => {
            if (offer.rewardType === "gift" && offer.rewardMode === "fixed" && offer.rewardProducts.length > 0) {
                return (
                    <BlockStack gap="200">
                        <Text fontWeight="semibold">Reward Product:</Text>
                        {offer.rewardProducts.map((product) => (
                            <InlineStack key={product.id} align="space-between">
                                <Text>{product.title}</Text>
                                {product.media && <Image source={product.media} alt={product.title} width="50px" />}
                            </InlineStack>
                        ))}
                    </BlockStack>
                );
            } else if (offer.rewardType === "gift" && offer.rewardMode === "flame") {
                return (
                    <BlockStack gap="200">
                        <Text fontWeight="semibold">Choose a Free Gift:</Text>
                        {offer.rewardProducts.length > 0 && (
                            <BlockStack gap="100">
                                {offer.rewardProducts.map((product) => (
                                    <InlineStack key={product.id} align="space-between">
                                        <Text>{product.title}</Text>
                                        {product.media && <Image source={product.media} alt={product.title} width="50px" />}
                                    </InlineStack>
                                ))}
                            </BlockStack>
                        )}
                        {offer.rewardCollection.length > 0 && (
                            <BlockStack gap="100">
                                {offer.rewardCollection.map((collection) => (
                                    <Text key={collection.id}>{collection.title}</Text>
                                ))}
                            </BlockStack>
                        )}
                    </BlockStack>
                );
            } else if (offer.rewardType === "discount") {
                return <Text>{`${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"} Discount`}</Text>;
            } else if (offer.rewardType === "shipping") {
                return <Text>Free Shipping</Text>;
            }
            return null;
        };

        const renderTriggerContent = () => {
            if (selectedTriggerType === "all") {
                return <Text>All Products</Text>;
            } else if (selectedTriggerType === "products" && filteredProducts.length > 0) {
                return (
                    <BlockStack gap="100">
                        {filteredProducts.map((product) => (
                            <InlineStack key={product.id} align="space-between">
                                <Text>{product.title}</Text>
                                {product.media && <Image source={product.media} alt={product.title} width="50px" />}
                            </InlineStack>
                        ))}
                    </BlockStack>
                );
            } else if (selectedTriggerType === "collections" && filteredCollections.length > 0) {
                return (
                    <BlockStack gap="100">
                        {filteredCollections.map((collection) => (
                            <Text key={collection.id}>{collection.title}</Text>
                        ))}
                    </BlockStack>
                );
            }
            return <Text>No trigger products/collections selected</Text>;
        };

        if (activePreview === "home") {
            return (
                <div className="home-preview">
                    <h2>Homepage Upsell Preview</h2>
                    <div className="home-preview-container">
                        {/* Header Section */}
                        <div className="features">
                            <Text as="h1" variant="headingLg" className="h1-had">
                                Bundle Deals
                            </Text>
                            <button style={{ float: "right" }}>✖</button>
                        </div>

                        {/* Offers Count */}
                        <div className="offers-length">
                            <div className="under-offer">
                                <Thumbnail size="extraSmall" source={home_icon} alt="icon" />
                                <p>Get More {offers.length} Offers</p>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="product-details">
                            {preview_products.map((product) => (
                                <div key={product.id} className="product-card">
                                    <Image source={product.image} alt={product.title} width="150px" />
                                    <Text as="p" variant="bodyMd" fontWeight="medium">
                                        {product.title}
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        ${product.price}
                                    </Text>

                                    {/* ✅ Offer Line */}
                                    {offers.map((offer) => (
                                        <div key={offer.id} className="offer-line">
                                            <span>{renderGoalText(offer)}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        } else if (activePreview === "Page") {
            return (
                <Card title="Product Page Preview">
                    <div style={{
                        maxWidth: "900px",
                        margin: "20px auto",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
                    }}>
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
                                            : upsellselectedItems || [];
                                    const buttonLabel =
                                        offer.rewardType === "shipping"
                                            ? "FREE SHIPPING"
                                            : offer.rewardType === "discount"
                                                ? `APPLY DISCOUNT`
                                                : "REDEEM FREE GIFT";

                                    return (
                                        <div key={offer.id} className="offer-card">
                                            <div className="main-title">{

                                                <div className="offer-line">
                                                    <span>{renderGoalText(offer)}</span>
                                                </div>

                                            }</div>
                                            <div
                                                className="progress-container"

                                            >

                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        height:
                                                            progressBarStyle.thickness === "thin" ? "10px" : "15px",
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
                                                            width: `${progressPercentage}%`,
                                                            background:
                                                                progressPercentage >= 100
                                                                    ? progressBarStyle.goalCompleteColor
                                                                    : offer.percentage >= 40
                                                                        ? progressBarStyle.secondaryColor || progressBarStyle.primaryColor
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
                                                                    src={product.media || "https://via.placeholder.com/150"}
                                                                    alt={product.title || "Product"}
                                                                    className="product-image"
                                                                />
                                                            </div>
                                                            <div className="product-title">{product.title || "No Title"}</div>
                                                            <div className="product-price">${product.price || "0.00"}</div>
                                                            <button
                                                                className="add-btn"
                                                                disabled={offer.rewardType === "gift" && !offer.isGoalReached}
                                                            >
                                                                {offer.rewardType === "gift" ? "ADD FREE GIFT" : "ADD"}
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
                                                <button className="action-btn" disabled={!offer.isGoalReached}>
                                                    {buttonLabel}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {showConfetti && offerProgress.some((offer) => offer.isGoalReached) && (
                                    <div className="confetti-text">🎉 Confetti Animation Triggered!</div>
                                )}
                                {showLockedGoals && sortedOffers.length > 1 && (
                                    <div className="locked-goals">Locked Goals: Additional rewards to unlock...</div>
                                )}
                                {showBadgeIcons && badgeIcon && (
                                    <img
                                        src={URL.createObjectURL(badgeIcon)}
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
                                background: #f0f0f0;
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
              ${status.showConfetti === true
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
                                                <div class="dsicount-title">${formattedPreGoalText}</div>
                                                <div class="un-fill" 
                                                    style="
                                                        background: ${progressBarStyle.backgroundColor};
                                                        border-radius: 15px;
                                                        height: ${barSize ? "7px" : "12px"};;
                                                    ">
<div
  class="fill"
  style="
    width: ${progressPercentage}%;
    background: #5A75F8;
    border-radius: 15px;
    height: ${barSize ? "70%" : "100%"};
    transition: width 0.3s ease-in-out, height 0.3s ease-in-out;
  "
></div>

${showBadges
                                        ? offerProgress
                                            .map(
                                                (offer) => `
          <div class="progress_step" style="left: ${Math.min(offer.percentage, 100)}%;">
              
              <div 
                class="circle" 
                style="
                  background: ${offer.isGoalReached
                                                        ? progressBarStyle.goalCompleteColor
                                                        : "#ddd"
                                                    };
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

                                background-color: #5C6AC4;
                "
              >
                  <!-- Text inside circle, above image -->
                  <div>
                    ${offer.isGoalReached
                                                        ? offer.rewardType === "discount"
                                                            ? "10% Off"
                                                            : offer.rewardType === "shipping"
                                                                ? "Free"
                                                                : offer.rewardType === "gift"
                                                                    ? "Gift"
                                                                    : ""
                                                        : ""
                                                    }
                  </div>

                  <img 
                    src="${offer.icon}" 
                    width="25px" 
                    alt="${offer.rewardType} Icon" 
                  />
              </div>

              <div class="step_goal" style="margin-top: 6px;">
                ${offer.goalType === "quantity"
                                                        ? offer.goalquantity
                                                        : `${offer.currency}${offer.goalAmount}`
                                                    }
              </div>
          </div>
        `
                                            )
                                            .join("")
                                        : ""}


                                        
                                                </div>
                                               
                                            </div>
                                        </div>
                                        <div class="cart-content">
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
                                                    <div class="gift-section">
                <div class="gift-section-title">🎁 Gift Items</div>
                <div class="gift-items-container">
                    <!-- Gift Item 1 -->
                    <div class="gift-item">
                        <div class="gift-item-image">
                            <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw0PDQ8NDQ8PDw0PDQ8PDw0ODw8PDQ0PFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLi0BCgoKDg0OGhAQGi0lGCIrKy0tLSstLS01LS0rLS0tLS8tMC0tLSstLS0tLS0tLS0rLS0vLS0tKystListLS0tK//AABEIARMAtwMBIgACEQEDEQH/xAAcAAEBAAIDAQEAAAAAAAAAAAAAAQUGAwQHAgj/xAA/EAACAgECAwUFBQUGBwEAAAAAAQIDEQQhBRJRBhMxQZEHFCJhoTJCUnGBI2KSscFTcsLR4fAzY3OCoqPDJP/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAgEQEBAQEAAQQDAQAAAAAAAAAAARECMQMhMkEEElET/9oADAMBAAIRAxEAPwDfAAcWgAACFAAgKABCgAAAAAEBSAUAACAAUAAQpCgAAAAAAEAFIUAAAAIUAACAUEKAIUAQpABSFAEKAAAAAAAAAAAIBQCAUAAQpCgCFIBQAAAAEBQABCgAAABCgCAoEKQoAEKBx32xhCVkniMIynJ9EllnkPA+1nFNbfZOWrspr8Ywqr07jDPhH4oPOx6rxqDlpNTFOKb09q5p55FmD3ePI/P2n4bY0pxsUMzwt5Rz88ryL+3PPyXnjrv4x7LwXjepfJC39s5TUVPljW3Hze22V9fkbSadwyidF+h0Mq7I6mpOy+coxspnTKqfLKFkNt2sfFiXw+GDcDfqSS+zHO/agA5tBCgAQpABSAAUAAAAAAAAgAoIUAfNk4xi5SajGKbcpNKMUvFt+SPo0X2izu1N+h4Np58j1ty72Xiu7XVeaWHLHnypFk1GK7ZduadRGej0lkVS3y26iUuXvV5xrz935+f1NS7+t4ULKnyrZKcP8z2/s/7P+D6SKUaK9RcvtXalRutbzjKUto79EjM6vsxw26PJdotJOPR6epNfk0soz6n4/wC93Xb0vyv85kjSOGdqtFqNfUoWPvdRpI0tTSWJ1SlOEVvvlWWfwrqbWaH2z9k6ri9XwZzhZU+89zcnJtxeVKib3Ul4qLznya8HsnZTidmq0NF1ySulVB2Y2UpY+0l5b5TXk015HS82eXK9S32ZghQYAAACAoAgAFAAAAAAQoAhSAUAADSuHL3ntfHzWi0Vk18pOKr/APqbqab7L5RnxHjfEbGlXGcKu8fhGMeeU/RRgb48s9eHpc+H1SWPij8PL8L35fHG/wA9yrTTT+GWVhJxzKGceeVnd+b+XzNIo7V6nU6nnrp1c6YTxXotJBKU2vCeqvliMP8Apxe3hLobvoLb5w5r6VRJ+Ffeq2SXzaSS/Rs66489S+H3TG74VJqW+JS2xjfeKW+dorf8T6GsaaMFdqe7SUI3SikvD4pSub/V3tm2W2ckJTfhCEpfok2alwxPu234yssy/wASU3CL/hjEz38XTny7YAOLoAhQBCgAAAIUhQAAAAAAAQCgEA6/Er+7091j+5VOXpFmt+yjhMreB6iak42azU6iyDfMoqUeWEeblw3Hmg8rPU7ftA1XdcK1Us4cq+Rf9zwZfsa1oeCcPjKq2S91hZZ3UOZwc8Tk5L87Pozrwx203RcE1Nt0qLKYT1UE5T0Oq1GqosdaaXNRbCShZDwWcLG2x6H2V4TVRXlaOzSWvaUZ6h6lP+7Lnf1SOxVxjRWzrjJ4tU492rIPmhOcXjlktt1zLZ9UZGjV02Y7uyueUmuWcZZTWU9vkakceeJLrr8dvVWkunL7KilL+65JS+jZgdDU4U1Ql9qNUIyfWSik36mQ7ZS//PCrGe9uhXJf8uf7OT/9kTrMz6niO3KFAOTYAQCkKAABABSFAAAAAABAUAAANG9rMnLSafSxfx6nV11r9Xj+bR6lDSJQhCMnFVxUY4UWsJJea+Xlg8w7TQ7/AI/wbS+MYXPUSXTu05/4D1Vw5o4zJb5zF4Z258OfXlx9xYt1KMnhrL5k/wCqXoY2XBKvOhRxl5rkpLLSi/heF4Jfd8vmZXu5r7Nnl4Tipb9crByVc+/Py/Jxz/JmmWu8fSV+j08fs1Q5sNtvk5ZJNt+OJV1g4tdPn4ja/wCxpjBfNWcv8pVSOU5+p5b58BCg5toUEApCkAoAAAhQAAAAAAAAIUADWeLcH1y4lVxPQz0/eVUWVd3qYzcHzJJ45WvLzyd1dqOLV7arhKtgt+fR6rMs/KDWf/IzINTqxm8ysVH2kaCKxqYa/RNbPv8ATOS8esebK+Zm+H9sOFXYjXr9LKb+7KyNU/4ZtM1jiHazRw1MdDGcbNRJ4kvtVVP8Mn4c37vrg1S+iyjieOLKm3RXRm9Oq6K41Sw1j4YrmUkvLLzk6zbNxiybjfuG297LUajxVmpsUHuvgjJ7b9JOa/Q7xxaaNariqlFVcq5FDChy+WMHKcurt10kyBCgyoCFAEKQAUACFAAAAAAAIUAAQFA+ZzUU5SaUUm3JvCil4tvyPKO3HtCna5aXh8nCneNmqWY2W9VX+GP73i/LC8d+7Y8Ls1eispqnKEscyinhWtbquX7r/wAjyDg3Z2/W393FdzXCfJbfYsck/wCzivOez2/V4898yM2uhwHhmp1GohTpKpW3/aUY/DGpL79k/uRX5/XZ+4dj+ymgjB6ziM4cQ1eY51V0XPTRaeVDTqSw1F+aSy98LYx3BuG06OC01FeYSaxp4P49S1n9tqbceGzXLsk0sYTy9o4e5zsWX3lsGlK6VeNLp8Ri1XRF45vHaW+ze/hnrHNneIaVW1q2tPmUfBxcXKPTHUwZseljyx5eacnnLlN5bf8AT8kY3imk5X3kV8Lfxfuvr+pz65+3SVjyFBzaAAAAAEAAFAAAAACFAAEAFBCgDUe0EI6G73rONJqZqrVQWU4TcWo6iOPBpJqXVY81vtxwa3SV31TptjzVzi4yX9V8yy4ljExlzLklLfaUuSWI2Qzs/PMWsJ/6IzXDdSsKLwlFKOPCMF0XqaDoZW6G9cNul9luehuecWV4eaWk1nCbws42x5I6/aTtr3ce74fy9+1yyvm4yr07aw1Bbqclus+C6S8usrnY9D45210XD5VVXTctRbKEY0QXNYlJ4U5pZ5Y7/m8bJmF7Q2arVazS3aLUSbpco30vPucYvxXjh2JrGFlpPfGEnqnZHsROU/fNdKydspc/7WU+8lJ/fm882flnO3l5+j0UxhFQglGMUkopJJJeCSWyXyRL37Y1OX2UhTk2EBQBCgCFBAKCFAAEAoAAAEAFBAKdWPEdO5Sgra3OMnGUFOLnGS8U4+J2jxD2i6GUdfY5cjV2b4b/AHJPG+Vs8xZYj0btzwunXaOa5nXbQpXVXWQnGuDUfiUpNYUWvPywn5GG7C9lNFRKN992ms1Da7mPfVyVLf4Unjm6Pd9MHlPc2Ywk8dFOOH9TmopvbSjz+KxiePTc6TlNfpNw5dtlj8kfMZJ+DT8tmnv0PCdTVr+7l+1v7tJc3PfywWdvizLB612J4bbpeHU0XRUbEpScYyUklJ5W628GZ65wl1nQCGGlAAEBSAUAAAQoAH13bL3Mv9suVHwDk7iXy9S+7T+XqMo4Qc/us+i9UPdJ9F6oZRwg5/dJ9F6oe6WdF6oZRwHiHa2nXajVX3dxfbXGyVFc6qpShCFUniK5V89/me7e6WdF6ml8IeFZ4b6viHXP/E8sbepZP6bjxW/h98X8dNib33rs+uxzcLrtrvrn3U5KM4uVb72EJr8MnHfB7zQ7VbNxlxDayUuVJSqa52/hTxmPwYS6TXUymjssi4ty4jYouvMZUQinvGO+MN5zl46Py2OmM68i4kqr4xqo4XGDcoynLR6HUXXzw84V03mCbW7Sb/TJ6jwG7VWaaE9Vp56af2Y1WZ7zu4pKMnlLf9DdtFZz1xnyzhzLPJYuWcfk15HQ4zRKVkeX8H9WZ6jUrEEOz7lZ0Xqh7lZ0XqjGUdYHZ9ys6L1Q9ys6L1Qyjrg7HuVnReqHuVnReqGUdcHP7nZ0Xqh7nZ0XqMo4Ac3ulnT6lGUcasPtWHGq2XupHZHPG1HJGxHT7uXQ+WpdCDJRmjkjJGI7yS6k97kvJk0ZpH1gwi4o14p+h9x4xH5+g0xmUjzrhXhYs+Or4i8fHvi5ry+H1/TzNyhxiGd8+h5nw3tNpaLLaNS7KrIanWZbhZKP7S1yW0c/LxX5AsbhptFFzlLnug3OSfdWS5ZZsc848M5+m2cLBmtFw9KMUrtXiOMc1vM3hR8XjL+z/vY1bQ9pOG82feqFmUn8XNB7tbvmS6Izun7UcMW3vml891Ym/oaYbTpZOMIwy5cqUeaX22ksZePM+dQ8yT/d/qzAT7YcMgttSpvpXXbPP0MpoNfHU1q6EZxg8qPOkpSXXC8P9AsdgApF1AUBNQYKAamCcp9AYa+eUH0BhrqKs+lWfeCmlcfdjuUchQOHuF0I9LHoc4IOs9DB+Rwz4TUzIAYMHf2crl4WWR/Jmn8a9lUdRY7o62yFj8XKuMs/nuj0xny0MhrySPsn1i8OIUy/vaaaf0mdmr2W6r72sp/ONNj/AMSPU0ipFRpHCPZzTVKMrr5W4eeWMFXF/nlyZu9VajFRikoxSSS2SXQ+ikAAAAAAAAAAAAAB8MgIVVBABQABQCpATBcFADABQAAIgAAAAAAAAAAAAA4cghSqIpCgUEKBSnyUD6BCgCkAFABEAAAAAAAAAAAAAMddFAKoUgA+igAAABSgAUAAUAAAARAAAAAABQFWKIARX//Z" alt="Gift Product" />
                        </div>
                        <div class="gift-item-details">
                            <div class="gift-item-title">Premium Socks <span class="gift-badge">FREE</span></div>
                            <div class="gift-item-actions">
                                <button class="add-to-cart-btn" data-product="premium-socks">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                                        <div class="cart-footer">
                                            <div class="cart-subtotal">
                                                <span>Subtotal</span>
                                                <span>$29.99</span>
                                            </div>
                                            <div class="cart-buttons">
                                                <button class="checkout">Checkout . $29.99</button>
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
            <FormLayout>
                <Layout>
                    <Layout.Section>
                        <BlockStack gap="400">
                            {/* <Card>
                                <BlockStack gap="200">
                                    <TextField
                                        label="Campaign Name"
                                        value={campaignName}
                                        onChange={setCampaignName}
                                        requiredIndicator
                                        error={!campaignName ? "Campaign name is required" : ""}
                                    />
                                    <Divider />
                                </BlockStack>
                            </Card> */}
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd" fontWeight="bold">
                                        Selected Products Upsell
                                    </Text>
                                    <Text as="p">Choose which products will trigger the upsell offer.</Text>
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
                                                    <Button onClick={productpicker} size="medium" accessibilityLabel="Browse products for upsell">Browse Products</Button>
                                                </InlineStack>
                                                {filteredProducts.length > 0 ? (
                                                    <ResourceList
                                                        resourceName={{ singular: "product", plural: "products" }}
                                                        items={filteredProducts}
                                                        renderItem={(item) => {
                                                            const { id, title, handle, price, media } = item;
                                                            return (
                                                                <ResourceItem id={id}>
                                                                    <InlineStack align="space-between" gap="300">
                                                                        <InlineStack gap="300" align="center">
                                                                            {media && <Image source={media} alt={title} width="60px" />}
                                                                            <BlockStack>
                                                                                <Text fontWeight="bold">{title}</Text>
                                                                                <Text>Price: ${price}</Text>
                                                                                <Text>Handle: {handle}</Text>
                                                                            </BlockStack>
                                                                        </InlineStack>
                                                                        <Button tone="critical" onClick={() => removeProduct(id)} size="medium">
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
                                                    <Button onClick={collectionPicker} size="medium" accessibilityLabel="Browse collections for upsell">Browse Collections</Button>
                                                </InlineStack>
                                                {filteredCollections.length > 0 ? (
                                                    <ResourceList
                                                        resourceName={{ singular: "collection", plural: "collections" }}
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
                                                                        <Button tone="critical" onClick={() => removeCollection(id)} size="medium">
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
                                                        onChange={(e) => handleswitchChange("active", e.target.checked)}
                                                        className="switch-input"
                                                    />
                                                    <span className="switch-slider"></span>
                                                </label>
                                                <Text as="h4" variant="headingMd">Enable</Text>
                                            </InlineStack>
                                            <InlineStack align="space-between">
                                                <label className="switch-container">
                                                    <input
                                                        type="checkbox"
                                                        checked={status.showConfetti}
                                                        onChange={(e) => handleswitchChange("showConfetti", e.target.checked)}
                                                        className="switch-input"
                                                    />
                                                    <span className="switch-slider"></span>
                                                </label>
                                                <Text as="h4" variant="headingMd">Show showConfetti</Text>
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

                            <BlockStack gap="400">
                                <InlineStack align="space-between">
                                    <Text variant="headingMd" as="h2">
                                        Offers
                                    </Text>
                                    <Button
                                        icon={PlusIcon}
                                        onClick={addOffer}
                                        variant="primary"
                                        accessibilityLabel="Add new offer"
                                    >
                                        Add Offer
                                    </Button>
                                </InlineStack>

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
                                                            <InlineStack gap="200" blockAlign="center" wrap={false}>
                                                                {goalOptions.map((type) => (
                                                                    <Button
                                                                        key={type.value}
                                                                        pressed={offer.goalType === type.value}
                                                                        onClick={() => updateOffer(offer.id, "goalType", type.value)}
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
                                                                onChange={(value) => updateOffer(offer.id, "currency", value)}
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
                                                                error={!offer.goalAmount ? "Cart total goal is required" : ""}
                                                            />
                                                        </BlockStack>
                                                    )}
                                                    {offer.goalType === "quantity" && (
                                                        <TextField
                                                            label="Product Quantity Goal"
                                                            type="number"
                                                            value={offer.goalquantity}
                                                            onChange={(value) => {

                                                                updateOffer(offer.id, "goalquantity", value);
                                                            }}
                                                            requiredIndicator
                                                            helpText="How many products need to be added to the cart to unlock the reward"
                                                            error={!offer.goalquantity ? "Quantity goal is required" : ""}
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
                                                            choices={rewardModeOptions}
                                                            selected={[offer.rewardMode]}
                                                            onChange={(value) => {
                                                                const mode = value[0];
                                                                updateOffer(offer.id, "rewardMode", mode);
                                                                updateOffer(offer.id, "rewardType", mode === "flame" ? "gift" : "discount");

                                                                // Auto-generate reward type name
                                                                const rewardName = mode === "flame" ? "Flame Match Gift" : "Fixed Discount";
                                                                updateOffer(offer.id, "rewardTypeName", rewardName);
                                                            }}
                                                        />

                                                    </Box>


                                                    {offer.rewardMode === "fixed" && dealType !== "flame" && (
                                                        <BlockStack gap="200">
                                                            <ChoiceList
                                                                title="Reward Type"
                                                                choices={[
                                                                    { label: "Discount", value: "discount" },
                                                                    { label: "Free Shipping", value: "shipping" },
                                                                ]}
                                                                selected={[offer.rewardType]}
                                                                onChange={(value) => {
                                                                    const rewardType = value[0];
                                                                    updateOffer(offer.id, "rewardType", rewardType);
                                                                    const rewardName = rewardType === "discount" ? "Fixed Discount" : "Free Shipping";
                                                                    updateOffer(offer.id, "rewardTypeName", rewardName);
                                                                }}
                                                            />
                                                        </BlockStack>
                                                    )}

                                                    {offer.rewardMode === "flame" && (
                                                        <Box padding="200" background="bg-surface-secondary" border="divider" borderRadius="200">
                                                            <Text as="p" variant="bodyMd" fontWeight="medium">
                                                                Flame Match Reward: {offer.rewardTypeName || "Customer Choice Gift"}
                                                            </Text>
                                                            <Text as="p" variant="bodySm" tone="subdued">
                                                                Customers can choose their preferred reward from available options
                                                            </Text>
                                                        </Box>
                                                    )}
                                                </BlockStack>
                                            </Card>

                                            <Card sectioned>
                                                <BlockStack gap="300">
                                                    <Text variant="headingMd" as="h3">
                                                        Reward Setup
                                                    </Text>
                                                    {offer.rewardType === "discount" && (
                                                        <BlockStack gap="300">
                                                            <TextField
                                                                label="Discount Value"
                                                                placeholder="10, 20, etc."
                                                                value={offer.discountCode}
                                                                onChange={(value) => updateOffer(offer.id, "discountCode", value)}
                                                                type="number"
                                                                error={!offer.discountCode ? "Discount value is required" : ""}
                                                            />
                                                            <Select
                                                                label="Discount Type"
                                                                options={[
                                                                    { label: "Percentage (%)", value: "percentage" },
                                                                    { label: "Fixed Amount ($)", value: "amount" },
                                                                ]}
                                                                value={offer.discountType}
                                                                onChange={(value) => updateOffer(offer.id, "discountType", value)}
                                                            />
                                                            {/* <Box paddingBlockStart="200">
                                                                <Button
                                                                    onClick={() => rewardPicker(offer.id)}
                                                                    variant="primary"
                                                                    size="medium"
                                                                >
                                                                    Select Eligible Products
                                                                </Button>
                                                                {offer.rewardProducts.length > 0 && (
                                                                    <Box paddingBlockStart="200">
                                                                        <Text fontWeight="semibold">Selected Products:</Text>
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
                                                                                        onClick={() => removeRewardProduct(offer.id, item.id)}
                                                                                    >
                                                                                        Remove
                                                                                    </Button>
                                                                                </InlineStack>
                                                                            ))}
                                                                        </BlockStack>
                                                                    </Box>
                                                                )}
                                                            </Box> */}
                                                        </BlockStack>
                                                    )}
                                                    {offer.rewardType === "shipping" && (
                                                        <BlockStack gap="300">
                                                            <Banner tone="success">
                                                                Free shipping will be automatically applied Selected Tigger Products                                                            </Banner>
                                                            {/* <Button
                                                                onClick={() => rewardPicker(offer.id)}
                                                                variant="primary"
                                                                size="medium"
                                                            >
                                                                Select Eligible Products
                                                            </Button>
                                                            {offer.rewardProducts.length > 0 && (
                                                                <Box paddingBlockStart="200">
                                                                    <Text fontWeight="semibold">Selected Products:</Text>
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
                                                                                    onClick={() => removeRewardProduct(offer.id, item.id)}
                                                                                >
                                                                                    Remove
                                                                                </Button>
                                                                            </InlineStack>
                                                                        ))}
                                                                    </BlockStack>
                                                                </Box>
                                                            )} */}
                                                        </BlockStack>
                                                    )}
                                                    {offer.rewardType === "gift" && (
                                                        <BlockStack gap="300">
                                                            <Button
                                                                onClick={() => rewardPicker(offer.id)}
                                                                variant="primary"
                                                                size="medium"
                                                            >
                                                                Select Free Products
                                                            </Button>
                                                            {offer.rewardProducts.length > 0 && (
                                                                <Box paddingBlockStart="200">
                                                                    <Text fontWeight="semibold">Selected Free Products:</Text>
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
                                                                                    onClick={() => removeRewardProduct(offer.id, item.id)}
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
                                                        onChange={(value) => updateOffer(offer.id, "goalTextBefore", value)}
                                                        helpText="Use smart variables: {{goal}}, {{amount_left}}, {{reward}}"
                                                    />
                                                    <TextField
                                                        label="After Goal is Reached"
                                                        value={offer.goalTextAfter}
                                                        onChange={(value) => updateOffer(offer.id, "goalTextAfter", value)}
                                                        helpText="Use smart variables: {{goal}}, {{reward}}"
                                                    />
                                                    <Box>
                                                        <Text as="p">Badge Icon</Text>
                                                        <input
                                                            type="file"
                                                            onChange={(event) => handleBadgeIconChange(offer.id, event)}
                                                            style={{ marginTop: '8px' }}
                                                        />
                                                        {offer.badgeIcon && (
                                                            <Box paddingBlockStart="200">
                                                                <Text fontWeight="semibold">Selected Badge Icon:</Text>
                                                                <InlineStack align="space-between" blockAlign="center">
                                                                    <Image
                                                                        source={URL.createObjectURL(offer.badgeIcon)}
                                                                        alt="Badge Icon Preview"
                                                                        width="50px"
                                                                    />
                                                                    <Button
                                                                        tone="critical"
                                                                        size="medium"
                                                                        onClick={() => updateOffer(offer.id, "badgeIcon", null)}
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
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    loading={mainBtnLoading}
                                    accessibilityLabel="Save campaign"
                                >
                                    Save Campaign
                                </Button>
                            </BlockStack>

                            <Card sectioned>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h3">Design Customization</Text>

                                    <Select
                                        label="Progress Bar Thickness"
                                        options={[
                                            { label: "Thin", value: "thin" },
                                            { label: "Thick", value: "thick" },
                                        ]}
                                        value={progressBarStyle.thickness || "thick"} // default value
                                        onChange={(value) => {
                                            // Update the thickness in progressBarStyle
                                            setProgressBarStyle((prev) => ({ ...prev, thickness: value }));

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
                                        onChange={(value) => setProgressBarStyle((prev) => ({ ...prev, cornerRadius: value }))}
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

                                    <InlineStack gap="200">
                                        <h2
                                        style={
                                                { fontSize: "14px", color: "grey", fontWeight:"600",}
                                        }
                                        >Progree Bar Colors</h2>
                                        <div style={{ display: "flex",  width: "100%", marginBottom: "16px" }}>
                                         
                                            {/* First color */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <input
                                                    type="color"
                                                    value={progressBarStyle.primaryColor}
                                                    onChange={(e) =>
                                                        setProgressBarStyle((prev) => ({
                                                            ...prev,
                                                            primaryColor: e.target.value,
                                                        }))
                                                    }
                                                    style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                    }}
                                                />
                                                <span style={{ color: "#a0a0a0", fontWeight: 700, fontSize: "15px", }}>Primary</span>
                                            </div>

                                            {/* Second color */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <input
                                                    type="color"
                                                    value={progressBarStyle.secondaryColor}
                                                    onChange={(e) =>
                                                        setProgressBarStyle((prev) => ({
                                                            ...prev,
                                                            secondaryColor: e.target.value,
                                                        }))
                                                    }
                                                    style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        marginLeft:"130px",
                                                    }}
                                                />
                                                <span style={{ color: "#a0a0a0", fontWeight: 700, fontSize: "15px", }}>Secondary</span>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", width: "100%" }}>
                                            {/* Third color */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <input
                                                    type="color"
                                                    value={progressBarStyle.goalCompleteColor}
                                                    onChange={(e) =>
                                                        setProgressBarStyle((prev) => ({
                                                            ...prev,
                                                            goalCompleteColor: e.target.value,
                                                        }))
                                                    }
                                                    style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                    }}
                                                />
                                                <span style={{ color: "#a0a0a0", fontWeight: 700, fontSize: "15px", }}>Goal complete</span>
                                            </div>

                                            {/* Fourth color */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <input
                                                    type="color"
                                                    value={progressBarStyle.backgroundColor}
                                                    onChange={(e) =>
                                                        setProgressBarStyle((prev) => ({
                                                            ...prev,
                                                            backgroundColor: e.target.value,
                                                        }))
                                                    }
                                                    style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        marginLeft: "82px",
                                                    }}
                                                />
                                                <span style={{ color: "#a0a0a0", fontWeight: 700, fontSize:"15px", }}>Background</span>
                                            </div>
                                        </div>

                                    </InlineStack>


                                </BlockStack>
                            </Card>
                        </BlockStack>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                        <div style={{ position: "sticky", top: "20px" }}>
                            <BlockStack gap="400">
                                <Card>
                                    <BlockStack gap="300">
                                        <ChoiceList
                                            title="Select Campaign Placement"
                                            choices={[
                                                { label: "Homepage", value: "home" },
                                                { label: "Product Page", value: "Page" },
                                                { label: "Cart Page", value: "cart" },
                                            ]}
                                            selected={placement}
                                            allowMultiple
                                            onChange={setPlacement}
                                        />
                                        <Divider borderColor="border" />
                                        <BlockStack gap="300">
                                            <Text>Preview Placement</Text>
                                            <InlineStack>
                                                <Button
                                                    icon={HomeIcon}
                                                    pressed={activePreview === "home"}
                                                    onClick={() => {
                                                        setActivePreview("home");
                                                        setIsHomepageModalOpen(true);
                                                    }}
                                                />
                                                <Button
                                                    icon={ProductIcon}
                                                    pressed={activePreview === "Page"}
                                                    onClick={() => setActivePreview("Page")}
                                                />
                                                <Button
                                                    icon={CartIcon}
                                                    pressed={activePreview === "cart"}
                                                    onClick={() => setActivePreview("cart")}
                                                />
                                            </InlineStack>
                                        </BlockStack>
                                    </BlockStack>
                                </Card>
                                {renderPreview()}
                            </BlockStack>
                        </div>
                    </Layout.Section>
                </Layout>
            </FormLayout>
        </Page>
    );
}