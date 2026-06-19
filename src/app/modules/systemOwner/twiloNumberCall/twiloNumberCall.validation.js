import { z } from "zod";

const setupTwilioSchema = z.object({
  body: z.object({
    twilio_sid: z.string({
      required_error: "twilio_sid is required",
    }),
    twilio_auth_token: z.string({
      required_error: "twilio_auth_token is required",
    }),
    twilio_number: z.string({
      required_error: "twilio_number is required",
    }),
    transfer_number: z.string({
      required_error: "transfer_number is required",
    }),
    assistant_id: z.string({
      required_error: "assistant_id is required",
    }),
  }),
});

export const TwiloNumberCallValidation = {
  setupTwilioSchema,
};
