import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const sqs = new AWS.SQS();

const sendToSQS = async (payload) => {
  try {
    const params = {
      QueueUrl: process.env.SQS_URL,
      MessageBody: JSON.stringify(payload),
    };
    return sqs.sendMessage(params).promise();
  } catch (err) {
    throw new Error("Failed to send message to SQS reason -->" + err.message);
  }
};
export { sendToSQS };
