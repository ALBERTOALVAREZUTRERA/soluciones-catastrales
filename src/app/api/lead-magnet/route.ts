import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, contact } = body;

        if (!name || !contact) {
            return NextResponse.json(
                { error: "Nombre y contacto son obligatorios." },
                { status: 400 }
            );
        }

        // Verificar variables de entorno
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Faltan credenciales SMTP (EMAIL_USER/EMAIL_PASS). Simulando envío de LEAD.");

            if (process.env.NODE_ENV !== "production") {
                console.log("LEAD CAPTURADO (Simulación):", body);
                return NextResponse.json({ success: true, mocked: true });
            }

            return NextResponse.json(
                { error: "Error de configuración del servidor de correo." },
                { status: 500 }
            );
        }

        // Configuración de Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Contenido del email que recibirá Alberto
        const mailOptions = {
            from: `"LEAD MAGNET WEB" <${process.env.EMAIL_USER}>`,
            to: 'alberto.alvarez.utrera@gmail.com',
            subject: `🔥 NUEVO LEAD: Descarga Guía Catastral - ${name}`,
            text: `
¡HAY UN NUEVO CLIENTE POTENCIAL!

Alguien ha descargado la Guía de Errores Catastrales desde la web. Llámalos pronto:

Nombre Completo: ${name}
Teléfono / Email: ${contact}

Motivo: Descarga del Lead Magnet (Guía 2026).
            `,
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #059669;">🔥 ¡NUEVO LEAD DE LA WEB! 🔥</h2>
                <p>Alguien ha descargado la Guía de Errores Catastrales. Esto significa que tienen un problema urgente de Catastro o Registro.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">
                    <p><strong>Nombre del Cliente:</strong> ${name}</p>
                    <p><strong>Teléfono o Email de contacto:</strong> <span style="font-size: 18px; color: #1d4ed8; font-weight: bold;">${contact}</span></p>
                </div>
                <p style="font-size: 12px; color: #6b7280;"><em>Recomendación: Contactar en las próximas 2 horas mientras el problema está candente en su cabeza.</em></p>
            </div>
            `,
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error capturando el Lead:", error);
        return NextResponse.json(
            { error: "Ha ocurrido un error al procesar el Lead." },
            { status: 500 }
        );
    }
}
