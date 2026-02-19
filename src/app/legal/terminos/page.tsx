"use client";

export default function Terminos() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 font-sans text-slate-800">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4 text-primary">Términos y Condiciones de Uso</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Objeto del Servicio</h2>
                <p>
                    La plataforma **Soluciones Catastrales** ofrece herramientas técnicas de conversión y validación de archivos GML de forma gratuita para colectivos profesionales y usuarios particulares interesados en el Catastro y Registro de la Propiedad.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Responsabilidad Técnica (IMPORTANTE)</h2>
                <p className="mb-4 text-red-700 font-bold italic">
                    LEA ESTO ATENTAMENTE:
                </p>
                <p className="mb-4">
                    La exactitud de la georreferenciación y la validación técnica final ante los organismos públicos (Sede Electrónica del Catastro, Notaría, Registro de la Propiedad) es responsabilidad exclusiva del técnico competente que firme el informe o del usuario que realice el trámite.
                </p>
                <p>
                    EL USO DE NUESTRAS HERRAMIENTAS GRATUITAS NO EXIME DE LA NECESIDAD DE REVISIÓN PROFESIONAL. Alberto Álvarez Utrera no será responsable de denegaciones de inscripciones, errores en el Informe de Validación Gráfica (IVG) o discrepancias de cabida derivadas de un mal uso de las herramientas o de errores en los archivos fuente (DXF/SHP) aportados por el usuario.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Limitación de Uso</h2>
                <p>
                    Usted se compromete a no utilizar este portal para actividades ilícitas o contrarias a la buena fe y al orden público, ni para introducir virus informáticos o tratar de acceder a cuentas de otros usuarios.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">4. Propiedad del Software</h2>
                <p>
                    Los algoritmos de conversión y validación son propiedad intelectual de Alberto Álvarez Utrera. Se prohíbe el uso de técnicas de ingeniería inversa o el "scraping" automatizado de las herramientas sin consentimiento expreso por escrito.
                </p>
            </section>
        </div>
    );
}
