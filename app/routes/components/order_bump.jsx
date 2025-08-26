import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  TextField,
  Text,
  ChoiceList,
  Box,
  Image,
  Checkbox,
  Select,
  ResourceList,
  ResourceItem,
  Icon,
  RadioButton,
} from "@shopify/polaris";
import { UploadIcon } from "@shopify/polaris-icons";

const OrderBump = ({

  addOnProduct,
  setAddOnProduct,
  offerTitle,
  setOfferTitle,
  offerDescription,
  setOfferDescription,
  preChecked,
  setPreChecked,
  targetCountries,
  setTargetCountries,
  excludeCountries,
  setExcludeCountries,
  offerType,
  setOfferType,
}) => {
  const [iconFile, setIconFile] = useState(null);



  const handleAddOnProductPicker = async () => {
    try {
      const selectedItem = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: false,
        showVariants: true,
        query: "status:active AND published_status:published",
      });

      if (selectedItem && selectedItem[0]) {
        const item = selectedItem[0];
        setAddOnProduct({
          id: item.id.split("/").pop(),
          title: item.title,
          handle: item.handle,
          price: item.variants?.[0]?.price,
          media: item.images?.[0]?.originalSrc || item.images?.[0]?.src || null,
          variantId: item.variants?.[0]?.id.split("/").pop(),
        });
      }
    } catch (error) {
      console.error("Add-on product picker failed:", error);
    }
  };

  const handleIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIconFile(URL.createObjectURL(file));
    }
  };


  const removeAddOnProduct = () => {
    setAddOnProduct(null);
  };

  return (
    <BlockStack gap="400">
      {/* Add-On Product */}
      <Card sectioned>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3">Add-On Product</Text>
          <Button onClick={handleAddOnProductPicker} variant="primary">
            Select Add-On Product
          </Button>
          {addOnProduct && (
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={[addOnProduct]}
              renderItem={(item) => (
                <ResourceItem id={item.id}>
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      {item.media && (
                        <Image
                          source={item.media}
                          alt={item.title}
                          width={60}
                          height={60}
                          style={{ borderRadius: "4px" }}
                        />
                      )}
                      <Box>
                        <Text fontWeight="semibold">{item.title}</Text>
                        <Text tone="subdued">${item.price}</Text>
                      </Box>
                    </InlineStack>
                    <Button tone="critical" onClick={removeAddOnProduct}>
                      Remove
                    </Button>
                  </InlineStack>
                </ResourceItem>
              )}
            />
          )}
          {addOnProduct?.title?.toLowerCase().includes("gift wrap") && (
            <Text tone="warning">
              Please contact your supplier to confirm they support gift wrapping.
            </Text>
          )}
        </BlockStack>
      </Card>



      <Card sectioned>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3">Customize Offer Content</Text>

          {/* Radio options: Only one can be selected */}


          <TextField
            label="Offer Title"
            value={offerTitle}
            onChange={setOfferTitle}
            placeholder="Add {{Shipping Protection}} to Your Order for {{150 MAD}}"
          />
          <TextField
            label="Description"
            value={offerDescription}
            onChange={setOfferDescription}
            placeholder="Covers loss, theft, or damage – just {{9.90 MAD}}"
            multiline={3}
          />
          <ChoiceList
            title="Offer Type"
            choices={[
              { label: "Shipping Protection", value: "shipping" },
              { label: "Gift Wrap", value: "giftwrap" },
              { label: "Priority Handling", value: "priority" },
            ]}
            selected={[offerType]}
            onChange={(value) => setOfferType(value[0])}
          />
          <Box>
            <Text variant="bodyMd" fontWeight="semibold">Optional Icon</Text>
            <Box paddingBlockStart="100">
              <Button
                icon={<Icon source={UploadIcon} />}
                onClick={() => document.getElementById("icon-upload").click()}
              >
                Upload Icon
              </Button>
              <input
                id="icon-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleIconUpload}
              />
              {iconFile && (
                <Box paddingBlockStart="200">
                  <Image
                    source={iconFile}
                    alt="Uploaded icon"
                    width={40}
                    height={40}
                  />
                </Box>
              )}
            </Box>
          </Box>

          <Checkbox
            label="Pre-check by default"
            checked={preChecked}
            onChange={setPreChecked}
          />
        </BlockStack>
      </Card>


      {/* Design Options */}
      {/* <Card sectioned>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3">Design Options</Text>
          <Select
            label="Button Variant"
            options={buttonVariantOptions}
            value={buttonVariant}
            onChange={setButtonVariant}
          />
          <TextField
            label="Text Color"
            value={textColor}
            onChange={setTextColor}
            placeholder="#000000"
          />
          <TextField
            label="Background Color"
            value={backgroundColor}
            onChange={setBackgroundColor}
            placeholder="#FFFFFF"
          />
          <Select
            label="Icon Size"
            options={iconSizeOptions}
            value={iconSize}
            onChange={setIconSize}
          />
        </BlockStack>
      </Card> */}

      {/* Country Targeting */}
      <Card sectioned>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3">Country Targeting</Text>
          <ChoiceList
            title="Target specific countries"
            choices={[
              { label: "On", value: "on" },
              { label: "Off", value: "off" },
            ]}
            selected={[targetCountries ? "on" : "off"]}
            onChange={(value) => {
              setTargetCountries(value[0] === "on" ? [] : null);
              if (value[0] === "off") setExcludeCountries([]);
            }}
          />
          {targetCountries && (
            <BlockStack gap="200">
              <Button
                onClick={async () => {
                  // Mock country picker (replace with actual country selection logic)
                  const countries = [
                    { id: "US", title: "United States" },
                    { id: "CA", title: "Canada" },
                  ];
                  setTargetCountries(countries);
                }}
              >
                Select Countries
              </Button>
              {targetCountries.length > 0 && (
                <ResourceList
                  resourceName={{ singular: "country", plural: "countries" }}
                  items={targetCountries}
                  renderItem={(item) => (
                    <ResourceItem id={item.id}>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text>{item.title}</Text>
                        <Button
                          tone="critical"
                          onClick={() =>
                            setTargetCountries((prev) =>
                              prev.filter((c) => c.id !== item.id)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    </ResourceItem>
                  )}
                />
              )}
              <Checkbox
                label="Exclude specific countries"
                checked={excludeCountries.length > 0}
                onChange={(checked) =>
                  setExcludeCountries(checked ? [] : excludeCountries)
                }
              />
              {excludeCountries.length > 0 && (
                <Button
                  onClick={async () => {
                    // Mock exclude country picker
                    const countries = [
                      { id: "UK", title: "United Kingdom" },
                    ];
                    setExcludeCountries(countries);
                  }}
                >
                  Select Countries to Exclude
                </Button>
              )}
              {excludeCountries.length > 0 && (
                <ResourceList
                  resourceName={{ singular: "country", plural: "countries" }}
                  items={excludeCountries}
                  renderItem={(item) => (
                    <ResourceItem id={item.id}>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text>{item.title}</Text>
                        <Button
                          tone="critical"
                          onClick={() =>
                            setExcludeCountries((prev) =>
                              prev.filter((c) => c.id !== item.id)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    </ResourceItem>
                  )}
                />
              )}
            </BlockStack>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );
};

export default OrderBump;
