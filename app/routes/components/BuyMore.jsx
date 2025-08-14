import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  Select,
  TextField,
  Text,
  ChoiceList,
  Box,
  IndexTable,
  Image,
  Grid
} from "@shopify/polaris";

const DiscountOptions = [
  { label: "Percentage", value: "percentage" },
  { label: "Fixed Amount", value: "amount" },
];

const BuyMore = ({
  rewardMode,
  setRewardMode,
  selectedProducts,
  setSelectedProducts,
  min_quantity,
  discount_Value,
  discount_type,
  fiexd_levels,
  flameLevels,
  setFlameLevels
}) => {
  const handleLevelChange = (productId, index, field, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            levels: product.levels.map((level, i) =>
              i === index ? { ...level, [field]: value } : level
            ),
          }
          : product
      )
    );
  };
  const addLevel = (productId) => {
    const newLevel = {
      quantity: min_quantity || "",
      discount: discount_Value || "",
      DiscountType: discount_type || "percentage",
    };

    console.log(newLevel,"tjis")
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            levels: [...product.levels, newLevel],
          }
          : product
      )
    );
  };

  const removeLevel = (productId, index) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
            ...product,
            levels: product.levels.filter((_, i) => i !== index),
          }
          : product
      )
    );
  };

  const removeProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const productPicker = async () => {
    try {
      const selectedItems = await window.shopify.resourcePicker({
        selectionIds: selectedProducts.map((p) => `gid://shopify/Product/${p.id}`),
        multiple: true,
        type: "product",
        action: "select",
        showVariants: true,
        query: "status:active AND published_status:published",
      });

      if (selectedItems) {
        const products = selectedItems.map((item) => ({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
          variantId: item.variants?.[0]?.id.split("/").pop(),
          price: item.variants?.[0]?.price,
          media: item.images?.[0]?.originalSrc || item.images?.[0]?.src || null,
          levels:
            rewardMode === "fixed"
              ? [
                {
                  quantity: min_quantity || "",
                  discount: discount_Value || "",
                  DiscountType: discount_type || "percentage",
                },
              ]
              : [],
        }));

        const unique = products.filter(
          (p) => !selectedProducts.some((existing) => existing.id === p.id)
        );

        setSelectedProducts((prev) => [...prev, ...unique]);
      }
    } catch (error) {
      console.error("Product picker failed:", error);
    }
  };



  // ===========>>> Flame <<<<<<<============

  const updateFlameLevel = (index, field, value) => {
    setFlameLevels((prev) =>
      prev.map((level, i) =>
        i === index ? { ...level, [field]: value } : level
      )
    );
  };

  const addFlameLevel = () => {
    setFlameLevels((prev) => [
      ...prev,
      { quantity: "", discount: "", discountType: "percentage" },
    ]);
  };

  const removeFlameLevel = (index) => {
    setFlameLevels((prev) => prev.filter((_, i) => i !== index));
  };


  return (
    <>
      {/* Reward Mode Selection */}
      <Card sectioned>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">Reward Type</Text>
          <ChoiceList
            title="Select reward mode"
            choices={[
              {
                label: (
                  <Box>
                    <Text fontWeight="semibold">Fixed Deal</Text>
                    <Text tone="subdued" variant="bodySm">
                      (e.g., Buy 3 Socks = 10% off)
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
                      (e.g., Pick 3-5 Accessories, get 25% off)
                    </Text>
                  </Box>
                ),
                value: "flame"
              }
            ]}
            selected={[rewardMode]}
            onChange={(value) => {
              setRewardMode(value[0]);
              setSelectedProducts([]);
            }}
          />

          <Button onClick={productPicker} variant="primary">
            {rewardMode === "fixed" ? "Select Trigger Products" : "Select Bundle Products"}
          </Button>
        </BlockStack>
      </Card>

      {/* Fixed Deal Configuration */}
      {rewardMode === "fixed" && selectedProducts.length > 0 && (
        <BlockStack gap="400">
          {selectedProducts.map((product) => (
            <Card key={product.id} sectioned>
              <BlockStack gap="400">
                {/* Product Header */}
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    {product.media && (
                      <Image
                        source={product.media}
                        alt={product.title}
                        width={60}
                        height={60}
                        style={{ borderRadius: "4px" }}
                      />
                    )}
                    <Box>
                      <Text fontWeight="semibold">{product.title}</Text>
                      <Text tone="subdued">${product.price}</Text>
                    </Box>
                  </InlineStack>
                  <Button
                    tone="critical"
                    onClick={() => removeProduct(product.id)}
                  >
                    Remove Product
                  </Button>
                </InlineStack>

                {/* Discount Levels Table */}
                <Box paddingBlockStart="200">
                  <Text variant="headingSm" as="h4">Discount Tiers</Text>
                  <Box paddingBlockStart="200">
                    <IndexTable
                      itemCount={product.levels.length}
                      headings={[
                        { title: "Quantity" },
                        { title: "Discount" },
                        { title: "Type" },
                        { title: "Actions" }
                      ]}
                    >
                      {product.levels.map((level, index) => (
                        <IndexTable.Row key={index}>
                          <IndexTable.Cell>
                            <TextField
                              type="number"
                              value={level.quantity}
                              onChange={(value) =>
                                handleLevelChange(product.id, index, "quantity", value)
                              }
                              min="1"
                            />
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            <TextField
                              type="number"
                              value={level.discount}
                              onChange={(value) =>
                                handleLevelChange(product.id, index, "discount", value)
                              }
                              min="0"
                            />
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            <Select
                              options={DiscountOptions}
                              value={level.DiscountType}
                              onChange={(value) =>
                                handleLevelChange(product.id, index, "DiscountType", value)
                              }
                            />
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            {product.levels.length > 1 && (
                              <Button
                                plain
                                tone="critical"
                                onClick={() => removeLevel(product.id, index)}
                              >
                                Remove
                              </Button>
                            )}
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      ))}
                    </IndexTable>
                  </Box>
                  <Box paddingBlockStart="200">
                    <Button onClick={() => addLevel(product.id)}>
                      Add Discount Tier
                    </Button>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          ))}
        </BlockStack>
      )}

      {/* Flame Match Configuration */}
      {rewardMode === "flame" && selectedProducts.length > 0 && (
        <BlockStack gap="400">
          {/* Discount Levels */}
          <Card sectioned>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Bundle Discount Tiers</Text>
              <IndexTable
                itemCount={flameLevels.length}
                headings={[
                  { title: "Quantity" },
                  { title: "Discount" },
                  { title: "Type" },
                  { title: "Actions" }
                ]}
              >
                {flameLevels.map((level, index) => (
                  <IndexTable.Row key={index}>
                    <IndexTable.Cell>
                      <TextField
                        type="number"
                        value={level.quantity}
                        onChange={(val) => updateFlameLevel(index, "quantity", val)}
                        min="1"
                      />
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <TextField
                        type="number"
                        value={level.discount}
                        onChange={(val) => updateFlameLevel(index, "discount", val)}
                        min="0"
                      />
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Select
                        options={[
                          { label: "Percentage", value: "percentage" },
                          { label: "Fixed Amount", value: "fixed" },
                        ]}
                        value={level.discountType}
                        onChange={(val) => updateFlameLevel(index, "discountType", val)}
                      />
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Button
                        tone="critical"
                        onClick={() => removeFlameLevel(index)}
                      >
                        Remove
                      </Button>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
              <Button onClick={addFlameLevel} variant="primary">
                Add Discount Tier
              </Button>
            </BlockStack>
          </Card>

          {/* Selected Products */}
          <Card sectioned>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Selected Bundle Products</Text>

              {selectedProducts.map((product) => (
                <Card key={product.id} padding="400">
                  <BlockStack gap="300">
                    <InlineStack gap={"300"} align="space-between">
                      <BlockStack align="center" >

                        <InlineStack align="center">
                          {product.media && (
                            <Image
                              source={product.media}
                              alt={product.title}
                              width={60}
                              height={60}
                              style={{ borderRadius: "4px" }}
                            />
                          )}
                          <Box>
                            <Text fontWeight="semibold">{product.title}</Text>
                            <Text tone="subdued">${product.price}</Text>
                          </Box>
                        </InlineStack>
                      </BlockStack>
                      <BlockStack>

                        <Button
                          tone="critical"
                          size="slim"
                          onClick={() => removeProduct(product.id)}
                        >
                          Remove
                        </Button>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </Card>
              ))}

            </BlockStack>
          </Card>
        </BlockStack>
      )}
    </>
  );
};

export default BuyMore;
