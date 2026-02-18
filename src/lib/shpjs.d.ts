declare module 'shpjs' {
    const shp: any;
    export default shp;
    export function parseZip(buffer: ArrayBuffer): Promise<any>;
}
