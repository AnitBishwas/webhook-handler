import clientProvider from "../../utils/clientProvider.js";
import { withRetry } from "./helpers.js";

/**
 * @param {!string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 * @param {!string} orderId - shopify orderId
 */

const checkIfCashbackIsUtilisedForOrder = async (shop, orderId) => {
  try {
    const normalisedOrderId = !(orderId + "").includes("gid")
      ? `gid://shopify/Order/${orderId}`
      : orderId;
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query orderTransaction{
      order(id : "${normalisedOrderId}"){
        transactions(first: 10){
          amountSet{
            presentmentMoney{
              amount
            }
          }
          gateway
        }
      }
    }`;
    const { data, extensions, errors } = await withRetry(() =>
      client.request(query)
    );
    if (errors && errors.length > 0) {
      throw new Error("Failed to make request");
    }
    const isCashbackUtilised = data.order.transactions.find(
      (el) => el.gateway == "cash_on_delivery"
    );
    return isCashbackUtilised;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Failed to check cashback utilisation for the order reason -->" +
        err.message
    );
  }
};

export { checkIfCashbackIsUtilisedForOrder };
