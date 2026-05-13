const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const stringifyObject = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return "Something went wrong";
  }
};

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error) return fallback;

  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean") return String(error);

  if (Array.isArray(error)) {
    const messages = error
      .map((item) => getErrorMessage(item, ""))
      .filter(Boolean);
    return messages.length ? messages.join(", ") : fallback;
  }

  if (isPlainObject(error)) {
    const nestedCandidates = [
      error.response?.data?.message,
      error.response?.data?.error,
      error.data?.message,
      error.data?.error,
      error.message,
      error.error,
      error.errors,
      error.detail,
      error.title,
    ];

    for (const candidate of nestedCandidates) {
      if (candidate) {
        const message = getErrorMessage(candidate, "");
        if (message) return message;
      }
    }

    if (error.status) {
      return `Request failed with status ${error.status}`;
    }

    const serialized = stringifyObject(error);
    return serialized === "{}" ? fallback : serialized;
  }

  return fallback;
};
