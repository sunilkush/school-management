export  const generateNextRegNumber = (lastReg = "") => {
    const match = lastReg?.match(/(\D+)(\d+)/);
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2]) + 1;
      return `${prefix}${number}`;
    }
    return "REG2025-101";
  };