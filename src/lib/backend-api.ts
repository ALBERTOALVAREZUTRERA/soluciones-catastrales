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

/**
 * Llama al backend para analizar un archivo DXF o ZIP (Shapefile)
 */
export async function analyzeWithBackend(file: File, epsg: string = '25830', tipoEntidad: string = 'CP'): Promise<BackendAnalyzeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/analyze?epsg=${epsg}&tipo_entidad=${tipoEntidad}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `Error HTTP: ${response.status}`);
    }

    return response.json();
}

/**
 * Genera un archivo GML con datos editados
 */
export async function generateGMLWithBackend(parcelas: any[], epsg: string = '25830'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/generate-gml`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcelas, epsg }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `Error HTTP: ${response.status}`);
    }

    return response.blob();
}

/**
 * Genera un archivo KML para visualización en Google Earth
 */
export async function generateKMLWithBackend(parcelas: any[], epsg: string = '25830'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/generate-kml`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcelas, epsg }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `Error HTTP: ${response.status}`);
    }

    return response.blob();
}

/**
 * Genera un archivo DXF para CAD
 */
export async function generateDXFWithBackend(parcelas: any[], epsg: string = '25830'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/generate-dxf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcelas, epsg }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `Error HTTP: ${response.status}`);
    }

    return response.blob();
}

/**
 * Genera un archivo Shapefile (ZIP) para GIS
 */
export async function generateSHAPEWithBackend(parcelas: any[], epsg: string = '25830'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/generate-shape`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcelas, epsg }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `Error HTTP: ${response.status}`);
    }

    return response.blob();
}

/**
 * Genera un archivo GML de Edificio (INSPIRE Building)
 */
export async function generateBuildingGMLWithBackend(parcelas: any[], epsg: string = '25830'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/generate-building-gml`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcelas, epsg }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(error.detail || `Error HTTP: ${response.status}`);
    }

    return response.blob();
}

/**
 * Verifica el estado del backend
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('Backend no disponible');
        }
        return response.json();
    } catch (error) {
        console.error('Error conectando con backend:', error);
        throw error;
    }
}
