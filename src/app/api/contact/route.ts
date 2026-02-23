import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, type, ref, message } = body;

        // Verificar variables de entorno
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Faltan las credenciales SMTP en el .env (EMAIL_USER y EMAIL_PASS)");
            // En modo desarrollo sin .env configurado, simularemos el envío correcto para no bloquear la UI.
            if (process.env.NODE_ENV !== "production") {
                console.log("Simulando envío de correo (Faltan credenciales):", body);
                return NextResponse.json({ success: true, mocked: true });
            }

            return NextResponse.json(
                { error: "Error de configuración del servidor de correo." },
                { status: 500 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Contenido del correo en texto plano y HTML
        const mailOptions = {
            from: `CATASTRO WEB <${process.env.EMAIL_USER}>`,
            to: 'alberto.alvarez.utrera@gmail.com', // El destino final del formulario
            replyTo: email,
            subject: `NUEVO EXPEDIENTE WEB: ${type.toUpperCase()} - ${name}`,
            text: `
Has recibido un nuevo contacto desde el Portal de Envío Técnico:

Nombre: ${name}
Email: ${email}
Tipo de Trámite: ${type}
Referencia Catastral: ${ref || 'No especificada'}

Mensaje del Cliente:
${message}
      `,
            html: `
        <h2>Nuevo Expediente Web Recibido</h2>
        <p><strong>Remitente:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
        <p><strong>Tipo de Trámite:</strong> ${type}</p>
        <p><strong>Referencia Catastral:</strong> ${ref || 'No especificada'}</p>
        <hr />
        <h3>Mensaje / Descripción del Caso:</h3>
        <p style="white-space: pre-line;">${message}</p>
      `,
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        return NextResponse.json(
            { error: "Ha ocurrido un error al procesar el envío del correo." },
            { status: 500 }
        );
    }
}
