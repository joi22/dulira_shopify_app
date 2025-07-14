import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  Select,
  TextField,
  Text,
  RadioButton,
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
  flameDiscount,
  setFlameDiscount,
  flameRange,
  setFlameRange,
  min_quantity,
  setMin_Quantity,
  max_quantity,
  setMax_Quantity,
  discount_Value,
  setDiscount_Value,
  discount_type,
  setDiscount_type,
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

  return (
    <>
      <Card title="Buy More, Save More Configuration" sectioned>
        <BlockStack gap="300">
          <Text variant="headingMd">Reward Mode</Text>
          <InlineStack gap="300">
            <RadioButton
              label="Fixed Deal (e.g. Buy 3 Socks = 10% off)"
              checked={rewardMode === "fixed"}
              onChange={() => {
                setRewardMode("fixed");
                setSelectedProducts([]);
              }}
            />
            <RadioButton
              label="Flame Match (e.g. Pick 3–5 Accessories, get 25% off)"
              checked={rewardMode === "flame"}
              onChange={() => {
                setRewardMode("flame");
                setSelectedProducts([]);
              }}
            />
          </InlineStack>

          <Button onClick={productPicker}>
            {rewardMode === "fixed" ? "Select Trigger Products" : "Select Bundle Products"}
          </Button>
        </BlockStack>
      </Card>

      

      {/* Fixed Deal UI */}
      {rewardMode === "fixed" &&
        selectedProducts.map((product) => (
          <Card key={product.id} padding="500" sectioned>
            <InlineStack align="space-between">
              <InlineStack gap="200" blockAlign="center">
                {product.media && (
                  <img
                    src={product.media}
                    alt={product.title}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                )}
                <div>
                  <Text fontWeight="medium">{product.title}</Text>
                  <Text tone="subdued">${product.price}</Text>
                </div>
              </InlineStack>
              <Button
                tone="critical"
                size="slim"
                onClick={() => removeProduct(product.id)}
              >
                Remove
              </Button>
            </InlineStack>

            <BlockStack gap="300">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      Quantity
                    </th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      Discount
                    </th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                      Discount Type
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {product.levels.map((level, index) => (
                    <tr key={index}>
                      <td style={{ padding: "10px" }}>
                        <TextField
                          type="number"
                          value={level.quantity}
                          onChange={(value) =>
                            handleLevelChange(product.id, index, "quantity", value)
                          }
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        <TextField
                          type="number"
                          value={level.discount}
                          onChange={(value) =>
                            handleLevelChange(product.id, index, "discount", value)
                          }
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        <Select
                          options={DiscountOptions}
                          value={level.DiscountType}
                          onChange={(value) =>
                            handleLevelChange(product.id, index, "DiscountType", value)
                          }
                        />
                      </td>
                      <td>
                        {product.levels.length > 1 && (
                          <Button
                            plain
                            tone="critical"
                            onClick={() => removeLevel(product.id, index)}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button onClick={() => addLevel(product.id)}>Add Level</Button>
            </BlockStack>
          </Card>
        ))}

      {/* Flame Mode UI */}
      {rewardMode === "flame" && selectedProducts.length > 0 && (
        <>
          <Card title="Flame Match Setup" sectioned>
            <BlockStack gap="300">
              <InlineStack gap="300">
                <TextField
                  label="Minimum Quantity to Pick"
                  type="number"
                  value={flameRange.min}
                  onChange={(val) =>
                    setFlameRange((prev) => ({ ...prev, min: val }))
                  }
                />
                <TextField
                  label="Maximum Quantity to Pick"
                  type="number"
                  value={flameRange.max}
                  onChange={(val) =>
                    setFlameRange((prev) => ({ ...prev, max: val }))
                  }
                />
                <TextField
                  label="Discount Percentage"
                  type="number"
                  value={flameDiscount}
                  suffix="%"
                  onChange={setFlameDiscount}
                />
              </InlineStack>
              <Text tone="subdued">
                Customers can pick {flameRange.min}–{flameRange.max} products from this
                selection and get {flameDiscount}% off.
              </Text>
            </BlockStack>
          </Card>

          <Card title="Selected Products for Bundle" sectioned>
            <BlockStack gap="200">
              {selectedProducts.map((product) => (
                <InlineStack
                  key={product.id}
                  align="space-between"
                  blockAlign="center"
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <InlineStack gap="200" blockAlign="center">
                    {product.media && (
                      <img
                        src={product.media}
                        alt={product.title}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    )}
                    <div>
                      <Text fontWeight="medium">{product.title}</Text>
                      <Text tone="subdued">${product.price}</Text>
                    </div>
                  </InlineStack>
                  <Button
                    tone="critical"
                    size="slim"
                    onClick={() => removeProduct(product.id)}
                  >
                    Remove
                  </Button>
                </InlineStack>
              ))}
            </BlockStack>
          </Card>
        </>
      )}
    </>
  );
};

export default BuyMore;
