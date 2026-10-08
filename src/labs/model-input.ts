export function modelInteger(value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(`Choose a whole number from ${min} to ${max}.`);
}
