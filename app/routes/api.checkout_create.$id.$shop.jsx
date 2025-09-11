import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request,params }) => {
  const { variantId, shop } = params;
  const Body = await request.json();
  console.log(Body,"<<<<<<<<< +============ ")

  // Get offline token from DB
  const session = await prisma.session.findFirst({ where: { shop } });
  if (!session?.accessToken) {
    return json({ error: "No access token for shop" }, { status: 401 });
  }

  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const res = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          lineItems: [
            {
              variantId: `gid://shopify/ProductVariant/${variantId}`,
              quantity: 1,
            },
          ],
        },
      },
    }),
  });

  const data = await res.json();

  return json(data.data.checkoutCreate, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

// Optional: handle CORS preflight
export const loader = async () =>
  json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });


// export async function action({ request, params }) {
//   try {
//     const { admin } = await authenticate.admin(request);

//     const { variantId, shop } = params;
//     console.log(variantId, shop, "======>>>>")
//     const mutation = `
//       mutation checkoutCreate($variantId: ID!) {
//         checkoutCreate(input: {
//           lineItems: [{ variantId: $variantId, quantity: 1 }]
//         }) {
//           checkout {
//             id
//             webUrl
//           }
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `;

//     const response = await admin.graphql(mutation, {
//       variables: { variantId },
//     });

//     const data = await response.json();

//     const checkout = data?.data?.checkoutCreate?.checkout;
//     const errors = data?.data?.checkoutCreate?.userErrors;

//     if (errors?.length) {
//       return json({ errors }, { status: 400 });
//     }

//     return json({ webUrl: checkout?.webUrl });
//   } catch (err) {
//     console.error("Checkout create error", err);
//     return json({ error: "Failed to create checkout" }, { status: 500 });
//   }
// }
