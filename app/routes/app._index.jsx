import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import './_index/start.css'
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <div className="setup-container">
        <div className="setup-box">
          <div className="setup-left">
            <img src="/dukiralogo.png" alt="Dukira Logo" className="logo" />
            <h1>Hello</h1>
            <h2>Welcome To Dukira</h2>
            <p className="desc">
              Let’s get your Try-On system set up. <br />
              Transform your store with AI-powered virtual try-on – set up in just a few minutes.
            </p>

            <div className="tryon-images">
              <div className="card">
                <img src="/tryon1.png" alt="Glasses" />
                <p>Glasses</p>
              </div>
              <div className="card">
                <img src="/tryon2.png" alt="Accessories" />
                <p>Accessories</p>
              </div>
            </div>
          </div>

          <div className="setup-right">
            <div className="steps">
              <div className="step active">Create Account</div>
              <div className="step">Activate Free Trial</div>
              <div className="step">Connect Store</div>
              <div className="step">Go Live</div>
            </div>

            <button className="get-started">Get Started</button>

            <div className="support-links">
              <Link to="#">Help</Link>
              <span> | </span>
              <Link to="#">Contact Support</Link>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
