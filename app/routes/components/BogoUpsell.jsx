import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  ChoiceList,
  TextField,
  Text,
  Box,
  ResourceList,
  ResourceItem,
  Image,
  Badge,
  Divider,
  Icon,
  Banner,
  RadioButton
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";

const BogoUpsell = ({
  rules,
  setRules,
  initialFreeItems = [],
  setFreeItems,
  buyCollectionPicker_BOGO,
  setBuyCollectionPicker_BOGO,
  buyProductPicker_BOGO,
  setBuyProductPicker_BOGO,
  mode,
  setMode
}) => {

  const filteredProducts = buyProductPicker_BOGO || [];
  const filteredCollections = buyCollectionPicker_BOGO || [];
  const freeItems = initialFreeItems;
  const [productpicktype, setProductPickType] = useState("products");
  const handleAddRule = () => setRules([...rules, { buy: "", get: "" }]);

  const handleRemoveRule = (index) => {
    const updated = [...rules];
    updated.splice(index, 1);
    setRules(updated);
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const removeFreeItem = (id) => {
    const updated = freeItems.filter((item) => item.id !== id);
    setFreeItems(updated);
  };

  const removeCollection = (id) => {
    const updated = buyCollectionPicker_BOGO.filter((collection) => collection.id !== id);
    setBuyCollectionPicker_BOGO(updated);
  };

  const removeProduct = (id) => {
    const updated = buyProductPicker_BOGO.filter((product) => product.id !== id);
    setBuyProductPicker_BOGO(updated);
  };

  const pickFreeItems = async () => {
    try {
      const selected = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: mode === "flame",
        selected: freeItems.map((p) => `gid://shopify/Product/${p.id}`),
      });

      if (selected) {
        const items = selected.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
          variantId: item.variants[0]?.id.split("/").pop(),
          price: item.variants[0]?.price || "0.00",
          media: item.images[0]?.originalSrc || item.images[0]?.src || null,
        }));

        setFreeItems(mode === "fixed" ? [items[0]] : items);
      }
    } catch (error) {
      console.error("Error picking free items:", error);
    }
  };

  async function BuyCollectionPicker() {
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

        setBuyCollectionPicker_BOGO([products]);
      }
    } catch (error) {
      console.error("Error in collection picker:", error);
    }
  }

  const Buyproductpicker = async () => {
    try {
      const selectedItems = await window.shopify.resourcePicker({
        selectionIds: buyProductPicker_BOGO.map((product) => product.id),
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
          (newProduct) => !buyProductPicker_BOGO.some((existing) => existing.id === newProduct.id)
        );
        setBuyProductPicker_BOGO((prev) => [...prev, ...uniqueProducts]);
      }
    } catch (error) {
      console.error("Error in buy product picker:", error);
      shopify.toast.show("Failed to select buy products.", { isError: true });
    }
  };



  return (
    <Card>
      <BlockStack gap="500">
        {/* Header Section */}
        <Box paddingBlockEnd="300">
          <Text variant="headingLg" as="h2">Buy One Get One (BOGO) Setup</Text>
          <Text tone="subdued">
            Configure special offers where customers get free items when they purchase qualifying products
          </Text>
        </Box>

        <Divider />

        {/* Deal Type Selection */}
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd" fontWeight="bold">
              Selected Products Buy X,
            </Text>
            <Text as="p">Choose which products will Buy X Get Y.</Text>
            <InlineStack gap={"200"}>
              <RadioButton
                label="Specific products"
                checked={productpicktype === "products"}
                name="triggerType"
                onChange={() => {
                  setProductPickType("products");
                }}
              />
              <RadioButton
                label="Specific collections"
                checked={productpicktype === "collections"}
                name="triggerType"
                onChange={() => {
                  setProductPickType("collections");
                }}
              />
            </InlineStack>
            {productpicktype === "products" && (
              <Box padding="200" borderStyle="base">
                <BlockStack gap={"200"}>
                  <Text as="h3" variant="headingSm" fontWeight="bold">
                    Selected Products
                  </Text>

                  <InlineStack gap="200">
                    <Button onClick={Buyproductpicker}>Browse Products</Button>
                  </InlineStack>

                  {buyProductPicker_BOGO.length > 0 ? (
                    <ResourceList
                      resourceName={{ singular: 'product', plural: 'products' }}
                      items={buyProductPicker_BOGO}
                      renderItem={(item) => {
                        const { id, title, handle, price, media } = item;
                        return (
                          <ResourceItem id={id}>
                            <InlineStack align="space-between" gap="300">
                              <InlineStack gap="300" align="center">
                                {media ? (
                                  <Image source={media} alt={title} width="60px" />
                                ) : (
                                  <Text>No image</Text>
                                )}
                                <BlockStack>
                                  <Text fontWeight="bold">{title}</Text>
                                  <Text>Price: ${price}</Text>
                                  <Text>Handle: {handle}</Text>
                                </BlockStack>
                              </InlineStack>
                              <Button tone="critical" onClick={() => removeBuyProduct_BOGO(id)} size="medium">
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

            {productpicktype === "collections" && (
              <Box padding="200" borderStyle="base">
                <BlockStack gap={"200"}>
                  <Text as="h3" variant="headingSm" fontWeight="bold">
                    Selected Collections
                  </Text>

                  <InlineStack gap="200">
                    <Button onClick={BuyCollectionPicker}>Browse Collections</Button>
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
        <Card sectioned>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h3">Deal Type</Text>
            <ChoiceList
              choices={[
                {
                  label: (
                    <Box>
                      <Text fontWeight="semibold">Fixed Deal</Text>
                      <Text tone="subdued" variant="bodySm">
                        Buy X, Get Y Free (e.g., Buy 1 Protein Powder, Get 1 Shaker Bottle Free)
                      </Text>
                    </Box>
                  ),
                  value: "fixed"
                },
                {
                  label: (
                    <Box>
                      <Text fontWeight="semibold">Flame Match</Text>
                      <Text tone="subdued" variant="bodySm">
                        Buy X, Choose from Selection (e.g., Buy 1 Shirt, Get any Hat Free from Selection)
                      </Text>
                    </Box>
                  ),
                  value: "flame"
                }
              ]}
              selected={[mode]}
              onChange={(value) => setMode(value[0])}
            />
          </BlockStack>
        </Card>

        {/* Quantity Rules */}
        <Card sectioned>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h3">Quantity Rules</Text>
            <Text tone="subdued">
              Define how many items need to be purchased to qualify for free items
            </Text>

            {rules.length === 0 && (
              <Banner tone="info">
                No rules added yet. Click "Add Rule" to create your first BOGO offer.
              </Banner>
            )}

            {rules.map((rule, index) => (
              <Box key={index} paddingBlockStart="300">
                <InlineStack gap="300" align="start" blockAlign="center">
                  <Box minWidth="120px">
                    <TextField
                      label="Buy Quantity"
                      type="number"
                      value={rule.buy}
                      onChange={(val) => handleRuleChange(index, "buy", val)}
                      min="1"
                      autoComplete="off"
                    />
                  </Box>
                  <Box minWidth="120px">
                    <TextField
                      label="Get Free"
                      type="number"
                      value={rule.get}
                      onChange={(val) => handleRuleChange(index, "get", val)}
                      min="1"
                      autoComplete="off"
                    />
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button
                      icon={DeleteIcon}
                      tone="critical"
                      onClick={() => handleRemoveRule(index)}
                      plain
                    />
                  </Box>
                </InlineStack>
              </Box>
            ))}

            <Box paddingBlockStart="200">
              <Button onClick={handleAddRule} variant="primary">
                Add Rule
              </Button>
            </Box>
          </BlockStack>
        </Card>

        {/* Free Items Selection */}
        <Card sectioned>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h3">
              {mode === "fixed" ? "Free Item Selection" : "Free Items Collection"}
            </Text>
            <Text tone="subdued">
              {mode === "fixed"
                ? "Select the item that will be given for free when conditions are met"
                : "Select the items customers can choose from when they qualify"}
            </Text>

            <Box paddingBlockStart="200">
              <Button onClick={pickFreeItems} variant="primary">
                {freeItems.length > 0 ? "Edit Selection" : "Select Items"}
              </Button>
            </Box>

            {freeItems.length > 0 ? (
              <Box paddingBlockStart="300">
                <ResourceList
                  resourceName={{ singular: "product", plural: "products" }}
                  items={freeItems}
                  renderItem={(item) => {
                    const { id, title, price, media } = item;
                    return (
                      <ResourceItem id={id}>
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="300" blockAlign="center">
                            {media && (
                              <Image
                                source={media}
                                alt={title}
                                width={60}
                                height={60}
                                style={{ borderRadius: "4px" }}
                              />
                            )}
                            <BlockStack>
                              <Text fontWeight="medium">{title}</Text>
                              <Text tone="subdued">${price}</Text>
                              {mode === "flame" && (
                                <Badge tone="info">Customer's Choice</Badge>
                              )}
                            </BlockStack>
                          </InlineStack>
                          <Button
                            icon={DeleteIcon}
                            tone="critical"
                            onClick={() => removeFreeItem(id)}
                            plain
                          />
                        </InlineStack>
                      </ResourceItem>
                    );
                  }}
                />
              </Box>
            ) : (
              <Box paddingBlockStart="300">
                <Banner tone="subdued">
                  No free items selected. Customers won't receive anything until you select items.
                </Banner>
              </Box>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Card>
  );
};

export default BogoUpsell;
