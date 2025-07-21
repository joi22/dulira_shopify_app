import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  RadioButton,
  TextField,
  Text,
  Box,
  ResourceList,
  ResourceItem,
  Image,
  Badge,
} from "@shopify/polaris";

const BogoUpsell = ({
  rules,                 // ✅ comes from parent
  setRules,
  initialFreeItems = [],
  setFreeItems,
}) => {
  const [mode, setMode] = useState("fixed");
  const freeItems = initialFreeItems; // 👈 Don't redefine state

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
    setFreeItems(updated); // ✅ Now this updates parent
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

        const newItems = mode === "fixed" ? [items[0]] : items;
        setFreeItems(newItems); // ✅ Updates parent state
      }
    } catch (error) {
      console.error("Error picking free items:", error);
    }
  };

  return (
    <Card title="Buy One Get One Setup" sectioned>
      <BlockStack gap="400">
        <Box>
          <Text variant="headingMd" as="h3">Deal Type</Text>
          <InlineStack gap="400">
            <RadioButton
              label="Fixed Deal (Buy X, Get Y Free)"
              helpText="Example: Buy 1 Protein Powder, Get 1 Shaker Bottle Free"
              checked={mode === "fixed"}
              onChange={() => setMode("fixed")}
            />
            <RadioButton
              label="Flame Match (Buy X, Choose from Selection)"
              helpText="Example: Buy 1 Shirt, Get any Hat Free from Selection"
              checked={mode === "flame"}
              onChange={() => setMode("flame")}
            />
          </InlineStack>
        </Box>

        <Box>
          <Text variant="headingMd" as="h3">Quantity Rules</Text>
          {rules.map((rule, index) => (
            <InlineStack key={index} gap="200" align="start" blockAlign="center">
              <TextField
                label="Buy"
                type="number"
                value={rule.buy}
                onChange={(val) => handleRuleChange(index, "buy", val)}
                min="1"
              />
              <TextField
                label="Get Free"
                type="number"
                value={rule.get}
                onChange={(val) => handleRuleChange(index, "get", val)}
                min="1"
              />
              {rules.length > 1 && (
                <Button tone="critical" onClick={() => handleRemoveRule(index)} plain>
                  Remove
                </Button>
              )}
            </InlineStack>
          ))}
          <Button onClick={handleAddRule}>Add Rule</Button>
        </Box>

        <Box>
          <Text variant="headingMd" as="h3">
            {mode === "fixed" ? "Free Item" : "Free Items Selection"}
          </Text>
          <Text as="p" variant="bodyMd">
            {mode === "fixed"
              ? "Select the item that will be given for free"
              : "Select items that customers can choose from"}
          </Text>
          <Button onClick={pickFreeItems}>
            {freeItems.length > 0 ? "Edit Selection" : "Select Items"}
          </Button>

          {freeItems.length > 0 ? (
            <Box paddingBlockStart="200">
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={freeItems}
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
                              height="60px"
                              style={{ objectFit: "cover" }}
                            />
                          )}
                          <BlockStack>
                            <Text fontWeight="bold">{title}</Text>
                            <Text>Price: ${price}</Text>
                            <Text>Handle: {handle}</Text>
                            {mode === "flame" && (
                              <Badge tone="info">Customer's Choice</Badge>
                            )}
                          </BlockStack>
                        </InlineStack>
                        <Button
                          tone="critical"
                          onClick={() => removeFreeItem(id)}
                          size="slim"
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            </Box>
          ) : (
            <Box paddingBlockStart="200">
              <Text tone="subdued">No free items selected</Text>
            </Box>
          )}
        </Box>
      </BlockStack>
    </Card>
  );
};

export default BogoUpsell;
