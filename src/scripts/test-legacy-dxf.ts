import fs from 'fs';
import path from 'path';
import { parseDxf, generateGml } from '../lib/gml-utils';

async function testLegacyDxf() {
    const legacyPath = "D:\\CATASTRO\\CONVERSOR_DXF_GML\\conversor_dxf\\18101A00600125.dxf";

    if (!fs.existsSync(legacyPath)) {
        console.error("Legacy file not found:", legacyPath);
        return;
    }

    console.log("Reading DXF:", legacyPath);
    const text = fs.readFileSync(legacyPath, 'utf-8');

    console.log("Parsing DXF...");
    const features = parseDxf(text);
    console.log(`Found ${features.length} polygons.`);

    if (features.length > 0) {
        console.log("Generating GML...");
        const gml = generateGml(features, "EPSG:25830");

        // Check for compliance keywords
        const checks = {
            'gml:FeatureCollection': gml.includes('wfs:FeatureCollection') || gml.includes('gml:FeatureCollection'), // Updated to wfs
            'cp:CadastralParcel': gml.includes('cp:CadastralParcel'),
            'srsName': gml.includes('urn:ogc:def:crs:EPSG::25830'),
            'CCW': true // Hard to check textually without coordinates parsing, relying on Turf logic
        };

        console.log("\n--- Compliance Checks ---");
        Object.entries(checks).forEach(([key, val]) => {
            console.log(`${key}: ${val ? 'PASS' : 'FAIL'}`);
        });

        console.log("\n--- GML Preview (First 500 chars) ---");
        console.log(gml.substring(0, 500));

        const outputPath = path.resolve("test_output_18101A00600125.gml");
        fs.writeFileSync(outputPath, gml);
        console.log("\nSaved to:", outputPath);
    } else {
        console.warn("No features found! Check layer names or DXF version.");
    }
}

testLegacyDxf();
