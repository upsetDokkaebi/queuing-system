const STORAGE_KEY = 'lineflow-queue-v2';
const REGISTRATION_KEY = 'lineflow-registration';
const defaultWindows = window.LINEFLOW_QUEUE_DATA.defaultWindows;
const registrationForm = document.getElementById('registrationForm');
const registrationPanel = document.getElementById('registrationPanel');
const ticketPanel = document.getElementById('ticketPanel');

let registeredTicket = null;

function readQueueState() {
	const storedState = localStorage.getItem(STORAGE_KEY);

	if (!storedState) {
		return {
			queue: [],
			windows: defaultWindows,
			served: 0,
			revision: 0
		};
	}

	const state = JSON.parse(storedState);

	return {
		...state,
		served: state.served || 0,
		windows: state.windows?.length ? state.windows : defaultWindows
	};
}

function saveQueueState(state) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getNextTicket(state) {
	const queueNumbers = state.queue.map(person => Number(person.ticket.split('-')[1]));
	const windowNumbers = state.windows.map(window => Number(window.ticket?.split('-')[1] || 0));
	const highestNumber = Math.max(0, ...queueNumbers, ...windowNumbers);

	return `A-${String(highestNumber + 1).padStart(3, '0')}`;
}

function registerVisitor(event) {
	event.preventDefault();

	const name = document.getElementById('visitorName').value.trim();
	const service = document.getElementById('visitorService').value;
	const error = document.getElementById('registrationError');

	if (!name || !service) {
		error.textContent = 'Enter your name and choose a service to continue.';
		return;
	}

	const state = readQueueState();
	const ticket = getNextTicket(state);
	const visitor = {
		ticket,
		name,
		service,
		status: 'Waiting',
		joinedAt: Date.now()
	};

	state.queue = [...state.queue, visitor];
	state.windows = state.windows?.length ? state.windows : defaultWindows;
	state.revision = (state.revision || 0) + 1;
	saveQueueState(state);

	registeredTicket = ticket;
	sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify({
		ticket,
		name,
		service
	}));
	displayTicket(visitor);
}

function displayTicket(visitor) {
	registrationPanel.hidden = true;
	ticketPanel.hidden = false;
	document.getElementById('ticketNumber').textContent = visitor.ticket;
	document.getElementById('ticketName').textContent = visitor.name;
	document.getElementById('ticketService').textContent = visitor.service;
	renderTicketState();
}

function renderTicketState() {
	if (!registeredTicket) {
		return;
	}

	const state = readQueueState();
	const waitingVisitor = state.queue.find(person => person.ticket === registeredTicket);
	const calledWindow = state.windows.find(window => window.ticket === registeredTicket);
	const status = document.getElementById('ticketStatus');
	const peopleAhead = document.getElementById('peopleAhead');
	const help = document.getElementById('ticketHelp');

	if (calledWindow) {
		status.textContent = `Proceed to Window ${String(calledWindow.number).padStart(2, '0')}`;
		status.className = 'ticket-status called-state';
		peopleAhead.textContent = '0';
		help.textContent = 'Your number has been called. Please proceed to the window now.';
		return;
	}

	if (!waitingVisitor) {
		status.textContent = 'Service completed';
		status.className = 'ticket-status completed-state';
		peopleAhead.textContent = '0';
		help.textContent = 'This ticket is no longer active.';
		return;
	}

	const visitorIndex = state.queue.findIndex(person => person.ticket === registeredTicket);
	status.textContent = 'Waiting in line';
	status.className = 'ticket-status waiting-state';
	peopleAhead.textContent = visitorIndex;
	help.textContent = 'Please watch this screen. Your ticket will change when you are called.';
}

function startNewRegistration() {
	registeredTicket = null;
	sessionStorage.removeItem(REGISTRATION_KEY);
	registrationForm.reset();
	document.getElementById('registrationError').textContent = '';
	registrationPanel.hidden = false;
	ticketPanel.hidden = true;
}

registrationForm.addEventListener('submit', registerVisitor);
document.getElementById('newRegistrationBtn').addEventListener('click', startNewRegistration);

const storedRegistration = sessionStorage.getItem(REGISTRATION_KEY);

if (storedRegistration) {
	const state = readQueueState();
	let registration;

	try {
		registration = JSON.parse(storedRegistration);
	} catch {
		registration = {
			ticket: storedRegistration
		};
	}

	const visitor = state.queue.find(person => person.ticket === registration.ticket);
	const calledWindow = state.windows.find(window => window.ticket === registration.ticket);

	if (visitor) {
		registeredTicket = registration.ticket;
		displayTicket(visitor);
	} else if (calledWindow && registration.name) {
		registeredTicket = registration.ticket;
		displayTicket({
			ticket: registration.ticket,
			name: registration.name,
			service: registration.service
		});
	}
}

setInterval(renderTicketState, 2000);
