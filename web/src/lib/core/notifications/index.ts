import {pushState} from '$app/navigation';
import {page} from '$app/state';
import {get, writable} from 'svelte/store';
type JSONNotification = {
	title: string;
	options: NotificationOptions;
};

export type PushNotification = {
	type: 'push-notification';
	data: JSONNotification;
};
export type NotificationToAdd = PushNotification;

export type Notification = NotificationToAdd & {id: number};

export function createNotificationsService() {
	let lastId = 1;
	const store = writable<Notification[]>([]);

	function add(notification: NotificationToAdd) {
		store.update((notifications) => [
			...notifications,
			{...notification, id: ++lastId},
		]);
	}

	function remove(id: number) {
		store.update((notifications) =>
			notifications.filter((notification) => notification.id !== id),
		);
	}

	function onClick(id: number) {
		const notification = get(store).find((v) => v.id == id);
		remove(id);
		if (notification?.type === 'push-notification') {
			if (notification.data.options.data?.navigate) {
				pushState(notification.data.options.data.navigate, page.state);
			}
		}
	}
	return {subscribe: store.subscribe, add, remove, onClick};
}

export const notifications = createNotificationsService();
