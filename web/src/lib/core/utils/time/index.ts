export function wait(seconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, seconds * 1000);
	});
}
export function waitForCondition(
	condition: () => boolean,
	options: {timeoutInSeconds: number; intervalInSeconds: number},
): Promise<void> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		const interval = setInterval(() => {
			if (condition()) {
				clearInterval(interval);
				resolve();
			} else if (Date.now() - startTime > options.timeoutInSeconds * 1000) {
				clearInterval(interval);
				reject(new Error('Condition not met within timeout'));
			}
		}, options.intervalInSeconds * 1000);
	});
}
