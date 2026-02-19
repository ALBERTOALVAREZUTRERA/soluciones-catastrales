"use client";

export default function Privacidad() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 font-sans text-slate-800">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4 text-primary">Política de Privacidad</h1>

            <p className="mb-6 italic">Última actualización: Febrero 2026</p>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. Responsable del Tratamiento</h2>
                <p>
                    El responsable del tratamiento de sus datos personales es <strong>Alberto Álvarez Utrera</strong>, con domicilio en [COMPLETAR DIRECCIÓN] y email [COMPLETAR EMAIL].
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Finalidad del Tratamiento</h2>
                <p className="mb-4">Tratamos los datos que nos facilita con las siguientes finalidades:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Atender sus consultas enviadas a través del formulario de contacto o herramientas de la web.</li>
                    <li>Gestionar la relación profesional derivada de las solicitudes de informes técnicos y GML.</li>
                    <li>Envío de información sobre nuestros servicios si así lo ha consentido expresamente.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Legitimación</h2>
                <p>
                    La base legal para el tratamiento de su datos es el **consentimiento del usuario** otorgado al completar nuestros formularios y aceptar nuestra política de privacidad, así como el interés legítimo en responder a sus solicitudes técnicas.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">4. Conservación de Datos</h2>
                <p>
                    Los datos personales se conservarán mientras se mantenga la relación profesional o durante el tiempo necesario para cumplir con las obligaciones legales aplicables.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">5. Sus Derechos</h2>
                <p className="mb-4">Usted tiene derecho a:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Acceder, rectificar y suprimir sus datos.</li>
                    <li>Limitar u oponerse al tratamiento.</li>
                    <li>Solicitar la portabilidad de sus datos.</li>
                </ul>
                <p className="mt-4">
                    Para ejercer estos derechos, puede enviar un correo electrónico a [COMPLETAR EMAIL] acompañando una copia de su DNI.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">6. Seguridad de los Datos</h2>
                <p>
                    Utilizamos infraestructura segura (Firebase/Google Cloud) para garantizar la integridad y confidencialidad de sus datos, adoptando las medidas técnicas necesarias contra el acceso no autorizado.
                </p>
            </section>
        </div>
    );
}
