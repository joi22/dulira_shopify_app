// app/routes/app.preview.jsx
import {
  Page,
  Card,
  Text,
  BlockStack,
  Thumbnail,
  Box,
  InlineStack,
  Button,
  Icon,
} from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { CartIcon, HomeIcon, ProductIcon } from "@shopify/polaris-icons";
import HomeSectionPreview from "./components/preview/HomeSectionPreview";

export async function loader({ request }) {
  const url = new URL(request.url);

  // Get query params from Preview button
  const name = url.searchParams.get("name");
  const type = url.searchParams.get("type");
  const placement = JSON.parse(url.searchParams.get("placement") || "[]");
  const products = JSON.parse(url.searchParams.get("products") || "[]");
  const offers = JSON.parse(url.searchParams.get("offers") || "[]");
  const progressBarStyle = JSON.parse(
    url.searchParams.get("progressBarStyle") || "{}",
  );
  const showConfetti = url.searchParams.get("showConfetti") === "true";
  const showLockedGoals = url.searchParams.get("showLockedGoals") === "true";
  const showBadgeIcons = url.searchParams.get("showBadgeIcons") === "true";
  const status = JSON.parse(url.searchParams.get("status") || "{}");

  return {
    name,
    type,
    placement,
    products,
    offers,
    progressBarStyle,
    showConfetti,
    showLockedGoals,
    showBadgeIcons,
    status,
  };
}

// ProgressBar component (copied from AddToUnlock for preview)
const ProgressBar = ({ progress, style }) => {
  return (
    <Box padding="200">
      <div
        style={{
          height: style.thickness === "thin" ? "10px" : "20px",
          borderRadius:
            style.cornerRadius === "square"
              ? "0"
              : style.cornerRadius === "slightly"
                ? "4px"
                : "20px",
          backgroundColor: style.backgroundColor || "#F5F5F5",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(progress, 100)}%`,
            height: "100%",
            backgroundColor:
              progress >= 100
                ? style.goalCompleteColor || "#FF9800"
                : style.primaryColor || "#4CAF50",
            transition: "width 0.3s ease-in-out",
          }}
        />
      </div>
    </Box>
  );
};

export default function PreviewPage() {
  const {
    name,
    type,
    placement,
    products,
    offers,
    progressBarStyle,
    showConfetti,
    showLockedGoals,
    showBadgeIcons,
    status,
  } = useLoaderData();
  console.log(
    name,
    type,
    placement,
    products,
    offers,
    progressBarStyle,
    showConfetti,
    showLockedGoals,
    showBadgeIcons,
    status,
  );

  return (
    <Page
      title="Offer Preview"
      fullWidth
      backAction={{ content: "back", url: "/app" }}
    >
      <BlockStack gap="400">
        <Card sectioned>
          <BlockStack gap="400">
            <InlineStack gap={"200"}>
              <Button>
                {" "}
                <Icon source={HomeIcon} tone="base" />
              </Button>
              <Button>
                {" "}
                <Icon source={CartIcon} tone="base" />
              </Button>
              <Button>
                {" "}
                <Icon source={ProductIcon} tone="base" />
              </Button>
            </InlineStack>
            <Text variant="headingLg">{name || "Unnamed Campaign"}</Text>
            <Text>Type: {type || "N/A"}</Text>
            <Text>
              Placement: {placement.length > 0 ? placement.join(", ") : "None"}
            </Text>
            <Text>Status: {status.active ? "Active" : "Inactive"}</Text>
            <Text>Show Badges: {status.badges ? "Yes" : "No"}</Text>
            <Text>Show Confetti: {showConfetti ? "Yes" : "No"}</Text>
            <Text>Show Locked Goals: {showLockedGoals ? "Yes" : "No"}</Text>
            <Text>Show Badge Icons: {showBadgeIcons ? "Yes" : "No"}</Text>
          </BlockStack>
        </Card>

        {products.length > 0 && (
          <Card title="Trigger Products" sectioned>
            <BlockStack gap="400">
              {products.map((p) => (
                <BlockStack key={p.id} gap="200">
                  <Thumbnail
                    source={p.media || ""}
                    alt={p.title || "Product"}
                  />
                  <Text>{p.title || "Untitled Product"}</Text>
                  <Text>${p.price || "0.00"}</Text>
                </BlockStack>
              ))}
            </BlockStack>
          </Card>
        )}

        {offers.length > 0 && (
          <Card title="Offers" sectioned>
            <BlockStack gap="400">
              {offers.map((offer, index) => {
                const rewardDescription =
                  offer.rewardType === "discount"
                    ? `${offer.discountCode}${offer.discountType === "percentage" ? "%" : "$"} Discount`
                    : offer.rewardType === "shipping"
                      ? "Free Shipping"
                      : "Free Gift";
                const goal =
                  offer.goalType === "amount_cart"
                    ? `${offer.currency}${offer.goalAmount || 0}`
                    : `${offer.goalquantity || 0} items`;
                const amountLeft =
                  offer.goalType === "amount_cart"
                    ? `${offer.currency}${parseFloat(offer.goalAmount || 0) - 50 || 0}`
                    : `${parseInt(offer.goalquantity || 0) - 1 || 0} items`;

                return (
                  <BlockStack key={offer.id} gap="200">
                    <Text variant="headingMd">Offer {index + 1}</Text>
                    <Text>
                      Goal Type:{" "}
                      {offer.goalType === "amount_cart"
                        ? "Cart Value"
                        : "Product Quantity"}
                    </Text>
                    <Text>Goal: {goal}</Text>
                    <Text>Reward Type: {offer.rewardType}</Text>
                    <Text>Reward Mode: {offer.rewardMode}</Text>
                    {offer.rewardType === "discount" && (
                      <Text>Discount: {rewardDescription}</Text>
                    )}
                    <ProgressBar
                      progress={
                        offer.goalType === "amount_cart"
                          ? parseFloat(offer.goalAmount) > 0
                            ? (50 / parseFloat(offer.goalAmount)) * 100
                            : 0
                          : parseInt(offer.goalquantity) > 0
                            ? (1 / parseInt(offer.goalquantity)) * 100
                            : 0
                      }
                      style={progressBarStyle}
                    />
                    <Text>
                      Before Goal:{" "}
                      {offer.goalTextBefore
                        .replace("{{amount_left}}", amountLeft)
                        .replace("{{reward}}", rewardDescription)
                        .replace("{{goal}}", goal)}
                    </Text>
                    <Text>
                      After Goal:{" "}
                      {offer.goalTextAfter
                        .replace("{{reward}}", rewardDescription)
                        .replace("{{goal}}", goal)}
                    </Text>
                    {offer.rewardProducts?.length > 0 && (
                      <BlockStack gap="200">
                        <Text fontWeight="semibold">Reward Products:</Text>
                        {offer.rewardProducts.map((rp) => (
                          <BlockStack key={rp.id} gap="100">
                            <Thumbnail
                              source={rp.media || ""}
                              alt={rp.title || "Reward Product"}
                            />
                            <Text>{rp.title || "Untitled Product"}</Text>
                            <Text>${rp.price || "0.00"}</Text>
                          </BlockStack>
                        ))}
                      </BlockStack>
                    )}
                    {offer.rewardCollection?.length > 0 && (
                      <BlockStack gap="200">
                        <Text fontWeight="semibold">Reward Collections:</Text>
                        {offer.rewardCollection.map((rc) => (
                          <Text key={rc.id}>
                            {rc.title || "Untitled Collection"}
                          </Text>
                        ))}
                      </BlockStack>
                    )}
                  </BlockStack>
                );
              })}
            </BlockStack>
          </Card>
        )}

        {showConfetti &&
          offers.some((offer) => offer.goalAmount || offer.goalquantity) && (
            <Card sectioned>
              <Text>🎉 Confetti Animation Triggered!</Text>
            </Card>
          )}

        {showLockedGoals && offers.length > 1 && (
          <Card sectioned>
            <Text>Locked Goals: Additional rewards to unlock...</Text>
          </Card>
        )}

        {/* Home Section Preview */}
        {placement.includes("home") && (
          <Card title="Homepage Section Preview" sectioned>
            <HomeSectionPreview
              title={name || "Bundle Deals"}
              backgroundColor="#fff"
              products={products}
              offers={offers}
              showModal={true}
            />
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
