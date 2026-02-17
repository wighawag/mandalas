export function extractedPromise<T>() {
	let resolve: (v: T) => void = () => {};
	let reject: (v: unknown) => void = () => {};
	const promise = new Promise<T>((a, b) => {
		resolve = a;
		reject = b;
	});

	return {
		promise,
		resolve,
		reject,
	};
}
