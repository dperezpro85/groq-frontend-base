/**
 * Obtiene los datos del clima actual para una ciudad específica
 * @param {object} params - Parámetros de la función
 * @param {string} params.city - Nombre de la ciudad
 * @returns {Promise<object>} Datos del clima
 * @throws {Error} Si hay un problema con la petición
 */
export const getCurrentWeather = async ({ city }: { city: string }): Promise<any> => {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
        throw new Error('API_KEY no está configurada en las variables de entorno');
    }

    if (!city || city.trim() === '') {
        throw new Error('Se requiere un nombre de ciudad válido');
    }

    try {
        // Construir URL con codificación para caracteres especiales
        const encodedCity = encodeURIComponent(city);
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${API_KEY}&units=metric`;

        // Realizar la petición con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10 * 1000); // 10 segundos de timeout

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        // Limpiar el timeout
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);

            if (response.status === 404) {
                throw new Error(`Ciudad "${city}" no encontrada`);
            } else if (response.status === 401) {
                throw new Error('API key inválida o no autorizada');
            } else {
                throw new Error(
                    errorData?.message ||
                    `Error en la petición: ${response.status} ${response.statusText}`
                );
            }
        }

        // Procesar datos exitosos
        const data = await response.json();
        return {
            success: true,
            city: data.name,
            country: data.sys?.country,
            temperature: data.main?.temp,
            description: data.weather?.[0]?.description,
            humidity: data.main?.humidity,
            windSpeed: data.wind?.speed,
            timestamp: new Date()
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`La petición excedió el tiempo límite para la ciudad "${city}"`);
        }

        // Propagar el error original o crear uno nuevo
        throw error instanceof Error ? error : new Error(String(error));
    }
};