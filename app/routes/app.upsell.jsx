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
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import BuyMore from "./components/BuyMore";
import BogoUpsell from "./components/BogoUpsell";
import { data, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { add_to_unlock_ } from "./utils/add_unlock"
import { buy_more_save_more } from "./utils/buy_more_save_more"

const trigger_coll = async (collectionIds, shop, accessToken, campaignId) => {
  for (const colId of collectionIds) {
    const gid = `gid://shopify/Collection/${colId}`;
    const gql = `
      query {
        collection(id:"${gid}") {
          products(first: 200) {
            edges {
              node {
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
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: gql }),
    });

    const result = await response.json();
    const products = result?.data?.collection?.products?.edges || [];

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
};



export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const { shop, accessToken } = session
  // Extract form data
  const campaignName = formData.get("campaignName");
  const placement = formData.get("placement");
  const selectedCampaignType = formData.get("selectedCampaignType");
  const selectedTriggerType = formData.get("selectedTriggerType");

  const selectedProducts = JSON.parse(formData.get("selectedProducts") || "[]");
  const selectedCollections = JSON.parse(formData.get("selectedCollections") || "[]");
  const rewardProducts = JSON.parse(formData.get("rewardProducts") || "[]");

  const reward_collection = JSON.parse(formData.get("reward_collection") || "[]");

  const upsell_allproducts = formData.get("upsell_allproducts");
  const goalType = formData.get("goalType");
  const goalAmounts = formData.get("goalAmount") || "0";
  const goalQuantity = formData.get("goalquantity");
  const currencys = formData.get("currency") || "USD";

  const rewardType = formData.get("rewardType");
  const rewardMode = formData.get("rewardMode");
  const discountCode = formData.get("discountCode");
  const discountType = formData.get("discountType");






  //  <============= // BUY MORE SAVE MORE /////////// ==========>

  const selectedProducts_Buy = JSON.parse(
    formData.get("selectedProducts_Buy") || "[]"
  );
  const raw = formData.get("flameLevels");
  const flameLevel = JSON.parse(raw || "[]");


  console.log(flameLevel, "this Levels")
  //  <============= // BUY MORE SAVE MORE END /////////// ==========>


  const showConfetti = formData.get("showConfetti");
  const goalText = formData.get("goalText");
  const preGoalText = formData.get("preGoalText");
  const showLockedGoals = formData.get("showLockedGoals");

  const badgeImageRaw = formData.get("badgeImage");
  const badgeImageUrl = badgeImageRaw ? String(badgeImageRaw) : null;

  const barStyle = formData.get("barStyle");
  const barRadius = formData.get("barRadius");
  const barColors = JSON.parse(formData.get("barColors"));



  // Save campaign to DB
  const upsellCampaign = await prisma.UpsellCampaign.create({
    data: {
      name: campaignName,
      type: selectedCampaignType,
      placement,
      goalType,
      goalAmount: parseInt(goalAmounts),
      goalquantity: parseInt(goalQuantity),
      currency: currencys,
      shop: String(shop),
      rewardMode,
      rewardType,
      discountCode,
      discountType,
      showConfetti: showConfetti === "on",
      showLockedGoals: showLockedGoals === "on",
      badgeImageUrl,
      barStyle,
      barRadius,
      barColors: JSON.stringify(barColors),
      goalText,
      preGoalText,
    },
  });

  // Store trigger logic
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



  } else if (selectedTriggerType === "collections" && selectedCollections.length > 0) {
    await prisma.UpsellTriggerCollection.createMany({
      data: selectedCollections.map((col) => ({
        campaignId: upsellCampaign.id,
        collectionId: col.id,
        title: col.title,
        handle: col.handle,
      })),
    });

    // Fetch and insert all products from selected collections
    const collectionIds = selectedCollections.map(col => col.id);
    await trigger_coll(collectionIds, shop, accessToken, upsellCampaign.id);
  }



  if (selectedCampaignType === "add_to_unlock") {
    const data_unlock = await add_to_unlock_(
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
      selectedProducts,
      selectedCollections
    );


  } else if (selectedCampaignType === "buy_more_save_more") {

    const Buy_More_Save_More = await buy_more_save_more(
      accessToken,
      shop,
      selectedProducts_Buy,
      admin,
      selectedProducts,
      rewardMode,
      flameLevel,
      upsellCampaign
    );

  }


  // Confirm success
  return { success: true, campaignID: upsellCampaign.id };
};










export default function UpsellCampaignForm() {

  const fetcher = useFetcher()

  //=================>>> Toast Message <<<=====================//

  useEffect(() => {
    if (fetcher.state == "idle" && fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message);
      setMainBtnLoading(false);
    } else if (fetcher.state == "idle" && !fetcher.data?.success) {
      shopify.toast.show(fetcher?.data?.message, { isError: true });
      setMainBtnLoading(false);
    }
    console.log(fetcher);
  }, [fetcher]);

  const [mainBtnLoading, setMainBtnLoading] = useState(false);

  //=================>>> Toast Message <<<=====================//


  const [campaignName, setCampaignName] = useState("");
  const [goalType, setGoalType] = useState("amount_cart");
  const [currency, setCurrency] = useState("MAD");
  const [goalAmount, setGoalAmount] = useState("");
  const [rewardType, setRewardType] = useState("manual");
  const [upsellType, setUpsellType] = useState("manual");
  const [showConfetti, setShowConfetti] = useState(false);
  const [goalText, setGoalText] = useState("🎉 Goal reached!");
  const [preGoalText, setPreGoalText] = useState(
    "👉 Add {{amount_left}} to get free shipping"
  );
  const [rewardProducts, setRewardProducts] = useState([]);
  const [placement, setPlacement] = useState(["home"]);
  const [selectedTriggerType, setSelectedTriggerType] = useState("all");
  const [upsellselectedItems, setUpsellselectedItems] = useState([]);
  const [goalquantity, setGoalquantity] = useState();
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [selectedCampaignType, setSelectedCampaignType] = useState("add_to_unlock");
  const [upsell_allproduct, setUpsell_allproduct] = useState(true)
  const [selectedCollection, setSelectedCollection] = useState([]);
  const [freeGiftProducts, setFreeGiftProducts] = useState([]);


  // BUY MORE SAVE MORE STATES ??//



  // ============ BOGO BUY ONE GET ONE FREE <<<<<<<< =========== ///
  const [freeItems, setFreeItems] = useState([]); // ✅ initialized
  const [rules, setRules] = useState([{ buy: "1", get: "1" }]);

  console.log(rules, freeItems, "========,,,,,<<<<<<")



  // const [rewardMode_Buy, setRewardMode_Buy] = useState("fixed");
  const [selectedProducts_Buy, setSelectedProducts_Buy] = useState([]);
  const [flameLevels, setFlameLevels] = useState([]);
  const [min_quantity, setMin_Quantity] = useState("3");
  const [discount_Value, setDiscount_Value] = useState("");


  const [rewardMode, setRewardMode] = useState("fixed");
  const [showLockedGoals, setShowLockedGoals] = useState(false);
  const [badgeImage, setBadgeImage] = useState(null);
  const [barStyle, setBarStyle] = useState("thin");
  const [barRadius, setBarRadius] = useState("rounded");
  const [barColors, setBarColors] = useState({
    primary: "#000000",
    secondary: "#cccccc",
    background: "#f2f2f2",
    goalComplete: "#4caf50",
  });




  function getAmountLeft() {
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
  }

  function getRewardDescription() {
    if (rewardType === "discount") return `${discountCode} ${discountType === "percentage" ? "% off" : "off"}`;
    if (rewardType === "shipping") return "Free Shipping";
    if (rewardType === "gift") return rewardMode === "flame" ? "a free gift of your choice" : rewardProducts[0]?.title || "a free gift";
    return "reward";
  }

  const formattedGoalText = goalText.replace(/{{reward}}/g, getRewardDescription()).replace(/{{goal}}/g, goalAmount);
  const formattedPreGoalText = preGoalText.replace(/{{amount_left}}/g, getAmountLeft()).replace(/{{goal}}/g, goalAmount);


  const filteredProducts = upsellselectedItems.filter(
    (p) =>
      p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.handle?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCollections = selectedCollections.filter(
    (c) =>
      c.title?.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      c.handle?.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  // 🛒 Upsell Product Picker
  async function productpicker() {
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
            !upsellselectedItems.some((existing) => existing.id === newProduct.id)
        );
        setUpsellselectedItems((prev) => [...prev, ...uniqueProducts]);
      }
    } catch (error) {
      console.error("Error in product picker:", error);
    }
  }

  // 📚 upsell Collection Picker
  async function collectionPicker() {
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
            !selectedCollections.some((existing) => existing.id === newColl.id)
        );

        setSelectedCollections((prev) => [...prev, ...uniqueCollections]);
      }
    } catch (error) {
      console.error("Error in collection picker:", error);
    }
  }


  function removeRewardCollection(id) {
    setFreeproductcollection((prev) =>
      prev.filter((collection) => collection.id !== id)
    );
  }


  function removeProduct(id) {
    setUpsellselectedItems((prev) => prev.filter((p) => p.id !== id));
  }
  // Remove collection by ID
  function removeCollection(id) {
    setSelectedCollections((prev) => prev.filter((c) => c.id !== id));
  }
  function removeRewardProduct(id) {
    setRewardProducts((prev) => prev.filter((c) => c.id !== id));
  }

  const goalOptions = [
    { label: "$ Amount in Cart", value: "amount_cart" },
    { label: "Quantity", value: "quantity" },
  ];
  const selected_campaign_type = [
    { label: "Add To Unlock", value: "add_to_unlock" },
    { label: "Buy More Save More", value: "buy_more_save_more" },
    { label: "Buy One Get One", value: "buy_one_get_one" },
  ];
  const currencies = [
    { label: "MAD", value: "MAD" },
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
  ];

  async function rewardPicker() {
    // if (rewardProducts.length >= 4) {
    //   alert("You can only select up to 4 reward products.");
    //   return;
    // }

    const selectedItems = await window.shopify.resourcePicker({
      multiple: true,
      type: "product",
      action: "select",
    });

    if (selectedItems) {
      const products = selectedItems.map((item) => ({
        id: item.id.split("/").pop(),
        title: item.title,
        variantId: item.variants[0]?.id.split('/').pop(),
        price: item.variants[0]?.price,
        media: item.images[0]?.originalSrc,
      }));
      console.log(products)
      const newItems = products.filter(p => !rewardProducts.find(pr => pr.id === p.id));
      setRewardProducts(prev => [...prev, ...newItems].slice(0, 4)); // Hard cap at 4
    }
  }


  //========================>> Handel SUBMIT <<======================




  const handleSubmit = () => {
    const formData = new FormData();

    // 🔹 Basic Campaign Info
    formData.append("campaignName", campaignName);
    formData.append("selectedCampaignType", selectedCampaignType);
    formData.append("selectedTriggerType", selectedTriggerType);

    // 🔹 Trigger Type Logic
    if (selectedTriggerType === "products") {
      formData.append("selectedProducts", JSON.stringify(upsellselectedItems));
    } else if (selectedTriggerType === "collections") {
      formData.append("selectedCollections", JSON.stringify(selectedCollections));
    } else if (selectedTriggerType === "all") {
      formData.append("upsell_allproducts", "true");
    }
    formData.append("rewardType", rewardType);
    formData.append("rewardMode", rewardMode);

    // 🔹 Goal Info
    formData.append("goalType", goalType);
    formData.append("goalAmount", goalAmount);
    formData.append("goalquantity", goalquantity);
    formData.append("currency", currency);

    // 🔹 Reward Info


    formData.append("discountCode", discountCode);
    formData.append("discountType", discountType);
    formData.append(
      "rewardProducts",
      JSON.stringify(rewardProducts)
    );
    formData.append(
      "reward_collection",
      JSON.stringify(selectedCollection)
    );

    if (selectedCampaignType === "buy_more_save_more") {
      formData.append("selectedProducts_Buy", JSON.stringify(selectedProducts_Buy));
      formData.append("flameLevels", JSON.stringify(flameLevels))
    }

    // 🔹 Visual + UI Settings
    formData.append("showConfetti", showConfetti);
    formData.append("goalText", goalText);
    formData.append("preGoalText", preGoalText);
    formData.append("placement", placement);
    formData.append("showLockedGoals", showLockedGoals);
    formData.append("badgeImage", badgeImage);
    formData.append("barStyle", barStyle);
    formData.append("barRadius", barRadius);
    formData.append("barColors", JSON.stringify(barColors));

    // 🚀 Submit via Remix fetcher
    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
  };




  //=======================>> FREE PRODUCT PICKER  <<=================


  async function fetchProductsInCollection(collectionId) {
    try {
      const res = await fetch(`/api/products-by-collection?id=${collectionId}`);
      const data = await res.json();

      setFreeGiftProducts(
        data.products.map((p) => ({
          id: p.id,
          title: p.title,
          image: p.image?.src,
        }))
      );
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }


  async function Free_gift_piker() {
    try {
      const upsell_collection = await window.shopify.resourcePicker({
        type: "collection",
        multiple: false, // Only one collection like "Summer Collection"
        action: "select",
      });

      if (upsell_collection && upsell_collection.length > 0) {
        const selected = upsell_collection[0];
        const collectionData = {
          id: selected.id.split("/").pop(),
          title: selected.title,
          handle: selected.handle,
        };

        setSelectedCollection([collectionData]); // Replace old collection
        fetchProductsInCollection(collectionData.id); // Load its products
      }
    } catch (error) {
      console.error("Error in collection picker:", error);
    }
  }



  return (
    <Page title="Create Upsell Campaign" fullWidth padding="4">

      <FormLayout>
        <Layout>
          <Layout.Section >
            <BlockStack gap="400"  >
              <Card>
                <BlockStack gap="200">
                  <TextField
                    label="Campaign Name"
                    value={campaignName}
                    onChange={setCampaignName}
                  />
                  <Divider />

                </BlockStack>
              </Card>
              {/* Start select a campaign type */}
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
                  <Text as="p">Choose which products will trigger the upsell offer.</Text>
                  <InlineStack gap={"200"}>


                    <RadioButton
                      label="All products"
                      checked={selectedTriggerType === "all"}
                      name="triggerType"
                      onChange={() => {
                        setSelectedTriggerType("all"),
                          setUpsell_allproduct(true)
                      }}
                    />

                    <RadioButton
                      label="Specific products"
                      checked={selectedTriggerType === "products"}
                      name="triggerType"
                      onChange={() => {
                        setSelectedTriggerType("products");
                      }}
                    />
                    <RadioButton
                      label="Specific collections"
                      checked={selectedTriggerType === "collections"}
                      name="triggerType"
                      onChange={() => {
                        setSelectedTriggerType("collections");
                      }}
                    />
                  </InlineStack>
                  {selectedTriggerType === "products" && (
                    <Box padding="200" borderStyle="base">
                      <BlockStack gap={"200"}>
                        <Text as="h3" variant="headingSm" fontWeight="bold">
                          Selected Products
                        </Text>

                        <InlineStack gap="200">
                          <Button onClick={productpicker}>Browse Products</Button>
                        </InlineStack>

                        {filteredProducts.length > 0 ? (
                          <ResourceList
                            resourceName={{ singular: "product", plural: "products" }}
                            items={filteredProducts} // ✅ FIXED
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
                                    <Button tone="critical" onClick={() => removeProduct(id)} size="slim">
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
                      <BlockStack gap={"200"}>
                        <Text as="h3" variant="headingSm" fontWeight="bold">
                          Selected Collections
                        </Text>

                        <InlineStack gap="200">
                          <Button onClick={collectionPicker}>Browse Collections</Button>

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
                                    <Button tone="critical" onClick={() => removeCollection(id)} size="slim">
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
              {/* select a campaign type End */}


              {selectedCampaignType === "add_to_unlock" && (
                <Card>
                  <BlockStack gap="300">

                    {/* 🔧 Goal Trigger Type */}
                    <Text variant="headingMd">Goal Trigger Type</Text>
                    <InlineStack gap="200">
                      {goalOptions.map((type) => (
                        <Button
                          key={type.value}
                          pressed={goalType === type.value}
                          onClick={() => setGoalType(type.value)}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </InlineStack>

                    {/* 🎯 Goal Configuration */}
                    {goalType === "amount_cart" && (
                      <BlockStack gap="200">
                        {/* <Select
                          label="Currency"
                          options={currencies}
                          value={currency}
                          onChange={setCurrency}
                        /> */}
                        <TextField
                          label={`Goal in `}
                          type="number"
                          value={goalAmount}
                          onChange={setGoalAmount}
                        />
                      </BlockStack>
                    )}
                    {goalType === "quantity" && (
                      <BlockStack gap={"150"}>
                        <Text>
                          Choose how many products need to be added to the cart to unlock the reward.
                        </Text>
                        <TextField
                          label="Quantity Goal"
                          type="number"
                          value={goalquantity}
                          onChange={setGoalquantity}
                          helpText="How many products need to be added to the cart to unlock the reward."
                        />
                      </BlockStack>
                    )}

                    {/* ✅ Toggles and Uploads */}
                    {/* <Checkbox
                      label="Show Confetti On Unlock"
                      checked={showConfetti}
                      onChange={setShowConfetti}
                    />
                    <Checkbox
                      label="Show Locked Goals"
                      checked={showLockedGoals}
                      onChange={setShowLockedGoals}
                    /> */}
                    <Box>
                      {/* <BlockStack gap={"150"}>
                        <Text variant="bodyMd">Upload Reward Badge Icon</Text>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setBadgeImage(reader.result);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {badgeImage && <Image source={badgeImage} alt="Badge" width="60px" />}
                      </BlockStack> */}

                    </Box>
                    <Text variant="headingMd">Reward Mode</Text>
                    <InlineStack gap="200">
                      <RadioButton
                        label="Fixed Deal"
                        checked={rewardMode === "fixed"}
                        onChange={() => {
                          setRewardMode("fixed");
                          setRewardType("discount");
                        }}
                      />
                      <RadioButton
                        label="Flame Match (Customer picks)"
                        checked={rewardMode === "flame"}
                        onChange={() => {
                          setRewardMode("flame");
                          setRewardType("gift");
                        }}
                      />
                    </InlineStack>
                    <InlineStack gap="200">
                      {rewardMode === "fixed" && (
                        <>
                          <RadioButton
                            label="Discount"
                            checked={rewardType === "discount"}
                            onChange={() => setRewardType("discount")}
                          />
                          <RadioButton
                            label="Free Shipping"
                            checked={rewardType === "shipping"}
                            onChange={() => setRewardType("shipping")}
                          />

                        </>
                      )}

                      {rewardMode === "flame" && (
                        <RadioButton
                          label="Free Gift"
                          checked={rewardType === "gift"}
                          onChange={() => setRewardType("gift")}
                        />
                      )}
                    </InlineStack>


                    {/* 🛠 Reward Setup */}
                    <Text variant="headingMd">Reward Setup</Text>

                    {rewardType === "discount" && (
                      <BlockStack gap="200">
                        <TextField
                          label="Discount Code"
                          placeholder="Enter discount code"
                          value={discountCode}
                          onChange={setDiscountCode}
                        />
                        <Select
                          label="Discount Type"
                          options={[
                            { label: "Percentage", value: "percentage" },
                            { label: "Fixed Amount", value: "amount" },
                          ]}
                          value={discountType}
                          onChange={setDiscountType}
                        />
                        <Button onClick={rewardPicker}>Select Productt </Button>
                        {rewardProducts.map((item) => (
                          <InlineStack key={item.id} align="space-between" >
                            <Text>{item.title}</Text>
                            <Button
                              tone="critical"
                              size="slim"
                              onClick={() => removeRewardProduct(item.id)}
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    )}

                    {rewardType === "shipping" && (
                      <BlockStack gap={"200"}>
                        <Box background="bg-fill-success-secondary" padding="200" borderRadius="200">
                          <Text>🚚 Free Shipping will be applied when goal is reached.</Text>
                        </Box>
                        <Button onClick={rewardPicker}>Select Productt </Button>
                        {rewardProducts.map((item) => (
                          <InlineStack key={item.id} align="space-between" >
                            <Text>{item.title}</Text>
                            <Button
                              tone="critical"
                              size="slim"
                              onClick={() => removeRewardProduct(item.id)}
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        ))}
                      </BlockStack>

                    )}
                    {rewardType === "gift" && (
                      <BlockStack gap="500">
                        <Button onClick={Free_gift_piker}>Select Reward Collection</Button>

                        {selectedCollection.map((item) => (
                          <InlineStack key={item.id} align="space-between">
                            <Text>{item.title}</Text>
                            <Button
                              tone="critical"
                              size="slim"
                              onClick={() => setSelectedCollection([])}
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        ))}

                        {freeGiftProducts.length > 0 && (
                          <Card title="Available Free Gift Products">
                            <BlockStack>
                              {freeGiftProducts.map((p) => (
                                <InlineStack key={p.id} align="space-between">
                                  <InlineStack>
                                    {p.image && <img src={p.image} width={40} />}
                                    <Text>{p.title}</Text>
                                  </InlineStack>
                                </InlineStack>
                              ))}
                            </BlockStack>
                          </Card>
                        )}
                      </BlockStack>
                    )}


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
                <BogoUpsell
                  mode={rewardMode}
                  initialFreeItems={freeItems}
                  rules={rules}
                  setFreeItems={setFreeItems}
                  setRules={setRules}

                />
              )}


              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd">Progress Bar Design</Text>
                  <Select label="Bar Thickness" options={[{ label: "Thin", value: "thin" }, { label: "Thick", value: "thick" }]} value={barStyle} onChange={setBarStyle} />
                  <Select label="Corner Radius" options={[{ label: "Square", value: "square" }, { label: "Slightly Rounded", value: "rounded" }, { label: "Fully Rounded", value: "full" }]} value={barRadius} onChange={setBarRadius} />
                  <BlockStack gap={"200"}>
                    <Text variant="headingMd">Progress Bar Colors</Text>

                    <InlineStack gap="500">
                      <BlockStack gap={"150"}>
                        <Text>
                          Primary
                        </Text>
                        <TextField type="color" value={barColors.primary} onChange={(value) => setBarColors({ ...barColors, primary: value })} />
                      </BlockStack>
                      <TextField label="Secondary" type="color" value={barColors.secondary} onChange={(value) => setBarColors({ ...barColors, secondary: value })} />
                      <BlockStack gap={"150"}>
                        <Text>
                          Background
                        </Text>
                        <TextField type="color" value={barColors.background} onChange={(value) => setBarColors({ ...barColors, background: value })} />
                      </BlockStack>

                      <BlockStack gap={"150"}>
                        <Text>
                          Goal Complete
                        </Text>
                        <TextField type="color" value={barColors.goalComplete} onChange={(value) => setBarColors({ ...barColors, goalComplete: value })} />
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card title="Goal Text Customization">
                <BlockStack gap="300">
                  <Text variant="headingSm">Insert Smart Variables into Text</Text>
                  <Text variant="bodySm" tone="subdued">Add variables like <code>{"{{goal}}"}</code> or <code>{"{{reward}}"}</code> to personalize messaging.</Text>
                  <TextField label="Goal Reached Text" value={goalText} onChange={setGoalText} multiline helpText="Use variables like {{goal}}, {{reward}}" />
                  <TextField label="Before Goal Reached Text" value={preGoalText} onChange={setPreGoalText} multiline helpText="Use variables like {{amount_left}}, {{goal}}" />
                </BlockStack>
              </Card>

              <InlineStack>
                <Button onClick={handleSubmit}>Submit</Button>

              </InlineStack>
              <Text></Text>

            </BlockStack>
          </Layout.Section >

          <Layout.Section variant="oneHalf">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <ChoiceList
                    title="Select Campaign Placement"
                    choices={[
                      { label: "Homepage", value: "home" },
                      { label: "Checkout", value: "checkout" },
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
                  <Text>{formattedGoalText}</Text>
                  <Text>{formattedPreGoalText}</Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </FormLayout>

    </Page>
  );
}
