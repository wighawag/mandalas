export function handleAutomaticUpdate(
	registration: ServiceWorkerRegistration,
	intervals: {idle: number; checks: number},
): NodeJS.Timeout {
	let lastFocusTime = performance.now();
	function wakeup(evt?: Event) {
		const timePassed = performance.now();
		if (timePassed - lastFocusTime > intervals.idle) {
			registration.update();
		}
		// we reset the time each time we wake up
		// the idea here is that we do not want to bother users while they are actively using the app
		lastFocusTime = timePassed;
	}
	['focus', 'pointerdown'].forEach((evt) =>
		window.addEventListener(evt, wakeup),
	);

	// but we still do not an update every so often
	// TODO improve upon this
	return setInterval(() => registration.update(), intervals.checks);
}

// taken from: https://stackoverflow.com/a/50535316
export function listenForWaitingServiceWorker(
	registration: ServiceWorkerRegistration,
	callback: (reg: ServiceWorkerRegistration) => void,
) {
	function awaitStateChange() {
		if (registration.installing) {
			registration.installing.addEventListener('statechange', function () {
				if (this.state === 'installed') callback(registration);
			});
		}
	}
	if (!registration) {
		return;
	}
	if (registration.waiting) {
		return callback(registration);
	}
	if (registration.installing) {
		awaitStateChange();
	} else {
		registration.addEventListener('updatefound', awaitStateChange);
	}
}
