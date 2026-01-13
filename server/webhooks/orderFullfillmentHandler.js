/**
 * @typedef { import("../../_developer/types/2025-04/webhooks.js").ORDERS_CREATE } webhookTopic
 */
/**
 * SQS event payload
 * topic - [ORDER_CREATE]
 */

import { mapFulfillmentUpdateWebhook } from "../controllers/fulfillmentUpdate.js";

const orderFullFillmentHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  try {
    await mapFulfillmentUpdateWebhook(shop, {...webhookBody,shop});
  } catch (err) {
    console.log(err.message);
  }
};

export default orderFullFillmentHandler;
