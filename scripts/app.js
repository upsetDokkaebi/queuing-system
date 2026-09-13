const STORAGE_KEY = 'lineflow-queue-v2';
const queueData = window.LINEFLOW_QUEUE_DATA;
const defaultWindows = queueData.defaultWindows;
const defaultState = {
	queue: queueData.initialQueue,
	served: queueData.servedAtStart,
	revision: 1,
	windows: defaultWindows
};

const storedState = localStorage.getItem(STORAGE_KEY);
let state = storedState ? JSON.parse(storedState) : defaultState;
let syncTimer;
const THEME_KEY = 'lineflow-dashboard-theme';

state.queue = window.LineflowWaitTime.initializeQueue(state.queue);

if (!state.windows) {
	state.windows = defaultWindows;
}

if (!storedState) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const getElement = id => document.getElementById(id);
const getInitials = name => name
	.split(' ')
	.map(word => word[0])
	.join('')
	.slice(0, 2);

function saveState() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyTheme(isDark) {
	document.body.classList.toggle('dark-mode', isDark);
	getElement('themeToggle').setAttribute('aria-pressed', String(isDark));
	getElement('themeIcon').textContent = isDark ? '☀' : '☾';
	getElement('themeLabel').textContent = isDark ? 'Light mode' : 'Dark mode';
}

function toggleTheme() {
	const isDark = !document.body.classList.contains('dark-mode');

	localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
	applyTheme(isDark);
}

function openDashboard(account) {
	const selectedWindow = Number(account.window);

	getElement('loginScreen').hidden = true;
	getElement('dashboard').hidden = false;
	getElement('accountAvatar').textContent = account.name
		.split(' ')
		.map(word => word[0])
		.join('');
	getElement('accountWindow').textContent = `Window ${String(selectedWindow).padStart(2, '0')}`;
	const currentHour = new Date().getHours();
	const greeting = currentHour < 12
		? 'Good morning'
		: currentHour < 18
			? 'Good afternoon'
			: 'Good evening';
	getElement('dashboardGreeting').textContent = `${greeting}, ${account.name}.`;
	getElement('dashboardDate').textContent = new Date().toLocaleDateString([], {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
	updateServingPanel();
}

function getSignedInWindow() {
	const account = JSON.parse(sessionStorage.getItem('lineflow-account'));

	return state.windows.find(window => window.number === Number(account.window));
}

function updateServingPanel() {
	const activeWindow = getSignedInWindow();

	getElement('statusSelect').value = activeWindow?.status || 'Available';
	getElement('servingNumber').textContent = activeWindow?.ticket || '—';
	getElement('servingName').textContent = activeWindow?.name || 'No visitor assigned';
}

function renderQueue() {
	getElement('waitingCount').textContent = String(state.queue.length).padStart(2, '0');
	getElement('servedCount').textContent = state.served;
	getElement('queueMeta').textContent = `${state.queue.length} visitor${state.queue.length === 1 ? '' : 's'} waiting`;
	getElement('emptyState').hidden = state.queue.length !== 0;

	getElement('queueBody').innerHTML = state.queue
		.map((person, index) => `
			<tr>
				<td>${person.ticket}</td>
				<td>
					<div class="visitor">
						<span class="avatar">${getInitials(person.name)}</span>
						${person.name}
					</div>
				</td>
				<td>${person.service}</td>
				<td>${window.LineflowWaitTime.format(person)}</td>
				<td><span class="status ${index > 5 ? 'waiting' : ''}">${person.status}</span></td>
				<td><button class="row-action" data-ticket="${person.ticket}">Call</button></td>
			</tr>
		`)
		.join('');
}

function render() {
	renderQueue();
}

function markSyncing() {
	getElement('syncDot').classList.add('syncing');
	getElement('syncLabel').textContent = 'Checking…';
}

function markSynced() {
	getElement('syncDot').classList.remove('syncing');
	getElement('syncLabel').textContent = 'Live · just now';
}

function showToast(message) {
	const toast = getElement('toast');

	toast.textContent = message;
	toast.classList.add('visible');
	clearTimeout(syncTimer);
	syncTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

// Update the shared state first, then check whether a newer revision exists.
async function triggerUpdate(change) {
	markSyncing();
	state = {
		...state,
		...change,
		revision: state.revision + 1
	};

	saveState();
	render();
	await refreshIfUpdated();
}

async function refreshIfUpdated() {
	const remoteSnapshot = localStorage.getItem(STORAGE_KEY);

	if (remoteSnapshot) {
		const remoteState = JSON.parse(remoteSnapshot);

		if (remoteState.revision > state.revision) {
			state = remoteState;
			render();
		}
	}

	markSynced();
}

function callVisitor(ticket) {
	const next = state.queue.find(person => person.ticket === ticket);

	if (!next) {
		showToast('That visitor is no longer waiting');
		return;
	}

	const remaining = state.queue.filter(person => person.ticket !== ticket);
	const account = JSON.parse(sessionStorage.getItem('lineflow-account'));
	const activeWindow = Number(account.window);
	const windows = state.windows.map(window => {
		if (window.number !== activeWindow) {
			return window;
		}

		return {
			...window,
			ticket: next.ticket,
			name: next.name,
			status: 'Serving'
		};
	});

	triggerUpdate({
		queue: remaining,
		served: state.served + 1,
		windows
	});

	updateServingPanel();
	showToast(`${next.ticket} is now being served at Window ${activeWindow}`);
}

function callNextVisitor() {
	if (!state.queue.length) {
		showToast('The queue is already clear');
		return;
	}

	callVisitor(state.queue[0].ticket);
}

function updateWindowStatus(event) {
	const account = JSON.parse(sessionStorage.getItem('lineflow-account'));
	const selectedWindow = Number(account.window);
	const windows = state.windows.map(window => {
		if (window.number !== selectedWindow) {
			return window;
		}

		return {
			...window,
			status: event.target.value
		};
	});

	triggerUpdate({ windows });
	updateServingPanel();
	showToast(`Window ${String(selectedWindow).padStart(2, '0')} is now ${event.target.value}`);
}

function clearServingNumber() {
	const account = JSON.parse(sessionStorage.getItem('lineflow-account'));
	const selectedWindow = Number(account.window);
	const windows = state.windows.map(window => {
		if (window.number !== selectedWindow) {
			return window;
		}

		return {
			...window,
			ticket: '',
			name: ''
		};
	});

	triggerUpdate({ windows });
	updateServingPanel();
	showToast(`Serving number cleared at Window ${String(selectedWindow).padStart(2, '0')}`);
}

function resetQueue() {
	const confirmed = window.confirm(
		'Reset the queue? This will remove all waiting visitors and restore the starting queue.'
	);

	if (!confirmed) {
		return;
	}

	state = {
		...defaultState,
		queue: window.LineflowWaitTime.initializeQueue(
			defaultState.queue.map(person => ({ ...person }))
		),
		windows: defaultState.windows.map(window => ({ ...window })),
		revision: state.revision + 1
	};

	saveState();
	render();
	updateServingPanel();
	showToast('Queue reset to the starting state');
}

function selectVisitor(event) {
	const ticket = event.target.dataset.ticket;

	if (!ticket) {
		return;
	}

	callVisitor(ticket);
}

window.addEventListener('lineflow:authenticated', event => {
	openDashboard(event.detail);
});
window.addEventListener('lineflow:signed-out', () => {
	getElement('dashboard').hidden = true;
	getElement('loginScreen').hidden = false;
});

getElement('themeToggle').addEventListener('click', toggleTheme);

const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme) {
	applyTheme(savedTheme === 'dark');
}

getElement('nextBtn').addEventListener('click', callNextVisitor);
getElement('resetBtn').addEventListener('click', resetQueue);
getElement('statusSelect').addEventListener('change', updateWindowStatus);
getElement('clearServingBtn').addEventListener('click', clearServingNumber);
getElement('queueBody').addEventListener('click', selectVisitor);

setInterval(refreshIfUpdated, 5000);
setInterval(() => {
	renderQueue();
	saveState();
}, 60000);

render();

const storedAccount = sessionStorage.getItem('lineflow-account');

if (storedAccount) {
	openDashboard(JSON.parse(storedAccount));
}
