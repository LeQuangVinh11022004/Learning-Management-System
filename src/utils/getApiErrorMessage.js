export function getApiErrorMessage(error, fallback) {
  const responseData = error?.response?.data;
  const message =
    responseData?.errors ??
    responseData?.Errors ??
    responseData?.message ??
    responseData?.Message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string") {
    return message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
