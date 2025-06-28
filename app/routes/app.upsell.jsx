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
} from "@shopify/polaris";
import { useState } from "react";

export default function UpsellCampaignForm() {
  const [campaignName, setCampaignName] = useState("add_unlock");
  const [goalType, setGoalType] = useState("amount_cart");
  const [currency, setCurrency] = useState("MAD");
  const [goalAmount, setGoalAmount] = useState("40");
  const [rewardType, setRewardType] = useState("manual");
  const [showConfetti, setShowConfetti] = useState(false);
  const [goalText, setGoalText] = useState("🎉 Goal reached!");
  const [preGoalText, setPreGoalText] = useState(
    "👉 Add {{amount_left}} to get free shipping"
  );
  const [rewardProducts, setRewardProducts] = useState([]);
  const [placement, setPlacement] = useState(["home", "product", "cart"]);
  const [selectedTriggerType, setSelectedTriggerType] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");

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
  // 🔎 Filters
  const filteredProducts = selectedProducts.filter(
    (p) =>
      p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.handle?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCollections = selectedCollections.filter(
    (c) =>
      c.title?.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      c.handle?.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  // 🛒 Product Picker
  async function productpicker() {
    try {
      const selectedItems = await window.shopify.resourcePicker({
        selectionIds: selectedProducts.map((product) => product.id),
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
            !selectedProducts.some((existing) => existing.id === newProduct.id)
        );

        setSelectedProducts((prev) => [...prev, ...uniqueProducts]);
      }
    } catch (error) {
      console.error("Error in product picker:", error);
    }
  }

  // 📚 Collection Picker
  async function collectionPicker() {
    try {
      const selectedItems = await window.shopify.resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
      });

      if (selectedItems) {
        const collections = selectedItems.map((item) => ({
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
  function removeProduct(id) {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // Remove collection by ID
  function removeCollection(id) {
    setSelectedCollections((prev) => prev.filter((c) => c.id !== id));
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
    if (rewardProducts.length >= 4) {
      alert("You can only select up to 4 reward products.");
      return;
    }

    const selectedItems = await window.shopify.resourcePicker({
      multiple: true,
      type: "product",
      action: "select",
    });

    if (selectedItems) {
      const products = selectedItems.map((item) => ({
        id: item.id.split("/").pop(),
        title: item.title,
        price: item.variants[0]?.price,
        media: item.images[0]?.originalSrc,
      }));
      const newItems = products.filter(p => !rewardProducts.find(pr => pr.id === p.id));
      setRewardProducts(prev => [...prev, ...newItems].slice(0, 4)); // Hard cap at 4
    }
  }

  return (
    <Page title="Create Upsell Campaign" fullWidth padding="4">
      <Layout  >
        <Layout.Section variant="twoThirds" >
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
                      pressed={goalType === type.value}
                      onClick={() => setGoalType(type.value)}
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
                    onChange={() => setSelectedTriggerType("all")}
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
                    <Text as="h3" variant="headingSm" fontWeight="bold">
                      Selected Products
                    </Text>

                    <InlineStack gap="200">
                      <Button onClick={productpicker}>Browse Products</Button>
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
                  </Box>
                )}





                {selectedTriggerType === "collections" && (
                  <Box padding="200" borderStyle="base">
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
                  </Box>
                )}
              </BlockStack>
            </Card>
            {/* select a campaign type End */}


            <Card>
              <BlockStack gap="300">
                {/* 🎯 Reward Mode Selection */}
                <Text variant="headingMd">Reward Mode</Text>
                <InlineStack gap="200">
                  <RadioButton
                    label="Fixed Deal"
                    checked={rewardMode === "fixed"}
                    onChange={() => setRewardMode("fixed")}
                  />
                  <RadioButton
                    label="Flame Match (Customer picks)"
                    checked={rewardMode === "flame"}
                    onChange={() => setRewardMode("flame")}
                  />
                </InlineStack>

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
                    <Select
                      label="Currency"
                      options={currencies}
                      value={currency}
                      onChange={setCurrency}
                    />
                    <TextField
                      label={`Goal in ${currency}`}
                      type="number"
                      value={goalAmount}
                      onChange={setGoalAmount}
                    />
                  </BlockStack>
                )}
                {goalType === "quantity" && (
                  <TextField
                    label="Quantity Goal"
                    type="number"
                    value={goalAmount}
                    onChange={setGoalAmount}
                    helpText="How many products need to be added to the cart to unlock the reward."
                  />
                )}

                {/* ✅ Toggles and Uploads */}
                <Checkbox
                  label="Show Confetti On Unlock"
                  checked={showConfetti}
                  onChange={setShowConfetti}
                />
                <Checkbox
                  label="Show Locked Goals"
                  checked={showLockedGoals}
                  onChange={setShowLockedGoals}
                />
                <Box>
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
                </Box>

                {/* 🎁 Reward Type */}
                <Text variant="headingMd">Reward Type</Text>
                <InlineStack gap="200">
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
                  <RadioButton
                    label="Free Gift"
                    checked={rewardType === "gift"}
                    onChange={() => setRewardType("gift")}
                  />
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
                  </BlockStack>
                )}

                {rewardType === "shipping" && (
                  <Box background="bg-fill-success-secondary" padding="200" borderRadius="200">
                    <Text>🚚 Free Shipping will be applied when goal is reached.</Text>
                  </Box>
                )}

                {rewardType === "gift" && (
                  <BlockStack>
                    <Button onClick={rewardPicker}>Select Reward Products</Button>
                    {rewardProducts.map((item) => (
                      <InlineStack key={item.id} align="space-between">
                        <Text>{item.title}</Text>
                        <Button
                          tone="critical"
                          size="slim"
                          onClick={() => removeReward(item.id)}
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            {/* 🎨 Progress Bar Design */}
            <Card title="Progress Bar Design">
              <BlockStack gap="300">
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

                <Text variant="headingMd">Progress Bar Colors</Text>

                <TextField
                  label="Primary"
                  type="color"
                  value={barColors.primary}
                  onChange={(value) => setBarColors({ ...barColors, primary: value })}
                />
                <TextField
                  label="Secondary"
                  type="color"
                  value={barColors.secondary}
                  onChange={(value) => setBarColors({ ...barColors, secondary: value })}
                />
                <TextField
                  label="Background"
                  type="color"
                  value={barColors.background}
                  onChange={(value) => setBarColors({ ...barColors, background: value })}
                />
                <TextField
                  label="Goal Complete"
                  type="color"
                  value={barColors.goalComplete}
                  onChange={(value) => setBarColors({ ...barColors, goalComplete: value })}
                />

                {/* 🧠 Smart Variables Buttons */}
                {/* <Divider />
                <Text variant="headingSm">Insert Smart Variables into Text</Text>
                <Text variant="bodySm" tone="subdued">Add variables like <code>{{ goalAmount }}</code> or <code>{{  }}</code> to personalize messaging.</Text>

                <Text variant="bodyMd">Insert into Goal Text</Text>
                <InlineStack gap="200">
                  <Button size="slim" onClick={() => setGoalText(goalText + " {{goal}}")}>+ Goal</Button>
                  <Button size="slim" onClick={() => setGoalText(goalText + " {{reward}}")}>+ Reward</Button>
                </InlineStack>

                <Text variant="bodyMd">Insert into Pre-Goal Text</Text>
                <InlineStack gap="200">
                  <Button size="slim" onClick={() => setPreGoalText(preGoalText + " {{amount_left}}")}>+ Amount Left</Button>
                  <Button size="slim" onClick={() => setPreGoalText(preGoalText + " {{goal}}")}>+ Goal</Button>
                </InlineStack> */}
              </BlockStack>
            </Card>

            {/* 📝 Goal Messaging */}
            <Card title="Goal Text Customization">
              <BlockStack gap="300">
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

            <Text></Text>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird" >
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">

                <ChoiceList
                  title="Select Campaign Placement"
                  choices={[
                    { label: "Homepage", value: "home" },
                    { label: "Product Page", value: "product" },
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
                <Text>
                  {goalText.replace("{{reward}}", rewardType)}
                </Text>
                <Text>
                  {preGoalText.replace("{{amount_left}}", goalAmount).replace("{{goal}}", goalAmount)}
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
