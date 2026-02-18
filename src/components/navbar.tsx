"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Servicios", href: "/servicios" },
  { name: "GML Parcela", href: "/herramientas/conversor-gml" },
  { name: "GML Edificio", href: "/herramientas/conversor-edificio" },
  { name: "Valor Catastral / IBI", href: "/herramientas/calculadora" },
  { name: "Trámites", href: "/#tramites" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Landmark className="h-8 w-8 text-accent transition-transform group-hover:scale-110" />
            <span className="text-lg md:text-xl font-bold tracking-tight font-headline uppercase leading-none">
              SOLUCIONES <span className="text-accent block text-xs md:text-sm tracking-widest">CATASTRALES Y REGISTRALES</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-accent"
              >
                {link.name}
              </Link>
            ))}
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white">
              Área Cliente
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu de navegación"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-primary-foreground text-primary border-b animate-in slide-in-from-top duration-300">
          <div className="flex flex-col space-y-4 p-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-semibold"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Button className="w-full bg-accent hover:bg-accent/90">
              Área Cliente
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
