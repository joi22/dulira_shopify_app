import { useEffect, useState } from "react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
  const steps = [
    { id: "create-account", label: "Create Account" },
    { id: "activate-trial", label: "Activate Free Trial" },
    { id: "connect-store", label: "Connect Store" },
    { id: "go-live", label: "Go Live" },
  ];

  const handleOpenStep = (index = 0) => {
    setCurrentStep(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setIsModalOpen(false);
  };

  const handleStepClick = (index) => {
    handleOpenStep(index);
  };

  const handleCreateAccountSubmit = (event) => {
    event.preventDefault();
    handleNextStep();
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "create-account":
        return (
          <form className="step-form" onSubmit={handleCreateAccountSubmit}>
            <label className="step-label">
              Enter Store Name
              <input type="text" placeholder="Store Name" required />
            </label>
            <label className="step-label">
              Enter Email
              <input type="email" placeholder="Email" required />
            </label>
            <label className="step-label">
              Enter Password
              <input type="password" placeholder="Password" required />
            </label>
            <label className="step-label">
              Enter the same password
              <input
                type="password"
                placeholder="Password"
                required
                autoComplete="new-password"
              />
            </label>
            <label className="step-checkbox">
              <input type="checkbox" required />
              <span>I agree to Dukira&apos;s Terms and Privacy Policy.</span>
            </label>
            <div className="modal-actions">
              <button type="submit" className="primary-action">
                Get Started
              </button>
            </div>
          </form>
        );
      case "activate-trial":
        return (
          <div className="step-content">
            <p>
              Kick off your 14-day free trial to explore AI try-on features with
              no commitment. You can cancel anytime in the billing settings.
            </p>
            <ul className="step-list">
              <li>Unlimited product previews</li>
              <li>Access to analytics dashboard</li>
              <li>Email reminders before trial ends</li>
            </ul>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-action"
                onClick={handleNextStep}
              >
                Activate Trial
              </button>
            </div>
          </div>
        );
      case "connect-store":
        return (
          <div className="step-content">
            <p>
              Connect your Shopify store so we can sync products and inventory
              in real time. You will be asked to approve the permissions
              required for Dukira to manage the try-on experience.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-action"
                onClick={handleNextStep}
              >
                Connect Store
              </button>
            </div>
          </div>
        );
      case "go-live":
        return (
          <div className="step-content">
            <p>
              You are all set! Review your onboarding summary and publish the
              experience when you are ready.
            </p>
            <ul className="step-list">
              <li>Products synced successfully</li>
              <li>Virtual try-on scene configured</li>
              <li>Team notified of launch</li>
            </ul>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-action"
                onClick={handleCloseModal}
              >
                Finish &amp; Go Live
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Page fullWidth>
      <div className="setup-container" style={{background:"url('/images/well1.png') no-repeat center/cover"}}>
        <div className="setup-box">
          <div className="setup-left">
            <img src="../../public/images/log.png" alt="Dukira Logo" className="logo" />
            <h1 style={{fontWeight: "bold" , fontSize:"30px" ,marginBottom:"10px"}}>Hello</h1>
            <h2 style={{fontWeight: "bold" , fontSize:"30px" ,marginBottom:"10px"}}>Welcome To Dukira</h2>
            <p className="desc" style={{fontSize:"15px" , marginBottom:"10px", fontWeight:"400"}}>
              Let’s get your Try-On system set up. <br />
            </p>
            <p className="desc" style={{fontSize:"12px" ,color:"#00A962", marginBottom:"10px", fontWeight:"400"}}>
            Transform your store with AI-powered virtual try-on – set up in just a few minutes.
            </p>

            <div className="tryon-images">
                <img width={"250px"} src="./images/pic1.png" alt="Glasses" />
                {/* <p>Glasses</p> */}
              
              {/* <div className="card">
                <img src="/tryon2.png" alt="Accessories" />
                <p>Accessories</p>
              </div> */}
            </div>
          </div>

          <div className="setup-right">
            <div className="steps">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  className={`step ${index === currentStep ? "active" : ""}`}
                  onClick={() => handleStepClick(index)}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <button
              className="get-started"
              type="button"
              onClick={() => handleOpenStep(0)}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div
          className="step-modal-overlay"
          role="dialog"
          aria-labelledby="step-modal-title"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div
            className="step-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-illustration">
              <img src="/images/pic1.png" alt="" />
            </div>
            <div className="modal-body">
              <div className="modal-progress">
                Step {currentStep + 1} of {steps.length}
              </div>
              <h2 id="step-modal-title">{steps[currentStep].label}</h2>
              {renderStepContent()}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
