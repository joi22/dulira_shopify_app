import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Image,
  Text,
  InlineStack,
  useApi,
  useApplyCartLinesChange,
  useCartLines,
  useTranslate,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => <Extension />);


function Extension() {
  const translate = useTranslate();
  const { shop } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const lines = useCartLines();

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const productIds = lines
    .map((item) => {
      const id = item?.merchandise?.product?.id;
      if (!id || !id.includes("/")) return null;
      return id.split("/").pop();
    })
    .filter(Boolean);


  const domain = "https://brain-hz-detailed-behind.trycloudflare.com";

  useEffect(() => {
    async function fetchData() {
      try {
        if (productIds.length === 0) {
          setLoading(false);
          return;
        }
        const api = `${domain}/api/products/${productIds.join(",")}/${shop.myshopifyDomain}`;
        const response = await fetch(api);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("Fetched API data:", data);
        setApiData(data);
      } catch (err) {
        console.error("API fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productIds, shop.myshopifyDomain]);

  // Add reward to order
  const handleAddToOrder = async (reward) => {
    if (!reward?.variantId) {
      console.error("Invalid variant ID");
      setError("Cannot add product to cart: Invalid variant");
      return;
    }
    try {
      const result = await applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: `gid://shopify/ProductVariant/${reward.variantId}`,
        quantity: 1,
        attributes: [{ key: "checkout_upsell", value: reward.title || "Upsell" }],
      });
      if (result.type === "error") {
        console.error("Failed to add to cart:", result.message);
        setError("Failed to add item to cart");
      } else {
        console.log("Checkout Upsell added:", result);
      }
    } catch (err) {
      console.error("Cart update failed:", err);
      setError("Error updating cart");
    }
  };

  if (loading) {
    return <Text>Loading offers...</Text>;
  }

  if (error) {
    return (
      <Banner status="critical" title="Error">
        {error}
      </Banner>
    );
  }

  if (!apiData?.upsellTriggerProduct?.length) {
    return <Text>No upsell available for these products.</Text>;
  }

  const latestOffer = apiData.upsellTriggerProduct[apiData.upsellTriggerProduct.length - 1];
  if (!latestOffer || !latestOffer.campaign) {
    return <Text>No valid offer available.</Text>;
  }

  const rewardProducts = latestOffer.campaign.rewardProducts || [];
  const currency = apiData.currency || "USD";

  console.log("Reward Mode:", latestOffer.campaign.rewardMode);
  console.log("Reward Products:", rewardProducts);

  return (
    <BlockStack spacing="tight">
      <Banner title="Special Offer" />

      {/* --- Checkout Upsell --- */}
      {latestOffer.campaign.type === "checkout_upsell" && rewardProducts.length > 0 && (
        <BlockStack spacing="tight" border="base" padding="loose">
          <Text size="medium" emphasis="bold">
            Complete your order with this deal
          </Text>
          <Text tone="subdued">
            Save {latestOffer.campaign.discount_Value}
            {latestOffer.campaign.discountType === "percentage" ? "%" : ""} when you add this now
          </Text>

          {(latestOffer.campaign.rewardMode === "flame" ? rewardProducts : [rewardProducts[0]])
            .filter(Boolean) // Ensure no undefined items
            .map((reward) => {
              if (!reward?.id || !reward?.price) {
                console.warn("Invalid reward product:", reward);
                return null;
              }
              const originalPrice = parseFloat(reward.price).toFixed(2);
              const discountedPrice =
                latestOffer.campaign.discountType === "percentage"
                  ? (
                      reward.price -
                      (reward.price * parseFloat(latestOffer.campaign.discount_Value)) / 100
                    ).toFixed(2)
                  : (reward.price - parseFloat(latestOffer.campaign.discount_Value)).toFixed(2);

              return (
                <BlockStack key={reward.id} spacing="tight">
                  <InlineStack spacing="tight" blockAlign="center">
                    <Image
                      source={reward.media || ""}
                      description={reward.title || "Product image"}
                      style={{ width: "80px", height: "80px" }}
                    />
                    <BlockStack spacing="extraTight">
                      <Text size="medium" emphasis="bold">
                        {reward.title || "Product"}
                      </Text>
                      <Text size="large" tone="positive">
                        {discountedPrice} {currency}
                      </Text>
                      <Text tone="subdued" strikethrough>
                        {originalPrice} {currency}
                      </Text>
                    </BlockStack>
                    <Button onPress={() => handleAddToOrder(reward)}>Add to Order</Button>
                  </InlineStack>
                </BlockStack>
              );
            })}
        </BlockStack>
      )}

      {/* --- Order Bump Fallback --- */}
      {latestOffer.campaign.orderBump?.length > 0 && (
        <BlockStack border="dotted" padding="tight" spacing="tight">
          {latestOffer.campaign.orderBump[0]?.iconUrl && (
            <Image
              source={latestOffer.campaign.orderBump[0].iconUrl}
              description={latestOffer.campaign.orderBump[0].offerTitle || "Offer"}
              style={{ width: "80px", height: "80px" }}
            />
          )}
          {latestOffer.campaign.orderBump[0]?.offerTitle && (
            <Text size="medium">{latestOffer.campaign.orderBump[0].offerTitle}</Text>
          )}
          {latestOffer.campaign.orderBump[0]?.offerDescription && (
            <Text tone="subdued">{latestOffer.campaign.orderBump[0].offerDescription}</Text>
          )}
          {rewardProducts[0] && (
            <Button onPress={() => handleAddToOrder(rewardProducts[0])}>
              Add this to my order
            </Button>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}