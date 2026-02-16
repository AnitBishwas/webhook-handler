import { WebhookTaskError } from "./helpers.js";
import { sendToSQS } from "../aws/sqs/index.js";
import { sendWebhookFailureEventToDynamoDb } from "../aws/dynamoDB/index.js";

/**
 * List of topics
 * ["ORDER_REFUND","CASHBACK_REFUND"]
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order pyaload
 */
const mapOrderRefundWebhook = async (shop, payload) => {
  try {
    console.log("order refund was triggered");
    const results = await Promise.allSettled([
      sendOrderRefundfEventToSQS(shop, payload),
      sendCashbackRefundEventToSQS(shop, payload),
    ]);
    results.forEach(async (result, index) => {
      if (result.status === "rejected") {
        const failedWebhook = await sendWebhookFailureEventToDynamoDb({
          orderId: result.reason.orderId,
          topic: result.reason.topic,
          result,
        });
        console.error(`Failed to handle topic ${result.reason.topic}`);
      }
    });
    return results;
  } catch (err) {
    console.log("Failed to map order cancel webhook reason -->" + err.message);
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendOrderRefundfEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "ORDER_REFUND",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send order cancel event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "ORDER_REFUND",
    });
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendCashbackRefundEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    const checkIfCashbackRefundWasMade =
      payload.transactions.find(
        (el) => el.kind == "refund" && el.gateway == "Cashback"
      ) || process.env.NODE_ENV == "dev";
    if (checkIfCashbackRefundWasMade) {
      return await sendToSQS({
        topic: "CASHBACK_REFUND",
        shop,
        ...payload,
      });
    }
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send cashback refund event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "CASHBACK_REFUND",
    });
  }
};

export { mapOrderRefundWebhook };
