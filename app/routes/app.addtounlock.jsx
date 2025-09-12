import { useState, useEffect } from "react";
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
import { PlusIcon, DeleteIcon } from "@shopify/polaris-icons";

export default function AddToUnlock() {
    // Existing state variables from previous context
    const [campaignName, setCampaignName] = useState("");
    const [selectedTriggerType, setSelectedTriggerType] = useState("all");
    const [upsell_allproduct, setUpsell_allproduct] = useState(false);
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
    const [mainBtnLoading , setMainBtnLoading] = useState(false)
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
    const removeProduct = (id) => removeItem(id, setUpsellselectedItems, upsellselectedItems);
    const removeCollection = (id) => removeItem(id, setSelectedCollections, selectedCollections);
    // New state for multiple offers
    const [offers, setOffers] = useState([
        {
            id: Date.now(), // Unique ID for each offer
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

    // Add a new offer
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

    // Remove an offer
    const removeOffer = (id) => {
        setOffers((prev) => prev.filter((offer) => offer.id !== id));
    };

    // Update an offer's field
    const updateOffer = (id, field, value) => {
        setOffers((prev) =>
            prev.map((offer) =>
                offer.id === id ? { ...offer, [field]: value } : offer
            )
        );
    };

    // Update preview text for all offers
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

    // Picker functions (simplified for brevity, use existing ones from previous context)
    const Buyproductpicker = async (offerId) => {
        try {
            const selectedItems = await window.shopify.resourcePicker({
                multiple: true,
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
                    media: item.images[0]?.originalSrc || null,
                }));

                setOffers((prev) =>
                    prev.map((offer) =>
                        offer.id === offerId
                            ? {
                                ...offer,
                                buyProductPicker: [
                                    ...offer.buyProductPicker,
                                    ...products.filter(
                                        (p) => !offer.buyProductPicker.some((existing) => existing.id === p.id)
                                    ),
                                ],
                            }
                            : offer
                    )
                );
            }
        } catch (error) {
            console.error("Error in buy product picker:", error);
            shopify.toast.show("Failed to select products.", { isError: true });
        }
    };

    const BuyCollectionPicker = async (offerId) => {
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
                                buyCollectionPicker: [
                                    ...offer.buyCollectionPicker,
                                    ...collections.filter(
                                        (c) => !offer.buyCollectionPicker.some((existing) => existing.id === c.id)
                                    ),
                                ],
                            }
                            : offer
                    )
                );
            }
        } catch (error) {
            console.error("Error in buy collection picker:", error);
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

    const removeBuyProduct = (offerId, id) => {
        setOffers((prev) =>
            prev.map((offer) =>
                offer.id === offerId
                    ? {
                        ...offer,
                        buyProductPicker: offer.buyProductPicker.filter((item) => item.id !== id),
                    }
                    : offer
            )
        );
    };

    const removeBuyCollection = (offerId, id) => {
        setOffers((prev) =>
            prev.map((offer) =>
                offer.id === offerId
                    ? {
                        ...offer,
                        buyCollectionPicker: offer.buyCollectionPicker.filter((item) => item.id !== id),
                    }
                    : offer
            )
        );
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

    // Progress Bar Component
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
        // Validate campaign name
        if (!campaignName) {
            shopify.toast.show("Campaign name is required.", { isError: true });
            return;
        }

        // Validate each offer
        for (const [index, offer] of offers.entries()) {
            // Validate goal configuration
            if (offer.goalType === "amount_cart" && !offer.goalAmount) {
                shopify.toast.show(`Offer ${index + 1}: Goal amount is required.`, { isError: true });
                return;
            }
            if (offer.goalType === "quantity" && !offer.goalquantity) {
                shopify.toast.show(`Offer ${index + 1}: Goal quantity is required.`, { isError: true });
                return;
            }

            // Validate reward configuration
            if (offer.rewardType === "discount") {
                if (!offer.discountCode) {
                    shopify.toast.show(`Offer ${index + 1}: Discount value is required.`, { isError: true });
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

            // Validate reward products/collections for gift type
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

            // Validate Buy X configuration for gift type
            if (
                offer.rewardType === "gift" &&
                offer.productPickType === "products" &&
                offer.buyProductPicker.length === 0
            ) {
                shopify.toast.show(`Offer ${index + 1}: At least one product is required for Buy X configuration.`, {
                    isError: true,
                });
                return;
            }
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

        // Validate trigger type configuration
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

        // Set loading state
        setMainBtnLoading(true);

        // Construct FormData
        const formData = new FormData();
        formData.append("campaignName", campaignName);
        formData.append("selectedCampaignType", "add_to_unlock"); // Hardcoded for Add to Unlock
        formData.append("selectedTriggerType", selectedTriggerType);

        // Append trigger configuration
        if (selectedTriggerType === "products") {
            formData.append("selectedProducts", JSON.stringify(upsellselectedItems));
        } else if (selectedTriggerType === "collections") {
            formData.append("selectedCollections", JSON.stringify(selectedCollections));
        } else if (selectedTriggerType === "all") {
            formData.append("upsell_allproducts", "true");
        }

        // Append offers array
        formData.append("offers", JSON.stringify(offers));

        // Append design customization and toggles
        formData.append("showConfetti", showConfetti ? "on" : "off");
        formData.append("showLockedGoals", showLockedGoals ? "on" : "off");
        formData.append("showBadgeIcons", showBadgeIcons ? "on" : "off");
        formData.append("badgeImage", badgeIcon || "");
        formData.append("progressBarStyle", JSON.stringify(progressBarStyle));
        formData.append("placement", JSON.stringify(placement));

        // Submit form
        fetcher.submit(formData, {
            method: "POST",
            encType: "multipart/form-data",
        });
    };
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

                            {/* Trigger Products/Collections (unchanged from previous context) */}
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
                                                    <Button onClick={productpicker} size="medium">Browse Products</Button>
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
                                                    <Button onClick={collectionPicker} size="medium">Browse Collections</Button>
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
                                </BlockStack>
                            </Card>

                            {/* Multiple Offers */}

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
                                    <Card key={offer.id} sectioned background="" >
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

                                            {/* Goal Configuration */}
                                            <Card sectioned>
                                                <BlockStack gap="300">
                                                    <Text variant="headingMd" as="h3">
                                                        Goal Configuration
                                                    </Text>
                                                    <Box paddingBlockStart="200">
                                                        <Text variant="bodyMd" fontWeight="semibold">
                                                            Trigger Type
                                                        </Text>
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



                                            {/* Reward Type */}
                                            <Card sectioned >
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



                                            {/* Reward Setup */}
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
                                                            <Box paddingBlockStart="200">
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
                                                            </Box>
                                                        </BlockStack>
                                                    )}
                                                    {offer.rewardType === "shipping" && (
                                                        <BlockStack gap="300">
                                                            <Banner tone="success">
                                                                Free shipping will be automatically applied when the goal is reached
                                                            </Banner>
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
                                                        </BlockStack>
                                                    )}
                                                    {offer.rewardType === "gift" && (
                                                        <BlockStack gap="300">
                                                            <Button
                                                                onClick={() => rewardPicker(offer.id)}
                                                                variant="primary"
                                                                size="medium"
                                                            >
                                                                Select Reward Products
                                                            </Button>
                                                            {/* <Button
                                                                    onClick={() => rewardCollectionPicker(offer.id)}
                                                                    variant="primary"
                                                                    size="medium"
                                                                >
                                                                    Select Reward Collections
                                                                </Button> */}
                                                            {offer.rewardProducts.length > 0 && (
                                                                <Box paddingBlockStart="200">
                                                                    <Text fontWeight="semibold">Selected Reward Products:</Text>
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
                                                            {/* {offer.rewardCollection.length > 0 && (
                                                                    <Box paddingBlockStart="200">
                                                                        <Text fontWeight="semibold">Selected Reward Collections:</Text>
                                                                        <BlockStack gap="100">
                                                                            {offer.rewardCollection.map((item) => (
                                                                                <InlineStack
                                                                                    key={item.id}
                                                                                    align="space-between"
                                                                                    blockAlign="center"
                                                                                >
                                                                                    <Text>{item.title}</Text>
                                                                                    <Button
                                                                                        tone="critical"
                                                                                        size="medium"
                                                                                        onClick={() => removeRewardCollection(offer.id, item.id)}
                                                                                    >
                                                                                        Remove
                                                                                    </Button>
                                                                                </InlineStack>
                                                                            ))}
                                                                        </BlockStack>
                                                                    </Box>
                                                                )} */}
                                                            {/* {offer.rewardMode === "flame" && (
                                                                    <Box paddingBlockStart="200">
                                                                        <Text variant="headingSm">Customer Reward Selection Preview</Text>
                                                                        <Text as="p">Customers will choose from:</Text>
                                                                        {offer.rewardProducts.length > 0 || offer.rewardCollection.length > 0 ? (
                                                                            <ResourceList
                                                                                resourceName={{ singular: "reward", plural: "rewards" }}
                                                                                items={[...offer.rewardProducts, ...offer.rewardCollection]}
                                                                                renderItem={(item) => (
                                                                                    <ResourceItem id={item.id}>
                                                                                        <Text>{item.title}</Text>
                                                                                    </ResourceItem>
                                                                                )}
                                                                            />
                                                                        ) : (
                                                                            <Text>No rewards selected</Text>
                                                                        )}
                                                                    </Box>
                                                                )} */}
                                                        </BlockStack>
                                                    )}
                                                </BlockStack>
                                            </Card>

                                            {/* Goal Text Customization */}
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


                            {/* Design Customization and Toggles (unchanged from previous context) */}
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
                                    <BlockStack gap="200">
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
                                    </BlockStack>
                                </Card>
                                <Card title="Live Preview">
                                    <BlockStack gap="200">
                                        <Text variant="headingSm">Preview</Text>
                                        {offers.map((offer, index) => (
                                            <BlockStack key={offer.id} gap="200">
                                                <Text>Offer {index + 1}</Text>
                                                <ProgressBar
                                                    progress={
                                                        offer.goalType === "amount_cart"
                                                            ? (parseFloat(offer.goalAmount) > 0
                                                                ? (50 / parseFloat(offer.goalAmount)) * 100
                                                                : 0)
                                                            : (parseInt(offer.goalquantity) > 0
                                                                ? (1 / parseInt(offer.goalquantity)) * 100
                                                                : 0)
                                                    }
                                                    style={progressBarStyle}
                                                />
                                                <Text>
                                                    {offer.goalTextBefore
                                                        .replace(
                                                            "{{amount_left}}",
                                                            offer.goalType === "amount_cart"
                                                                ? `${offer.currency}${parseFloat(offer.goalAmount) - 50 || 0}`
                                                                : `${parseInt(offer.goalquantity) - 1 || 0} items`
                                                        )
                                                        .replace(
                                                            "{{reward}}",
                                                            offer.rewardType === "discount"
                                                                ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"
                                                                } Discount`
                                                                : offer.rewardType === "shipping"
                                                                    ? "Free Shipping"
                                                                    : "Free Gift"
                                                        )
                                                        .replace(
                                                            "{{goal}}",
                                                            offer.goalType === "amount_cart"
                                                                ? `${offer.currency}${offer.goalAmount || 0}`
                                                                : `${offer.goalquantity || 0} items`
                                                        )}
                                                </Text>
                                                <Text>
                                                    {offer.goalTextAfter
                                                        .replace(
                                                            "{{reward}}",
                                                            offer.rewardType === "discount"
                                                                ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"
                                                                } Discount`
                                                                : offer.rewardType === "shipping"
                                                                    ? "Free Shipping"
                                                                    : "Free Gift"
                                                        )
                                                        .replace(
                                                            "{{goal}}",
                                                            offer.goalType === "amount_cart"
                                                                ? `${offer.currency}${offer.goalAmount || 0}`
                                                                : `${offer.goalquantity || 0} items`
                                                        )}
                                                </Text>
                                            </BlockStack>
                                        ))}
                                        {showBadgeIcons && badgeIcon && (
                                            <Image source={URL.createObjectURL(badgeIcon)} alt="Badge Icon" width="50px" />
                                        )}
                                        {showConfetti && offers.some((offer) => offer.goalAmount || offer.goalquantity) && (
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