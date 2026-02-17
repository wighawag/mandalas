export function onDocumentLoaded(callback: () => void) {
	if (typeof document !== 'undefined') {
		if (
			(document as any).readyState === 'ready' ||
			document.readyState === 'interactive' ||
			document.readyState === 'complete'
		) {
			callback();
		} else {
			document.addEventListener(
				'load',
				function () {
					callback();
				},
				{
					once: true,
				},
			);
		}
	}
}
