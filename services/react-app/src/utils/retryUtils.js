/**
 * Retries an async operation with exponential backoff.
 * 
 * @param {Function} fn - The async function to retry.
 * @param {number} retries - Number of retries (default: 3).
 * @param {number} delay - Initial delay in ms (default: 1000).
 * @returns {Promise<any>} - The result of the async function.
 */
export const retryOperation = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;

        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry with one less attempt and double the delay (exponential backoff)
        return retryOperation(fn, retries - 1, delay * 2);
    }
};
