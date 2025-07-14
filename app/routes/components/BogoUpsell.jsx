import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  RadioButton,
  Select,
  TextField,
  Text,
} from "@shopify/polaris";

const BogoUpsell = () => {
  const [mode, setMode] = useState("fixed"); // fixed | flame
  const [triggerType, setTriggerType] = useState("all"); // all | products | collections
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [freeItems, setFreeItems] = useState([]);
  const [rules, setRules] = useState([{ buy: "1", get: "1" }]);

  const handleAddRule = () => {
    setRules([...rules, { buy: "", get: "" }]);
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const handleRemoveRule = (index) => {
    const updated = [...rules];
    updated.splice(index, 1);
    setRules(updated);
  };

  const mockPicker = async (setFn, label) => {
    // Replace with actual Shopify resourcePicker integration
    const mockItem = {
      id: Math.random().toString(36).substring(2),
      title: `${label} Item ${selectedProducts.length + 1}`,
    };
    setFn((prev) => [...prev, mockItem]);
  };

  return (
    <>
      <Card title="Buy One Get One Setup" sectioned>
        <BlockStack gap="300">
          <Text variant="headingMd">Mode</Text>
          <InlineStack gap="300">
            <RadioButton
              label="Fixed Deal (Buy 1 Protein Powder, Get 1 Shaker Free)"
              checked={mode === "fixed"}
              onChange={() => {
                setMode("fixed");
                setFreeItems([]);
              }}
            />
            <RadioButton
              label="Flame Match (Buy 1 Shirt, Choose any Hat Free)"
              checked={mode === "flame"}
              onChange={() => {
                setMode("flame");
                setFreeItems([]);
              }}
            />
          </InlineStack>

          <Text variant="headingMd">Trigger Product Type</Text>
          <InlineStack gap="200">
            <RadioButton
              label="All Products"
              checked={triggerType === "all"}
              onChange={() => setTriggerType("all")}
            />
            <RadioButton
              label="Specific Products"
              checked={triggerType === "products"}
              onChange={() => setTriggerType("products")}
            />
            <RadioButton
              label="Specific Collections"
              checked={triggerType === "collections"}
              onChange={() => setTriggerType("collections")}
            />
          </InlineStack>

          {triggerType === "products" && (
            <Button onClick={() => mockPicker(setSelectedProducts, "Trigger Product")}>
              Pick Trigger Products
            </Button>
          )}

          {triggerType === "collections" && (
            <Button onClick={() => mockPicker(setSelectedCollections, "Collection")}>
              Pick Collections
            </Button>
          )}

          <Text variant="headingMd">Quantity Rules</Text>
          {rules.map((rule, index) => (
            <InlineStack key={index} gap="200" align="start">
              <TextField
                label="Buy"
                type="number"
                value={rule.buy}
                onChange={(val) => handleRuleChange(index, "buy", val)}
              />
              <TextField
                label="Get Free"
                type="number"
                value={rule.get}
                onChange={(val) => handleRuleChange(index, "get", val)}
              />
              {index > 0 && (
                <Button tone="critical" onClick={() => handleRemoveRule(index)} plain>
                  Remove
                </Button>
              )}
            </InlineStack>
          ))}
          <Button onClick={handleAddRule}>Add Rule</Button>

          <Text variant="headingMd">Free Item(s)</Text>
          <Button onClick={() => mockPicker(setFreeItems, "Free Item")}>Pick Free Item(s)</Button>
        </BlockStack>
      </Card>

    </>
  );
};

export default BogoUpsell;
