const fs = require("fs");
const path = require("path");
const docusign = require("docusign-esign");
require("dotenv").config();

async function getAccessToken() {
  const apiClient = new docusign.ApiClient();

  const privateKeyPath = path.resolve(__dirname, process.env.PRIVATE_KEY_PATH);
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  apiClient.setOAuthBasePath("account-d.docusign.com");
  // Step 1: Request JWT token
  const results = await apiClient.requestJWTUserToken(
    process.env.DOCUSIGN_CLIENT_ID,
    process.env.DOCUSIGN_IMPERSONATED_USER_ID,
    "signature",
    privateKey,
    3600
  );

  const accessToken = results.body.access_token;

  // Step 2: Get user info to get base URL and accountId
  const userInfoResults = await apiClient.getUserInfo(accessToken);

  const account = userInfoResults.accounts.find(acc => acc.isDefault);
  const basePath = account.baseUri + "/restapi"; // ← This is correct
  const accountId = account.accountId;

  return { accessToken, basePath, accountId };
}

module.exports = getAccessToken;
