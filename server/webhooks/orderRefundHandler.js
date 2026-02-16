import { mapOrderRefundWebhook } from "../controllers/orderRefund.js";

/**
 * @typedef { import("../../_developer/types/2025-04/webhooks.js").ORDERS_CREATE } webhookTopic
 */
/**
 * SQS event payload
 * topic - [ORDER_REFUND,CASHBACK_REFUND]
 */

const orderRefundHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  try {
    console.log("order refund webhook triggered");
    await mapOrderRefundWebhook(shop, { ...webhookBody, shop });
  } catch (err) {
    console.log(err.message);
  }
};

export default orderRefundHandler;
