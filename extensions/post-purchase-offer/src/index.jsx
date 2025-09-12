
import React from 'react';

import {
  extend,
  render,
  BlockStack,
  Button,
  CalloutBanner,
  Heading,
  Image,
  Layout,
  TextBlock,
  TextContainer,
  View,
  Text,
} from "@shopify/post-purchase-ui-extensions-react";


extend("Checkout::PostPurchase::ShouldRender", async ({ storage, inputData }) => {
  const shopDomain = inputData.shop.domain;
  const productIds = inputData.initialPurchase.lineItems.map(
    (li) => li.product.variant.id
  );

  const res = await fetch(`https://eddie-protected-vast-felt.trycloudflare.com /api/products/${productIds}/${shopDomain}`);
  const data = await res.json();
console.log(data,"<<<<<<<_____",productIds)
  await storage.update({ offer: data });
  return { render: true };
});


// Simulate results of network call, etc.
async function getRenderData() {
  return {
      couldBe: "anything",
  };
}

/**
* Entry point for the `Render` Extension Point
*
* Returns markup composed of remote UI components.  The Render extension can
* optionally make use of data stored during `ShouldRender` extension point to
* expedite time-to-first-meaningful-paint.
*/
render("Checkout::PostPurchase::Render", ({ storage }) => {
  const { offer } = storage.initialData || {};
console.log(offer,"this render ")
  if (!offer) return <Text>No offer available</Text>;

  const reward = offer.rewardProducts[0];

  const handleAccept = () => ({
    type: "addLineItems",
    addedLineItems: [
      {
        variantId: reward.variantId,
        quantity: 1,
      },
    ],
  });

  const handleDecline = () => ({ type: "dismiss" });

  return (
    <BlockStack spacing="loose">
      <Text size="large" emphasis="bold">🎁 Special Offer!</Text>
      <Text>{reward.productTitle}</Text>
      <Text>{reward.price} USD</Text>

      <Button onPress={handleAccept}>✅ Yes, add it</Button>
      <Button onPress={handleDecline}>❌ No thanks</Button>
    </BlockStack>
  );
});