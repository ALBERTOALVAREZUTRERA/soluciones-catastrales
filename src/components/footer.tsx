"use client";

import Link from "next/link";
import { Landmark, Mail, Phone, MapPin, Linkedin, Facebook, Twitter } from "lucide-react";
import { useState, useEffect } from "react";

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer id="contacto" className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <Landmark className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold tracking-tight font-headline">
                SOLUCIONES <span className="text-accent">CATASTRALES</span>
              </span>
            </Link>
            <p className="text-gray-300 text-sm">
              Ingeniería técnica especializada en archivos GML, coordinación Catastro-Registro y regularización técnica de la propiedad en Jaén.
            </p>
            <div className="flex gap-4">
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-accent cursor-pointer" />
              <Facebook className="h-5 w-5 text-gray-400 hover:text-accent cursor-pointer" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-accent cursor-pointer" />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 font-headline">Servicios</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><Link href="#servicios" className="hover:text-accent">Archivos GML Parcela/Edificio</Link></li>
              <li><Link href="#servicios" className="hover:text-accent">Cambios de Titularidad</Link></li>
              <li><Link href="#servicios" className="hover:text-accent">Revisión de Valor e IBI</Link></li>
              <li><Link href="#servicios" className="hover:text-accent">Informes de Validación (IVGA)</Link></li>
              <li><Link href="#servicios" className="hover:text-accent">Obra Nueva y Segregación</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-bold mb-6 font-headline">Recursos</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><a href="https://www.sedecatastro.gob.es/" target="_blank" className="hover:text-accent">Sede Electrónica Catastro</a></li>
              <li><a href="https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?historica=SI" target="_blank" className="hover:text-accent underline decoration-accent/30 font-semibold text-accent/90">Visor Cartografía Histórica</a></li>
              <li><Link href="#" className="hover:text-accent">Guía de Trámites GML</Link></li>
              <li><Link href="#" className="hover:text-accent">Normativa Ley 13/2015</Link></li>
              <li><Link href="#" className="hover:text-accent">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 font-headline">Contacto</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent" />
                Calle Nueva nº 5, Andújar (Jaén)
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-accent" />
                +34 665 890 608
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <a href="mailto:alberto.alvarez.utrera@gmail.com" className="hover:text-accent text-[11px] sm:text-sm">
                  alberto.alvarez.utrera@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8 text-center text-sm text-gray-400">
          <p>© {year || "..."} SOLUCIONES CATASTRALES. Todos los derechos reservados. Alberto Álvarez - Ingeniero Técnico.</p>
          <p className="mt-2 text-[10px] opacity-40 italic tracking-wider uppercase">
            Plataforma técnica diseñada y desarrollada por Alberto Álvarez Utrera
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] opacity-60 uppercase tracking-tighter decoration-accent/30 underline-offset-4">
            <Link href="/legal/aviso-legal" className="hover:text-accent hover:underline">Aviso Legal</Link>
            <Link href="/legal/privacidad" className="hover:text-accent hover:underline">Política de Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-accent hover:underline">Cookies</Link>
            <Link href="/legal/terminos" className="hover:text-accent hover:underline">Términos y Condiciones</Link>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 text-[9px] opacity-30 flex flex-col items-center gap-1">
            <p>SOFTWARE MAPA POR LEAFLET. ICONOS POR FONT AWESOME (CC BY 4.0).</p>
            <p>ACCESO A DATOS CATASTRALES VÍA SEDE ELECTRÓNICA DEL CATASTRO (WMS/WFS).</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
