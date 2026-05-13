export const formatDateTime = (dateString?: string | null): string => {
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

// NUEVA FUNCIÓN: Exclusiva para <input type="date">
export const formatForDateInput = (dateString?: string | Date | null): string => {
    if (!dateString) return '';

    // Si ya es un string (ej. "2026-05-13T03:00:00.000Z" o "2026-05-13")
    if (typeof dateString === 'string') {
        // Cortamos y devolvemos solo los primeros 10 caracteres "YYYY-MM-DD". 
        // Esto evita por completo cualquier cálculo de zona horaria que haga JavaScript.
        return dateString.substring(0, 10);
    }

    // Si por algún motivo es un objeto Date real, lo forzamos a formato YYYY-MM-DD
    const year = dateString.getFullYear();
    const month = String(dateString.getMonth() + 1).padStart(2, '0');
    const day = String(dateString.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};