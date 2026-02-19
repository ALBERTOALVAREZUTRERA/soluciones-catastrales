"use client";

export default function Cookies() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 font-sans text-slate-800">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4 text-primary">Política de Cookies</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">1. ¿Qué son las cookies?</h2>
                <p>
                    Una cookie es un pequeño fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">2. Cookies utilizadas en este sitio</h2>
                <ul className="list-disc pl-6 space-y-4">
                    <li>
                        <strong>Cookies Técnicas:</strong> Son aquellas estrictamente necesarias para el uso del sitio web y la prestación del servicio contratado, como las necesarias para el funcionamiento del conversor GML.
                    </li>
                    <li>
                        <strong>Cookies de Personalización:</strong> Permiten al usuario configurar aspectos como el idioma o el sistema de coordenadas preferido.
                    </li>
                    <li>
                        <strong>Cookies de Análisis:</strong> (Si se añade Google Analytics u otros): Utilizadas para cuantificar el número de usuarios y realizar el análisis estadístico del uso que hacen los usuarios de la web.
                    </li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">3. Cómo desactivar las cookies</h2>
                <p className="mb-4">
                    Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Para más información sobre Google Chrome <a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" className="text-accent underline">pulse aquí</a>.</li>
                    <li>Para más información sobre Firefox <a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" className="text-accent underline">pulse aquí</a>.</li>
                </ul>
            </section>
        </div>
    );
}
