/**
 * API Client para backend FastAPI
 * Conecta con el servicio de procesamiento catastral
 */

export interface BackendParcelaResponse {
    id: string;
    referencia_catastral?: string;
    area: number;
    coordenadas_utm: number[][];
    coordenadas_latlon: number[][];
    interiores_utm: number[][][];
    interiores_latlon: number[][][];
    has_conflict: boolean;
    is_hole: boolean;
    capa_origen?: string;
    nombre_archivo?: string;
}

export interface BackendAnalyzeResponse {
    parcelas: BackendParcelaResponse[];
    num_parcelas: number;
    num_conflictos: number;
    num_huecos: number;
    epsg_utm: string;
    mensaje: string;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

type BackendErrorPayload = {
    error?: string;
    detail?: string;
    requestId?: string;
};

function requestHeaders(contentType = true): Record<string, string> {
    return {
        ...(contentType ? { 'Content-Type': 'application/json' } : {}),
        'X-Request-ID': crypto.randomUUID(),
    };
}

function backendErrorMessage(
    payload: BackendErrorPayload | null,
    fallback: string,
): string {
    const message = payload?.error || payload?.detail || fallback;
    const requestId = payload?.requestId;
    return requestId && /^[A-Za-z0-9._-]{8,100}$/.test(requestId)
        ? `${message} (referencia: ${requestId})`
        : message;
}

async function requestExport(path: string, parcelas: unknown[], epsg: string): Promise<Blob> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 60_000);
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: requestHeaders(),
            body: JSON.stringify({ parcelas, epsg }),
            signal: controller.signal,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => null) as BackendErrorPayload | null;
            throw new Error(backendErrorMessage(
                error,
                `La exportación respondió con HTTP ${response.status}`,
            ));
        }
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('El archivo generado está vacío');
        }
        return blob;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('La exportación ha superado el tiempo de espera');
        }
        throw error;
    } finally {
        globalThis.clearTimeout(timeout);
    }
}

export async function queryCatastro<T>(
    path: string,
    body: Record<string, unknown>,
): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: requestHeaders(),
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const payload = await response.json().catch(() => null) as BackendErrorPayload | T | null;
        if (!response.ok) {
            throw new Error(backendErrorMessage(
                payload as BackendErrorPayload | null,
                `El servicio catastral respondió con HTTP ${response.status}`,
            ));
        }
        return payload as T;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('La consulta al Catastro ha superado el tiempo de espera');
        }
        throw error;
    } finally {
        window.clearTimeout(timeout);
    }
}

/**
 * Llama al backend para analizar un archivo DXF o ZIP (Shapefile)
 */
export async function analyzeWithBackend(file: File, epsg: string = '25830', tipoEntidad: string = 'CP'): Promise<BackendAnalyzeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/analyze?epsg=${epsg}&tipo_entidad=${tipoEntidad}`, {
        method: 'POST',
        headers: requestHeaders(false),
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null) as BackendErrorPayload | null;
        throw new Error(backendErrorMessage(error, `Error HTTP: ${response.status}`));
    }

    return response.json();
}

/**
 * Genera un archivo GML con datos editados
 */
export async function generateGMLWithBackend(parcelas: unknown[], epsg: string = '25830'): Promise<Blob> {
    return requestExport('/generate-gml', parcelas, epsg);
}

/**
 * Genera un archivo KML para visualización en Google Earth
 */
export async function generateKMLWithBackend(parcelas: unknown[], epsg: string = '25830'): Promise<Blob> {
    return requestExport('/generate-kml', parcelas, epsg);
}

/**
 * Genera un archivo KMZ para visualización en Google Earth (comprimido)
 */
export async function generateKMZWithBackend(parcelas: unknown[], epsg: string = '25830'): Promise<Blob> {
    return requestExport('/generate-kmz', parcelas, epsg);
}

/**
 * Genera un archivo DXF para CAD
 */
export async function generateDXFWithBackend(parcelas: unknown[], epsg: string = '25830'): Promise<Blob> {
    return requestExport('/generate-dxf', parcelas, epsg);
}

/**
 * Genera un archivo Shapefile (ZIP) para GIS
 */
export async function generateSHAPEWithBackend(parcelas: unknown[], epsg: string = '25830'): Promise<Blob> {
    return requestExport('/generate-shape', parcelas, epsg);
}

/**
 * Genera un archivo GML de Edificio (INSPIRE Building)
 */
export async function generateBuildingGMLWithBackend(parcelas: unknown[], epsg: string = '25830'): Promise<Blob> {
    return requestExport('/generate-building-gml', parcelas, epsg);
}

/**
 * Verifica el estado del backend
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
        throw new Error('Backend no disponible');
    }
    return response.json();
}
