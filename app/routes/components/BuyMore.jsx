import React, { useEffect, useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  RadioButton,
  Text,
  TextField,
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
}) => {
  const [Buy_Fixed, setBuy_Fixed] = useState([]);
  const [Buy_Flame, setBuy_Flame] = useState([]);
  const [flameLevels, setFlameLevels] = useState([]);

  // Sync selected products to Buy_Fixed or Buy_Flame
  useEffect(() => {
    if (rewardMode === "fixed") {
      setBuy_Fixed(selectedProducts);
    } else if (rewardMode === "flame") {
      setBuy_Flame(selectedProducts);
    }
  }, [selectedProducts, rewardMode]);

  // Change reward mode and load saved products
  const handleRewardModeChange = (mode) => {
    setRewardMode(mode);
    if (mode === "fixed") {
      setSelectedProducts(Buy_Fixed);
    } else if (mode === "flame") {
      setSelectedProducts(Buy_Flame);
    }
  };

  const handleFlameLevelChange = (index, field, value) => {
    const updatedLevels = [...flameLevels];
    updatedLevels[index][field] = field === "quantity" ? parseInt(value) : value;
    setFlameLevels(updatedLevels);
  };

  const addFlameLevel = () => {
    setFlameLevels([...flameLevels, { quantity: 1, discount: 0, discountType: "percentage" }]);
  };

  const removeFlameLevel = (index) => {
    const updatedLevels = [...flameLevels];
    updatedLevels.splice(index, 1);
    setFlameLevels(updatedLevels);
  };

  const handleSave = () => {
    const payload = {
      fixed: Buy_Fixed,
      flame: {
        products: Buy_Flame,
        levels: flameLevels,
      },
    };

    console.log("Payload to save:", payload);
    // send to your server or mutation
  };

  return (
    <BlockStack gap="400">
      <Card title="Reward Type" sectioned>
        <BlockStack gap="200">
          <RadioButton
            label="Fixed Deal"
            checked={rewardMode === "fixed"}
            onChange={() => handleRewardModeChange("fixed")}
          />
          <RadioButton
            label="Flame Match"
            checked={rewardMode === "flame"}
            onChange={() => handleRewardModeChange("flame")}
          />
        </BlockStack>
      </Card>

      {rewardMode === "flame" && selectedProducts.length > 0 && (
        <Card title="Flame Match Setup" sectioned>
          <BlockStack gap="400">
            <Text variant="headingSm">Bundle Discount Levels</Text>

            {flameLevels.map((level, index) => (
              <InlineStack key={index} wrap={false} gap="300">
                <TextField
                  label="Min Quantity"
                  type="number"
                  value={level.quantity.toString()}
                  onChange={(value) => handleFlameLevelChange(index, "quantity", value)}
                  autoComplete="off"
                />
                <TextField
                  label="Discount Value"
                  type="number"
                  value={level.discount.toString()}
                  onChange={(value) => handleFlameLevelChange(index, "discount", value)}
                  autoComplete="off"
                />
                <select
                  value={level.discountType}
                  onChange={(e) => handleFlameLevelChange(index, "discountType", e.target.value)}
                >
                  {DiscountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button onClick={() => removeFlameLevel(index)} destructive>
                  Remove
                </Button>
              </InlineStack>
            ))}

            <Button onClick={addFlameLevel}>Add Level</Button>
          </BlockStack>
        </Card>
      )}

      <Button onClick={handleSave} variant="primary">
        Save Setup
      </Button>
    </BlockStack>
  );
};

export default BuyMore;
