// utils/generateRegNumber.js
export const generateNextRegNumber = (lastRegNumber) => {
  if (!lastRegNumber) {
    return "REG0001"; // Start sequence if no students exist
  }

  // Extract numeric part (remove prefix e.g., "REG")
  const numberPart = parseInt(lastRegNumber.replace("REG", "")) || 0;

  // Increment and pad with leading zeros
  const nextNumber = (numberPart + 1).toString().padStart(5, "0");

  return `REG${nextNumber}`;
};
