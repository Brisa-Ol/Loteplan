

export const extractAndValidateMapUrl = (value:string) => {
if(!value) return value;

    let urlStr = value.trim()

    //detecta si es iframe
    if (value.includes("<iframe")) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(value, "text/html");
		const iframe = doc.querySelector("iframe");

		if (!iframe) {
			throw new Error("Iframe inválido");
		}

		const src = iframe.getAttribute("src");
		if (!src) {
			throw new Error("El iframe no tiene src");
		}

		urlStr = src;
	}

    //validar url
    let url: URL;
	try {
		url = new URL(urlStr);
	} catch {
		throw new Error("URL inválida");
	}

	// Seguridad estricta
	if (url.protocol !== "https:") {
		throw new Error("Debe usar HTTPS");
	}

	if (url.hostname !== "www.google.com") {
		throw new Error("Solo se permiten mapas de Google Maps");
	}

	if (!url.pathname.startsWith("/maps/embed")) {
		throw new Error("Debe ser una URL de tipo embed");
	}

	return urlStr;
}