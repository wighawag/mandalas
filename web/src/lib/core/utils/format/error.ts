/**
 * Turn an unknown thrown value into a message safe to render in the UI.
 * Errors caught in stores are typed `unknown`, and rendering them directly
 * yields "[object Object]" for anything that is not already a string.
 */
export function formatError(error: unknown): string {
	if (error === undefined || error === null) {
		return '';
	}
	if (typeof error === 'string') {
		return error;
	}
	if (error instanceof Error) {
		return error.message || error.name;
	}
	if (typeof error === 'object') {
		const message = (error as {message?: unknown}).message;
		if (typeof message === 'string' && message.length > 0) {
			return message;
		}
		try {
			return JSON.stringify(error);
		} catch {
			return String(error);
		}
	}
	return String(error);
}
