const STORAGE_KEY = 'lineflow-queue-v2';
const queueData = window.LINEFLOW_QUEUE_DATA;
const fallbackState = {
	queue: queueData.initialQueue.map(person => ({ ...person })),
	windows: queueData.defaultWindows.map(window => ({ ...window })),
	revision: 0
};

let state;
let renderedRevision = 0;

const getElement = id => document.getElementById(id);

function readState() {
	const storedState = localStorage.getItem(STORAGE_KEY);

	if (!storedState) {
		return fallbackState;
	}

	const nextState = JSON.parse(storedState);

	return {
		...nextState,
		windows: nextState.windows || queueData.defaultWindows
	};
}

function renderWindows() {
	getElement('windowGrid').innerHTML = state.windows
		.map(window => {
			const status = window.status || (window.ticket ? 'Serving' : 'Available');
			const statusClass = status.toLowerCase().replace(' ', '-');
			const visitorLabel = window.name || getVisitorLabel(status);

			return `
				<article class="window-card ${status === 'Available' ? 'available' : 'active'} status-${statusClass}">
					<div class="window-top">
						<span>Window ${window.number}</span>
						<span class="window-status">${status}</span>
					</div>
					<div class="window-ticket">${window.ticket || '—'}</div>
					<div class="window-name">${visitorLabel}</div>
				</article>
			`;
		})
		.join('');
}

function getVisitorLabel(status) {
	const labels = {
		Available: 'Ready for next visitor',
		Busy: 'Currently assisting a visitor',
		'On break': 'Temporarily unavailable',
		Closed: 'Window closed'
	};

	return labels[status] || 'Ready for next visitor';
}

function renderQueue() {
	getElement('waitingCount').textContent = `${String(state.queue.length).padStart(2, '0')} waiting`;

	if (!state.queue.length) {
		getElement('ticketList').innerHTML = `
			<div class="empty-message">
				The queue is clear. Please approach the front desk for assistance.
			</div>
		`;
		return;
	}

	getElement('ticketList').innerHTML = state.queue
		.slice(0, 8)
		.map(person => `<div class="ticket">${person.ticket}</div>`)
		.join('');
}

function render() {
	renderWindows();
	renderQueue();
	renderedRevision = state.revision;
}

function refreshIfUpdated() {
	const nextState = readState();

	if (nextState.revision > renderedRevision) {
		state = nextState;
		render();
	}

	const currentTime = new Date().toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});

	getElement('syncStatus').textContent = `Live · ${currentTime}`;
}

function updateClock() {
	const now = new Date();

	getElement('clockTime').textContent = now.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
	getElement('clockDate').textContent = now.toLocaleDateString([], {
		weekday: 'long',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

state = readState();
render();
updateClock();

setInterval(refreshIfUpdated, 2000);
setInterval(updateClock, 1000);
