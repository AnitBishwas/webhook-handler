import { mapOrderCreateWebhook } from "../controllers/orderCreate.js";

/**
 * @typedef { import("../../_developer/types/2025-04/webhooks.js").ORDERS_CREATE } webhookTopic
 */
/**
 * SQS event payload
 * topic - [ORDER_CREATE]
 */

const orderCreateHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  try {
    await mapOrderCreateWebhook(shop, { ...webhookBody, shop });
  } catch (err) {
    console.log(err.message);
  }
};

export default orderCreateHandler;
