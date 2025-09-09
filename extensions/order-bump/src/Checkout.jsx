import {
  reactExtension,
  BlockStack,
  Banner,
  Button,
  Text,
  Image,
  InlineStack,
  useApi,
  useCartLines,
  Layout,
  useApplyCartLinesChange,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

/* ---------------- CHECKOUT UPSELL ---------------- */
function CheckoutUpsellUI() {
  const { shop } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const lines = useCartLines();

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const productIds = lines
    .map((l) => l?.merchandise?.product?.id?.split("/").pop())
    .filter(Boolean);

  const domain = "https://arabia-losing-wednesday-superintendent.trycloudflare.com";

  useEffect(() => {
    async function fetchData() {
      try {
        if (!productIds.length) {
          setLoading(false);
          return;
        }
        const api = `${domain}/api/products/${productIds.join(",")}/${shop.myshopifyDomain}`;
        const res = await fetch(api);
        if (!res.ok) throw new Error(`Fetch error ${res.status}`);
        setApiData(await res.json());
      } catch (err) {
        setError("Could not load upsell");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productIds.join(","), shop.myshopifyDomain]);

  const handleAddToOrder = async (reward) => {
    try {
      const result = await applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: `gid://shopify/ProductVariant/${reward.variantId}`,
        quantity: 1,
      });
      if (result.type === "error") setError("Failed to add item");
    } catch {
      setError("Error updating order");
    }
  };

  if (loading) return <Text>Loading offer…</Text>;
  if (error) return <Banner status="critical">{error}</Banner>;

  const offer = apiData?.upsellTriggerProduct?.[0]?.campaign;
  if (!offer?.rewardProducts?.length) return <Text>No upsell available</Text>;

  const reward = offer.rewardProducts[0];

  return (
  

      <BlockStack spacing="tight">
        <Banner title="Special Checkout Offer" />
        <InlineStack spacing="loose" blockAlign="center">
          <Image aspectRatio={1}
            fit="cover"
             source={reward.media} description={reward.productTitle} />
          <BlockStack spacing="extraTight">
            <Text>{reward.productTitle}</Text>
            <Text>{reward.price} {apiData.currency || "USD"}</Text>
            <Button onPress={() => handleAddToOrder(reward)}>Add to Order</Button>
          </BlockStack>
        </InlineStack>
      </BlockStack>
   
  );
}

/* ---------------- THANK YOU UPSELL ---------------- */
function ThankYouUpsellUI() {
  const { shop } = useApi();
  const lines = useCartLines();
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(true);

  const productIds = lines
    .map((l) => l?.merchandise?.product?.id?.split("/").pop())
    .filter(Boolean);

  const domain = "https://arabia-losing-wednesday-superintendent.trycloudflare.com";

  useEffect(() => {
    async function fetchData() {
      try {
        if (!productIds.length) {
          setLoading(false);
          return;
        }
        const api = `${domain}/api/products/${productIds.join(",")}/${shop.myshopifyDomain}`;
        const res = await fetch(api);
        if (!res.ok) throw new Error(`Fetch error ${res.status}`);
        setApiData(await res.json());
      } catch (err) {
        setError("Could not load thank-you upsell");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productIds.join(","), shop.myshopifyDomain]);

  if (loading) return <Text>Loading offer…</Text>;
  if (error) return <Banner status="critical">{error}</Banner>;
  if (!show) return null;

  const offer = apiData?.upsellTriggerProduct?.[0]?.campaign;
  if (!offer?.rewardProducts?.length) return <Text>No thank-you offer</Text>;

  const reward = offer.rewardProducts[0];
  const checkoutUrl = `/cart/${reward.variantId}:1`;

  return (
    <BlockStack spacing="tight">
      <Text size="large" emphasis="bold">🎁 Special Thank You Offer!</Text>
      <Image source={reward.media} description={reward.productTitle} />
      <Text>{reward.productTitle}</Text>
      <Text>{reward.price} {apiData.currency || "USD"}</Text>

      <InlineStack spacing="loose" alignment="center">
        {/* redirect via anchor/button since useRedirect not supported here */}
        <Button to={checkoutUrl}>✅ Yes, add it</Button>
        <Button kind="secondary" onPress={() => setShow(false)}>❌ No thanks</Button>
      </InlineStack>
    </BlockStack>
  );
}

/* ---------------- EXPORTS FOR TARGETS ---------------- */
export const CheckoutUpsell = reactExtension(
  "purchase.checkout.block.render",
  () => <CheckoutUpsellUI />
);

export const ThankYouUpsell = reactExtension(
  "purchase.thank-you.cart-line-list.render-after",
  () => <ThankYouUpsellUI />
);
