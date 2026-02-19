"use client";

export default function AvisoLegal() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 font-sans text-slate-800">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4 text-primary">Aviso Legal</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Información General</h2>
                <p className="mb-4">
                    En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Titular:</strong> Alberto Álvarez Utrera</li>
                    <li><strong>DNI/NIF:</strong> [COMPLETAR DNI]</li>
                    <li><strong>Domicilio:</strong> [COMPLETAR DIRECCIÓN], Andújar (Jaén), España</li>
                    <li><strong>Actividad Profesional:</strong> Ingeniero Técnico - Especialista en Catastro</li>
                    <li><strong>Colegio Profesional:</strong> [COMPLETAR COLEGIO] - Número de Colegiado: [Nº]</li>
                    <li><strong>Email de contacto:</strong> [COMPLETAR EMAIL]</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Propiedad Intelectual e Industrial</h2>
                <p className="mb-4">
                    Alberto Álvarez Utrera es el titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (tales como imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño).
                </p>
                <p>
                    Queda expresamente prohibida la reproducción, distribución y comunicación pública de la totalidad o parte de los contenidos de esta página web con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización del titular.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Exclusión de Responsabilidad</h2>
                <p>
                    El titular no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">4. Legislación Aplicable y Jurisdicción</h2>
                <p>
                    La relación entre el titular y el usuario se regirá por la normativa española vigente y cualquier controversia se someterá a los Juzgados y tribunales de la ciudad de Andújar (Jaén).
                </p>
            </section>
        </div>
    );
}
