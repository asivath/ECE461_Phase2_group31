// eslint-disable-next-line @typescript-eslint/no-explicit-any -- To lazy to fix this
export function timeWrapper<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return async function (
    ...args: Parameters<T>
  ): Promise<{ result: ReturnType<T> extends Promise<infer R> ? R : never; time: number }> {
    const start = process.hrtime();
    try {
      const result = await fn(...args);
      const end = process.hrtime(start);
      const time = end[0] + end[1] / 1e9; // Convert to seconds
      const roundedTime = Math.round(time * 1000) / 1000; // Round to three decimal places
      return { result, time: roundedTime };
    } catch (error) {
      const end = process.hrtime(start);
      const time = end[0] + end[1] / 1e9; // Convert to seconds
      const roundedTime = Math.round(time * 1000) / 1000; // Round to three decimal places
      throw { error, time: roundedTime };
    }
  };
}
