import React, { useState } from "react";
import {
  Card,
  RadioButton,
  Select,
  TextField,
  Button,
  FormLayout,
  Banner,
  ResourceList,
  Thumbnail,
} from "@shopify/polaris";

const CheckoutUI = ({
  setUpsellType,
  upsellType,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  selectedProducts,
  setSelectedProducts,
}) => {
  const removeProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const pickFreeItems = async () => {
    try {
      const selected = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: upsellType === "flame",
        selected: selectedProducts.map((p) => `gid://shopify/Product/${p.id}`),
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

        setSelectedProducts(upsellType === "fixed" ? [items[0]] : items);
      }
    } catch (error) {
      console.error("Error picking free items:", error);
    }
  };

  return (
    <Card sectioned>
      <FormLayout>
        {/* Fixed Deal Option */}
        <RadioButton
          label="Fixed Deal (One specific product)"
          checked={upsellType === "fixed"}
          id="fixed"
          name="upsellType"
          onChange={() => setUpsellType("fixed")}
        />
        {upsellType === "fixed" && (
          <Banner title="Select Reward Product" status="info">
            <Button onClick={pickFreeItems}>Select Reward Product</Button>
          </Banner>
        )}

        {/* Flame Match Option */}
        <RadioButton
          label="🔥 Flame Match (Customer chooses one from selection)"
          checked={upsellType === "flame"}
          id="flame"
          name="upsellType"
          onChange={() => setUpsellType("flame")}
        />
        {upsellType === "flame" && (
          <Banner title="Select Reward Product Collection" status="info">
            <Button onClick={pickFreeItems}>
              Select Multiple Reward Products
            </Button>
          </Banner>
        )}

        {/* Show selected reward products */}
        {selectedProducts.length > 0 && (
          <div>
            <Text variant="headingSm" fontWeight="semibold">
              {upsellType === "fixed"
                ? "Selected Reward Product:"
                : "Selected Reward Products:"}
            </Text>
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={selectedProducts}
              renderItem={(item) => {
                const { id, title, media, price } = item;
                return (
                  <ResourceList.Item
                    id={id}
                    media={<Thumbnail source={media} alt={title} />}
                    accessibilityLabel={`View details for ${title}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{title}</strong>
                        <div>${price}</div>
                      </div>
                      <Button destructive onClick={() => removeProduct(id)}>
                        Remove
                      </Button>
                    </div>
                  </ResourceList.Item>
                );
              }}
            />
          </div>
        )}

        {/* Discount Options */}
        <Select
          label="Discount Type"
          options={[
            { label: "% Off", value: "percentage" },
            { label: "Fixed Amount Off", value: "fixed" },
          ]}
          value={discountType}
          onChange={setDiscountType}
        />
        <TextField
          label="Discount Value"
          type="number"
          value={discountValue}
          onChange={setDiscountValue}
          suffix={discountType === "percentage" ? "%" : "$"}
        />
      </FormLayout>
    </Card>
  );
};

export default CheckoutUI;
