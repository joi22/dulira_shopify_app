import React from "react";
import {
  Card,
  Select,
  TextField,
  Button,
  FormLayout,
  Banner,
  ResourceList,
  Thumbnail,
} from "@shopify/polaris";

const Post_Perchess = ({
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

  const pickUpsellProduct = async () => {
    try {
      const selected = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: false, // only allow ONE product
        selected: selectedProducts.map(
          (p) => `gid://shopify/Product/${p.id}`
        ),
      });

      if (selected && selected.length > 0) {
        const item = selected[0];
        const newProduct = {
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
          variantId: item.variants[0]?.id.split("/").pop(),
          price: item.variants[0]?.price || "0.00",
          media: item.images[0]?.originalSrc || item.images[0]?.src || null,
        };

        setSelectedProducts([newProduct]); // always overwrite with single product
      }
    } catch (error) {
      console.error("Error picking upsell product:", error);
    }
  };

  return (
    <Card sectioned>
      <FormLayout>
        <Banner title="Select Discounted Product" status="info">
          <Button onClick={pickUpsellProduct}>Select Product</Button>
        </Banner>

        {/* Show selected product */}
        {selectedProducts.length > 0 && (
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

export default Post_Perchess;
