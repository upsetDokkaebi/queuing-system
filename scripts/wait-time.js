window.LineflowWaitTime = {
	initializeQueue(queue) {
		const now = Date.now();

		return queue.map(person => {
			if (person.joinedAt) {
				return person;
			}

			const previousMinutes = this.parseMinutes(person.wait);

			return {
				...person,
				joinedAt: now - (previousMinutes * 60 * 1000)
			};
		});
	},

	parseMinutes(waitLabel) {
		const minutes = Number.parseInt(waitLabel, 10);

		return Number.isNaN(minutes) ? 0 : minutes;
	},

	format(person) {
		const elapsedMilliseconds = Math.max(0, Date.now() - person.joinedAt);
		const elapsedMinutes = Math.floor(elapsedMilliseconds / (60 * 1000));

		return `${String(elapsedMinutes).padStart(2, '0')} min`;
	}
};
