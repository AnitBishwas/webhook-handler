import { LogSeverity, shopifyApi } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";
import "dotenv/config";
import appUninstallHandler from "../server/webhooks/app_uninstalled.js";
import orderCreateHandler from "../server/webhooks/orderCreateHandler.js";
import orderCancelHandler from "../server/webhooks/orderCancelHandler.js";
import orderFullFillmentHandler from "../server/webhooks/orderFullfillmentHandler.js";
import orderRefundHandler from "../server/webhooks/orderRefundHandler.js";

const isDev = process.env.NODE_ENV === "dev";

// Setup Shopify configuration
let shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_API_SCOPES,
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  hostScheme: "https",
  apiVersion: process.env.SHOPIFY_API_VERSION,
  isEmbeddedApp: true,
  logger: { level: isDev ? LogSeverity.Info : LogSeverity.Error },
});

//Add custom user properties to base shopify obj
shopify = {
  ...shopify,
  user: {
    /**
     * @type {Array<{
     *   topics: import("../_developer/types/webhookTopics.js").WebhookTopics["topic"],
     *   url: string,
     *   callback: Function,
     *   filter?: string,
     *   include_fields?: string[]
     * }>}
     */
    webhooks: [
      {
        topics: ["app/uninstalled"],
        url: "/api/webhooks/app_uninstalled",
        callback: appUninstallHandler,
      },
      {
        topics: ["orders/create"],
        url: "/api/webhooks/order_create",
        callback: orderCreateHandler,
      },
      {
        topics: ["orders/cancelled"],
        url: "/api/webhooks/order_cancel",
        callback: orderCancelHandler,
      },
      {
        topics: ["fulfillments/update"],
        url: "/api/webhooks/fulfillments_update",
        callback: orderFullFillmentHandler,
      },
      {
        topics: ["refunds/create"],
        url: "/api/webhooks/refund_create",
        callback: orderRefundHandler,
      },
    ],

    /**
     * @type {import("../_developer/types/declarative.js").DeclarativeMetafieldDefinition[]}
     */
    metafields: [
      {
        owner_type: "product",
        key: "key_name",
        name: "Last synced",
        description: "This is a description",
        type: "number_integer",
        access: {
          admin: "merchant_read_write",
          customer_account: "read_write",
        },
        capabilities: {
          admin_filterable: true,
          unique_values: false,
        },
        validations: [
          {
            //Docs: https://shopify.dev/docs/apps/build/metafields/list-of-validation-options
            name: "max",
            value: "10",
          },
          {
            name: "min",
            value: "1",
          },
        ],
      },
    ],
    /**
     * @type {import("../_developer/types/declarative.js").DeclarativeMetaobjectDefinition[]}
     */
    metaobjects: [
      //Support is coming soon.
    ],
  },
};

export default shopify;
