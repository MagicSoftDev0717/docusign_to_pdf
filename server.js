const express = require("express");
const bodyParser = require("body-parser");
const docusign = require("docusign-esign");
const getAccessToken = require("./getToken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.post("/api/send-docusign", async (req, res) => {
  try {
    const { accessToken, basePath, accountId } = await getAccessToken();

    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath(basePath); // ← Use base path from token response
    apiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

    const { base64Pdf, recipientName, recipientEmail } = req.body;

    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = "Please sign the contract";
    envelopeDefinition.status = "sent";

    const doc = new docusign.Document();
    doc.documentBase64 = base64Pdf;
    doc.name = "ContractProposal.pdf";
    doc.fileExtension = "pdf";
    doc.documentId = "1";

    const signer = new docusign.Signer();
    signer.email = recipientEmail;
    signer.name = recipientName;
    signer.recipientId = "1";

    const signHere = docusign.SignHere.constructFromObject({
      anchorString: "Artist Signature",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "0",
    });

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    signer.tabs = tabs;

    envelopeDefinition.recipients = new docusign.Recipients();
    envelopeDefinition.recipients.signers = [signer];
    envelopeDefinition.documents = [doc];

    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const result = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });

    res.json({ envelopeId: result.envelopeId });
  } catch (err) {
    console.error("❌ DocuSign Error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "DocuSign error", details: err.response?.data || err.message });
  }
});

app.listen(3000, () => {
  console.log("✔️ Server running on http://localhost:3000");
});
