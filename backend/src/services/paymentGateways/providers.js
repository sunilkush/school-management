/**
 * The online payment gateways a school can use to collect fees, and what each needs to be
 * configured. Kept free of any gateway code so models and validators can import it cheaply.
 *
 * checkout:
 *   "razorpay" / "cashfree" — opened by the gateway's own JS SDK in the browser
 *   "form"                  — the browser POSTs a signed form to the gateway's hosted page
 *   "redirect"              — the browser is sent to a URL the gateway returned
 * Whatever the browser does, a payment only counts once the server has asked the gateway itself.
 */
export const GATEWAY_CATALOG = {
  razorpay: {
    label: "Razorpay",
    checkout: "razorpay",
    usesMode: false,
    docsUrl: "https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/",
    fields: [
      { key: "keyId", label: "Key ID", secret: false, required: true, placeholder: "rzp_live_…" },
      { key: "keySecret", label: "Key Secret", secret: true, required: true },
      { key: "webhookSecret", label: "Webhook Secret", secret: true, required: false, help: "From Razorpay Dashboard → Webhooks. Needed for payment.captured webhooks." },
    ],
  },
  cashfree: {
    label: "Cashfree",
    checkout: "cashfree",
    usesMode: true,
    docsUrl: "https://www.cashfree.com/docs/payments/online/web/redirect",
    fields: [
      { key: "appId", label: "App ID (x-client-id)", secret: false, required: true },
      { key: "secretKey", label: "Secret Key (x-client-secret)", secret: true, required: true },
    ],
  },
  payu: {
    label: "PayU",
    checkout: "form",
    usesMode: true,
    docsUrl: "https://docs.payu.in/docs/prebuilt-checkout-page-integration",
    fields: [
      { key: "merchantKey", label: "Merchant Key", secret: false, required: true },
      { key: "merchantSalt", label: "Merchant Salt (v1)", secret: true, required: true },
    ],
  },
  phonepe: {
    label: "PhonePe",
    checkout: "redirect",
    usesMode: true,
    docsUrl: "https://developer.phonepe.com/v1/reference/pay-api-1",
    fields: [
      { key: "clientId", label: "Client ID", secret: false, required: true },
      { key: "clientVersion", label: "Client Version", secret: false, required: true, placeholder: "1" },
      { key: "clientSecret", label: "Client Secret", secret: true, required: true },
      { key: "webhookUsername", label: "Webhook Username", secret: false, required: false, help: "Set the same username and password in PhonePe Dashboard → Webhooks." },
      { key: "webhookPassword", label: "Webhook Password", secret: true, required: false },
    ],
  },
  paytm: {
    label: "Paytm",
    checkout: "form",
    usesMode: true,
    docsUrl: "https://business.paytm.com/docs/jscheckout-initiate-payment",
    fields: [
      { key: "merchantId", label: "Merchant ID (MID)", secret: false, required: true },
      { key: "merchantKey", label: "Merchant Key", secret: true, required: true },
      { key: "websiteName", label: "Website Name", secret: false, required: true, placeholder: "WEBSTAGING for test, DEFAULT for live" },
    ],
  },
  ccavenue: {
    label: "CCAvenue",
    checkout: "form",
    usesMode: true,
    docsUrl: "https://www.ccavenue.com/",
    fields: [
      { key: "merchantId", label: "Merchant ID", secret: false, required: true },
      { key: "accessCode", label: "Access Code", secret: false, required: true },
      { key: "workingKey", label: "Working Key", secret: true, required: true },
    ],
  },
  easebuzz: {
    label: "Easebuzz",
    checkout: "redirect",
    usesMode: true,
    docsUrl: "https://docs.easebuzz.in/docs/payment-gateway/",
    fields: [
      { key: "merchantKey", label: "Merchant Key", secret: false, required: true },
      { key: "merchantSalt", label: "Salt", secret: true, required: true },
    ],
  },
};

export const GATEWAY_PROVIDERS = Object.keys(GATEWAY_CATALOG);

export const gatewayLabel = (provider) => GATEWAY_CATALOG[provider]?.label || provider;
