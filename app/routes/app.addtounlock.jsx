import { useState, useEffect } from "react";
import './_index/style.css';
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
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon, ButtonIcon, HomeIcon, CartIcon, ProductIcon } from "@shopify/polaris-icons";
import { useFetcher, useNavigate } from '@remix-run/react';
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { add_to_unlock_ } from "./utils/add_unlock";

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
    console.log(status, "=============== <<<<<<   This Status ")
    const offers = JSON.parse(formData.get("offers") || "[]");
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
            badgeImageUrl: badgeImage ? badgeImage.name : null,
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
                goalTextAfter: offer.goalTextAfter
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
    const [selectedTriggerType, setSelectedTriggerType] = useState("all");
    const [upsell_allproduct, setUpsell_allproduct] = useState(false);
    const [status, setStatus] = useState({
        active: true,
        badges: false,
        lockedGoals: false,
    });
    const [upsellselectedItems, setUpsellselectedItems] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [collectionSearch, setCollectionSearch] = useState("");
    const [placement, setPlacement] = useState([]);
    const [formattedGoalText, setFormattedGoalText] = useState("Spend $50 to unlock a free gift!");
    const [formattedPreGoalText, setFormattedPreGoalText] = useState("Add more to your cart to unlock rewards.");
    const [showConfetti, setShowConfetti] = useState(false);
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
            goalTextBefore: "🛍 Add {{amount_left}} to unlock {{reward}}!",
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

    const rewardCollectionPicker = async (offerId) => {
        setOffers((prev) =>
            prev.map((offer) => {
                if (offer.id !== offerId) return offer;
                if (offer.rewardCollection.length >= 4) {
                    shopify.toast.show("You can only select up to 4 reward collections.", { isError: true });
                    return offer;
                }
                return offer;
            })
        );

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

                setOffers((prev) =>
                    prev.map((offer) =>
                        offer.id === offerId
                            ? {
                                ...offer,
                                rewardCollection: [
                                    ...offer.rewardCollection,
                                    ...collections.filter(
                                        (c) => !offer.rewardCollection.some((cr) => cr.id === c.id)
                                    ),
                                ].slice(0, 4),
                            }
                            : offer
                    )
                );
            }
        } catch (error) {
            console.error("Error in reward collection picker:", error);
            shopify.toast.show("Failed to select reward collections.", { isError: true });
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

    const removeRewardCollection = (offerId, id) => {
        setOffers((prev) =>
            prev.map((offer) =>
                offer.id === offerId
                    ? {
                        ...offer,
                        rewardCollection: offer.rewardCollection.filter((item) => item.id !== id),
                    }
                    : offer
            )
        );
    };

    const handleswitchChange = (field, value) => {
        setStatus((prev) => ({ ...prev, [field]: value }));
    };

    const handleBadgeIconChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setBadgeIcon(file);
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
                            backgroundColor:
                                progress >= 100 ? style.goalCompleteColor : style.primaryColor,
                            transition: "width 0.3s ease-in-out",
                        }}
                    />
                </div>
            </Box>
        );
    };

    const handleSubmit = () => {
        console.log(badgeIcon, "this ")
        if (!campaignName) {
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
        formData.append("campaignName", campaignName);
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

        if (badgeIcon) {
            formData.append("badgeImage", badgeIcon);
        }
        formData.append("progressBarStyle", JSON.stringify(progressBarStyle));
        formData.append("placement", JSON.stringify(placement));

        fetcher.submit(formData, {
            method: "POST",
            encType: "multipart/form-data",
        });
        setMainBtnLoading(false)
    };
const [currentProgress, setCurrentProgress] = useState(1);
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
                                        error={!campaignName ? "Campaign name is required" : ""}
                                    />
                                    <Divider />
                                </BlockStack>
                            </Card>

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
                                                        checked={status.badges}
                                                        onChange={(e) => handleswitchChange("badges", e.target.checked)}
                                                        className="switch-input"
                                                    />
                                                    <span className="switch-slider"></span>
                                                </label>
                                                <Text as="h4" variant="headingMd">Show badges</Text>
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
                                                                    updateOffer(offer.id, "goalquantity", "");
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
                                                                updateOffer(offer.id, "goalAmount", "");
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
                                                            choices={[
                                                                { label: "Fixed Deal", value: "fixed" },
                                                                { label: "Flame Match (Customer picks)", value: "flame" },
                                                            ]}
                                                            selected={[offer.rewardMode]}
                                                            onChange={(value) => {
                                                                const mode = value[0];
                                                                updateOffer(offer.id, "rewardMode", mode);
                                                                updateOffer(offer.id, "rewardType", mode === "flame" ? "gift" : "discount");
                                                            }}
                                                        />
                                                    </Box>
                                                    {offer.rewardMode === "fixed" && (
                                                        <ChoiceList
                                                            title="Reward Type"
                                                            choices={[
                                                                { label: "Discount", value: "discount" },
                                                                { label: "Free Shipping", value: "shipping" },
                                                            ]}
                                                            selected={[offer.rewardType]}
                                                            onChange={(value) => updateOffer(offer.id, "rewardType", value[0])}
                                                        />
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
                                                            accept="image/*"
                                                            onChange={handleBadgeIconChange}
                                                            style={{ marginTop: '8px' }}
                                                        />
                                                        {badgeIcon && (
                                                            <Box paddingBlockStart="200">
                                                                <Text fontWeight="semibold">Selected Badge Icon:</Text>
                                                                <InlineStack align="space-between" blockAlign="center">
                                                                    <Image
                                                                        source={URL.createObjectURL(badgeIcon)}
                                                                        alt="Badge Icon Preview"
                                                                        width="50px"
                                                                    />
                                                                    <Button
                                                                        tone="critical"
                                                                        size="medium"
                                                                        onClick={() => setBadgeIcon(null)}
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
                                        value={progressBarStyle.thickness}
                                        onChange={(value) => setProgressBarStyle((prev) => ({ ...prev, thickness: value }))}
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
                                    <InlineStack gap={"200"}>
                                        <TextField
                                            label="Primary Color"
                                            type="color"
                                            value={progressBarStyle.primaryColor}
                                            onChange={(value) => setProgressBarStyle((prev) => ({ ...prev, primaryColor: value }))}
                                        />
                                        <TextField
                                            label="Secondary Color"
                                            type="color"
                                            value={progressBarStyle.secondaryColor}
                                            onChange={(value) => setProgressBarStyle((prev) => ({ ...prev, secondaryColor: value }))}
                                        />
                                        <TextField
                                            label="Goal Complete Color"
                                            type="color"
                                            value={progressBarStyle.goalCompleteColor}
                                            onChange={(value) => setProgressBarStyle((prev) => ({ ...prev, goalCompleteColor: value }))}
                                        />
                                        <TextField
                                            label="Background Color"
                                            type="color"
                                            value={progressBarStyle.backgroundColor}
                                            onChange={(value) => setProgressBarStyle((prev) => ({ ...prev, backgroundColor: value }))}
                                        />
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
                                        <BlockStack gap={"300"}>
                                            <Text>
                                                Preview Placment
                                            </Text>
                                            <InlineStack >


                                                <Button icon={HomeIcon}></Button>
                                                <Button icon={CartIcon}></Button>
                                                <Button icon={ProductIcon}></Button>

                                            </InlineStack>

                                        </BlockStack>
                                        <InlineStack>

                                        </InlineStack>
                                    </BlockStack>
                                </Card>
                                <Card title="Live Preview">
                                    <BlockStack gap="200">
                                        <Text variant="headingSm">Preview</Text>
                                        <div className="mu-atu-banner mu-px-5 mu-pb-2 mu-mb-px mu-border-b mu-border-gray-400" style={{ background: "#fff", paddingBottom: "30px" }}>
                                            <div className="mu-goal-text mu-w-full" style={{ marginBottom: "20px" }}>
                                                <div className="mu-emoji-image mu-mb-0 mu-text-center">
                                                    <p className="ql-align-center">
                                                        <img src="https://monster-upsells-images-prod.s3.us-east-2.amazonaws.com/wp4cb45f10.gif" alt="Emoji" />
                                                        {offers
                                                            .sort((a, b) => (a.goalType === "quantity" ? parseInt(a.goalquantity) - parseInt(b.goalquantity) : 0))
                                                            .map((offer, index) => {
                                                                if (currentProgress >= (offer.goalType === "quantity" ? parseInt(offer.goalquantity) : 0)) {
                                                                    return offer.rewardType === "gift"
                                                                        ? "Choose Free product on cart page"
                                                                        : `🎉 You’ve unlocked ${offer.rewardType === "discount" ? `${offer.discountCode}% off` : offer.rewardType === "shipping" ? "Free Shipping" : "Free Gift"}!`;
                                                                }
                                                                return `Add <strong>${offer.goalType === "quantity" ? parseInt(offer.goalquantity) - currentProgress : 0}</strong> to get <strong>${offer.rewardType === "discount" ? `${offer.discountCode}% off` : offer.rewardType === "shipping" ? "Free Shipping" : "Free Gift"}</strong>`;
                                                            })
                                                            .join(" | ")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mu-progress-bar-container mu-flex mu-w-full mu-relative mu-mix-blend-darken mu-h-2 mu-rounded-2" style={{ background: "#D7DEFF" }}>
                                                {offers.length > 0 && (
                                                    <div
                                                        className="mu-progress-bar mu-block mu-transition-width mu-absolute mu-inset-0 mu-duration-500 mu-ease-out mu-z-10 mu-h-2 mu-rounded-2"
                                                        style={{
                                                            background: progressBarStyle.primaryColor,
                                                            width: `${Math.min((currentProgress / (offers[offers.length - 1].goalType === "quantity" ? parseInt(offers[offers.length - 1].goalquantity) : 1)) * 100, 100)}%`,
                                                        }}
                                                    />
                                                )}
                                                {offers
                                                    .sort((a, b) => parseInt(a.goalquantity) - parseInt(b.goalquantity))
                                                    .map((offer, index) => (
                                                        <div
                                                            key={offer.id}
                                                            className={`mu-badge-goal mu-relative mu-flex-1 mu-bg-transparent mu-z-20 mu-mix-blend-overlay mu-h-2 ${index === 0 ? "mu-rounded-l-2" : index === offers.length - 1 ? "mu-rounded-r-2" : ""}`}
                                                            style={{ borderColor: "#718096", display: "block" }}
                                                        >
                                                            <div
                                                                className="mu-z-20 mu-w-55px mu-h-55px mu-rounded-full mu-border-3 mu-absolute mu-top-1/2 mu-transform mu-text-12px mu-font-bold mu-leading-tight"
                                                                style={{
                                                                    left: `${(index / (offers.length - 1)) * 100}%`,
                                                                    background: "#fff",
                                                                    color: progressBarStyle.primaryColor,
                                                                    transform: "translate(-50%, -50%)",
                                                                    borderColor: "#D7DEFF",
                                                                }}
                                                            >
                                                                <div className="mu-relative mu-bg-cover mu-bg-center mu-flex mu-items-center mu-justify-center mu-flex-col mu-w-full mu-h-full mu-rounded-full">
                                                                    {offer.rewardType === "shipping" && (
                                                                        <svg width="22" height="14.67" viewBox="0 0 33 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M3.82105 13.0625L2.77895 11H10.0737L9.24 8.9375H2.43158L1.38947 6.875H12.2274L11.3937 4.8125H1.19495L0 2.75H5.21053C5.21053 2.02065 5.50331 1.32118 6.02446 0.805456C6.54561 0.289731 7.25245 0 7.98947 0H24.6632V5.5H28.8316L33 11V17.875H30.2211C30.2211 18.969 29.7819 20.0182 29.0002 20.7918C28.2184 21.5654 27.1582 22 26.0526 22C24.9471 22 23.8868 21.5654 23.1051 20.7918C22.3234 20.0182 21.8842 18.969 21.8842 17.875H16.3263C16.3263 18.969 15.8871 20.0182 15.1054 20.7918C14.3237 21.5654 13.2634 22 12.1579 22C11.0524 22 9.99211 21.5654 9.21038 20.7918C8.42865 20.0182 7.98947 18.969 7.98947 17.875H5.21053V13.0625H3.82105ZM26.0526 19.9375C26.6054 19.9375 27.1355 19.7202 27.5264 19.3334C27.9173 18.9466 28.1368 18.422 28.1368 17.875C28.1368 17.328 27.9173 16.8034 27.5264 16.4166C27.1355 16.0298 26.6054 15.8125 26.0526 15.8125C25.4999 15.8125 24.9697 16.0298 24.5789 16.4166C24.188 16.8034 23.9684 17.328 23.9684 17.875C23.9684 18.422 24.188 18.9466 24.5789 19.3334C24.9697 19.7202 25.4999 19.9375 26.0526 19.9375ZM28.1368 7.5625H24.6632V11H30.8602L28.1368 7.5625ZM12.1579 19.9375C12.7107 19.9375 13.2408 19.7202 13.6317 19.3334C14.0225 18.9466 14.2421 18.422 14.2421 17.875C14.2421 17.328 14.0225 16.8034 13.6317 16.4166C13.2408 16.0298 12.7107 15.8125 12.1579 15.8125C11.6051 15.8125 11.075 16.0298 10.6841 16.4166C10.2933 16.8034 10.0737 17.328 10.0737 17.875C10.0737 18.422 10.2933 18.9466 10.6841 19.3334C11.075 19.7202 11.6051 19.9375 12.1579 19.9375Z" />
                                                                        </svg>
                                                                    )}
                                                                    {offer.rewardType === "gift" && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mu-w-6 mu-h-6">
                                                                            <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                                                                        </svg>
                                                                    )}
                                                                    {offer.rewardType === "discount" && (
                                                                        <div>
                                                                            <span>{offer.discountCode}%</span>
                                                                            <span>Off</span>
                                                                        </div>
                                                                    )}
                                                                    <span className="mu-absolute mu-w-full mu-text-center" style={{ top: "53px", fontSize: "1em", color: progressBarStyle.primaryColor }}>
                                                                        {offer.goalType === "quantity" ? offer.goalquantity : offer.goalAmount}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="mu-goals mu-flex mu-justify-between mu-text-gray-600 mu-relative mu-h-3"></div>
                                        </div>
                                        {showBadgeIcons && badgeIcon && (
                                            <Image source={URL.createObjectURL(badgeIcon)} alt="Badge Icon" width="50px" />
                                        )}
                                        {showConfetti && offers.some((offer) => currentProgress >= (offer.goalType === "quantity" ? parseInt(offer.goalquantity) : 0)) && (
                                            <Text>🎉 Confetti Animation Triggered!</Text>
                                        )}
                                        {showLockedGoals && offers.length > 1 && (
                                            <Text>Locked Goals: Additional rewards to unlock...</Text>
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