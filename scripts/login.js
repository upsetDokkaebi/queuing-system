function authenticateAdmin(event) {
	event.preventDefault();

	const email = document.getElementById('accountEmail').value.trim().toLowerCase();
	const password = document.getElementById('accountPassword').value;
	const windowNumber = document.getElementById('loginWindow').value;
	const loginError = document.getElementById('loginError');
	const account = window.LINEFLOW_ACCOUNTS.find(item => (
		item.email === email &&
		item.password === password
	));

	if (!account || !windowNumber) {
		loginError.textContent = 'Enter a valid admin account and select a service window.';
		return;
	}

	const sessionAccount = {
		name: account.name,
		role: account.role,
		window: Number(windowNumber)
	};

	sessionStorage.setItem('lineflow-account', JSON.stringify(sessionAccount));
	loginError.textContent = '';
	window.dispatchEvent(new CustomEvent('lineflow:authenticated', {
		detail: sessionAccount
	}));
}

function signOutAdmin() {
	sessionStorage.removeItem('lineflow-account');
	document.getElementById('accountPassword').value = '';
	window.dispatchEvent(new Event('lineflow:signed-out'));
}

document.getElementById('loginForm').addEventListener('submit', authenticateAdmin);
document.getElementById('logoutBtn').addEventListener('click', signOutAdmin);
