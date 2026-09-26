export function getLastDigit(quote) {
  const text = String(quote);

  const digits = text.replace(/\D/g, "");

  if (!digits.length) return null;

  return Number(digits[digits.length - 1]);
}

export function calculateProbabilities(digits) {
  const counts = Array(10).fill(0);

  for (const digit of digits) {
    if (Number.isInteger(digit) && digit >= 0 && digit <= 9) {
      counts[digit]++;
    }
  }

  const total = digits.length;

  if (!total) {
    return Array(10).fill(10);
  }

  return counts.map((count) => (count / total) * 100);
}

export function getPrediction(probabilities) {
  let bestDigit = 0;

  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[bestDigit]) {
      bestDigit = i;
    }
  }

  return {
    digit: bestDigit,
    probability: probabilities[bestDigit]
  };
}

export function getCounts(digits) {
  const counts = Array(10).fill(0);

  for (const digit of digits) {
    if (Number.isInteger(digit) && digit >= 0 && digit <= 9) {
      counts[digit]++;
    }
  }

  return counts;
}
