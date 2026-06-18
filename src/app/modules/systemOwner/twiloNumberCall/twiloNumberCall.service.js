import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../../../config/env.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const setupTwilioService = async (payload) => {
  const {
    twilio_sid,
    twilio_auth_token,
    twilio_number,
    transfer_number,
    assistant_id,
  } = payload;

  if (!twilio_sid || !twilio_auth_token || !twilio_number || !transfer_number || !assistant_id) {
    throw new DevBuildError(
      "All fields (twilio_sid, twilio_auth_token, twilio_number, transfer_number, assistant_id) are required",
      StatusCodes.BAD_REQUEST
    );
  }

  const vapiApiKey = envVars.VAPI_API_KEY;
  if (!vapiApiKey) {
    throw new DevBuildError(
      "VAPI_API_KEY is not defined in backend environment variables",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  const vapiHeaders = {
    Authorization: `Bearer ${vapiApiKey}`,
    "Content-Type": "application/json",
  };

  // 1. Fetch assistant details to get existing tools
  let existingToolIds = [];
  try {
    console.log(`[Vapi] Fetching assistant details for assistant_id: ${assistant_id}`);
    const assistantResponse = await axios.get(`https://api.vapi.ai/assistant/${assistant_id}`, {
      headers: vapiHeaders,
    });
    existingToolIds = assistantResponse.data?.toolIds || [];
    console.log(`[Vapi] Current assistant toolIds:`, existingToolIds);
  } catch (error) {
    console.error(
      `[Vapi] Error fetching assistant ${assistant_id}:`,
      error.response?.data || error.message
    );
    throw new DevBuildError(
      `Failed to fetch assistant details from Vapi: ${
        error.response?.data?.message || error.message
      }`,
      error.response?.status || StatusCodes.BAD_REQUEST
    );
  }

  // 2. Create the transferCall tool
  let createdTool = null;
  try {
    console.log(`[Vapi] Creating transferCall tool pointing to: ${transfer_number}`);
    const toolPayload = {
      type: "transferCall",
      destinations: [
        {
          type: "number",
          number: transfer_number,
          message: "Forwarding your call now.",
        },
      ],
      name: `Transfer to ${transfer_number}`,
    };

    const toolResponse = await axios.post(`https://api.vapi.ai/tool`, toolPayload, {
      headers: vapiHeaders,
    });
    createdTool = toolResponse.data;
    console.log(`[Vapi] Created transferCall tool with ID: ${createdTool.id}`);
  } catch (error) {
    console.error(
      `[Vapi] Error creating transferCall tool:`,
      error.response?.data || error.message
    );
    throw new DevBuildError(
      `Failed to create transferCall tool on Vapi: ${
        error.response?.data?.message || error.message
      }`,
      error.response?.status || StatusCodes.BAD_REQUEST
    );
  }

  // 3. Attach the tool to the assistant
  try {
    const updatedToolIds = [...new Set([...existingToolIds, createdTool.id])];
    console.log(
      `[Vapi] Updating assistant ${assistant_id} with new tool list:`,
      updatedToolIds
    );
    await axios.patch(
      `https://api.vapi.ai/assistant/${assistant_id}`,
      { toolIds: updatedToolIds },
      { headers: vapiHeaders }
    );
    console.log(`[Vapi] Assistant tools updated successfully.`);
  } catch (error) {
    console.error(
      `[Vapi] Error updating assistant tools:`,
      error.response?.data || error.message
    );
    throw new DevBuildError(
      `Failed to attach transferCall tool to assistant: ${
        error.response?.data?.message || error.message
      }`,
      error.response?.status || StatusCodes.BAD_REQUEST
    );
  }

  // 4. Import/setup Twilio number
  let importedPhoneNumber = null;
  try {
    console.log(`[Vapi] Importing Twilio number ${twilio_number} to Vapi...`);
    const phoneNumberPayload = {
      provider: "twilio",
      number: twilio_number,
      twilioAccountSid: twilio_sid,
      twilioAuthToken: twilio_auth_token,
      assistantId: assistant_id,
      name: `Twilio ${twilio_number}`,
    };

    const phoneResponse = await axios.post(`https://api.vapi.ai/phone-number`, phoneNumberPayload, {
      headers: vapiHeaders,
    });
    importedPhoneNumber = phoneResponse.data;
    console.log(`[Vapi] Twilio number imported successfully. ID: ${importedPhoneNumber.id}`);
  } catch (error) {
    console.error(
      `[Vapi] Error importing Twilio number:`,
      error.response?.data || error.message
    );

    const errMsg = error.response?.data?.message || "";
    const isConflict =
      errMsg.toLowerCase().includes("already exists") ||
      errMsg.toLowerCase().includes("conflict") ||
      error.response?.status === 409;

    if (isConflict) {
      console.log(`[Vapi] Phone number might already exist. Attempting to locate and update it...`);
      try {
        const listResponse = await axios.get(`https://api.vapi.ai/phone-number`, {
          headers: vapiHeaders,
        });
        const numbers = listResponse.data || [];
        const matchedNumber = numbers.find((n) => n.number === twilio_number);
        if (matchedNumber) {
          console.log(
            `[Vapi] Found existing phone number with ID: ${matchedNumber.id}. Binding to assistant...`
          );
          const patchResponse = await axios.patch(
            `https://api.vapi.ai/phone-number/${matchedNumber.id}`,
            { assistantId: assistant_id },
            { headers: vapiHeaders }
          );
          importedPhoneNumber = patchResponse.data;
          console.log(`[Vapi] Existing phone number successfully bound to assistant.`);
        } else {
          throw error;
        }
      } catch (fallbackError) {
        console.error(
          `[Vapi] Fallback failed:`,
          fallbackError.response?.data || fallbackError.message
        );
        throw new DevBuildError(
          `Failed to setup Twilio number (conflict, fallback failed): ${
            error.response?.data?.message || error.message
          }`,
          error.response?.status || StatusCodes.BAD_REQUEST
        );
      }
    } else {
      throw new DevBuildError(
        `Failed to import Twilio number: ${error.response?.data?.message || error.message}`,
        error.response?.status || StatusCodes.BAD_REQUEST
      );
    }
  }

  return {
    success: true,
    message: "Twilio number setup and transfer routing configured successfully",
    data: {
      tool: createdTool,
      phoneNumber: importedPhoneNumber,
    },
  };
};

export const TwiloNumberCallService = {
  setupTwilioService,
};
