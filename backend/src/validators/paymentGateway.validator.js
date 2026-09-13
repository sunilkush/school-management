import { z } from "zod";
import { GATEWAY_PROVIDERS } from "../services/paymentGateways/providers.js";

const providerParams = z.object({ provider: z.enum(GATEWAY_PROVIDERS) });

export const gatewayProviderSchema = z.object({
  body: z.object({}).passthrough().optional().default({}),
  params: providerParams,
  query: z.object({}).optional().default({}),
});

export const gatewaySaveSchema = z.object({
  body: z.object({
    mode: z.enum(["test", "live"]).default("test"),
    // Field names are checked against the gateway's catalog in the service; unknown keys are ignored.
    credentials: z.record(z.string().max(500).nullable()).default({}),
  }),
  params: providerParams,
  query: z.object({}).optional().default({}),
});
