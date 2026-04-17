export const  formatDateTime = (dateString?: string | null): string => {
	if (!dateString) return '--';

	return new Intl.DateTimeFormat('es-AR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(new Date(dateString));
};