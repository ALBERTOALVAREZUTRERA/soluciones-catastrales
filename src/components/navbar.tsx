"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// Agrupar enlaces
const navigationGroups = {
  main: [
    { name: "Inicio", href: "/" },
    { name: "Servicios", href: "/servicios" },
  ],
  tools: {
    label: "Herramientas GML",
    items: [
      { name: "GML Parcela", href: "/herramientas/conversor-gml" },
      { name: "GML Edificio", href: "/herramientas/conversor-edificio" },
    ]
  },
  calculators: {
    label: "Calculadoras",
    items: [
      { name: "Valor Catastral / IBI (Urbano)", href: "/herramientas/calculadora" },
      { name: "Valor Catastral Rústico", href: "/herramientas/calculadora-rustica" },
    ]
  },
  procedures: {
    label: "Trámites",
    items: [
      { name: "Trámites Registrales", href: "/tramites-registrales" },
      { name: "Trámites Catastrales", href: "/tramites-catastrales" },
    ]
  },
  map: { name: "Mapa Interactivo", href: "/herramientas/visor-catastral" }
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Landmark className="h-8 w-8 text-accent transition-transform group-hover:scale-110" />
            <span className="text-lg md:text-xl font-bold tracking-tight font-headline uppercase leading-none">
              SOLUCIONES <span className="text-green-300 block text-xs md:text-sm tracking-widest">CATASTRALES Y REGISTRALES</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationGroups.main.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-accent"
              >
                {link.name}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium transition-colors hover:text-accent flex items-center gap-1 outline-none">
                {navigationGroups.tools.label} <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-slate-200">
                {navigationGroups.tools.items.map((item) => (
                  <DropdownMenuItem key={item.name} asChild className="cursor-pointer hover:bg-slate-100">
                    <Link href={item.href} className="w-full">{item.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium transition-colors hover:text-accent flex items-center gap-1 outline-none">
                {navigationGroups.calculators.label} <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-slate-200">
                {navigationGroups.calculators.items.map((item) => (
                  <DropdownMenuItem key={item.name} asChild className="cursor-pointer hover:bg-slate-100">
                    <Link href={item.href} className="w-full">{item.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium transition-colors hover:text-accent flex items-center gap-1 outline-none">
                {navigationGroups.procedures.label} <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-slate-200">
                {navigationGroups.procedures.items.map((item) => (
                  <DropdownMenuItem key={item.name} asChild className="cursor-pointer hover:bg-slate-100">
                    <Link href={item.href} className="w-full">{item.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href={navigationGroups.map.href}
              className="text-sm font-medium transition-colors hover:text-accent"
            >
              {navigationGroups.map.name}
            </Link>
            <Link href="#tramites">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white">
                Área Cliente
              </Button>
            </Link>
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
            {navigationGroups.main.map((link) => (
              <Link key={link.name} href={link.href} className="text-lg font-semibold" onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))}

            <div className="pt-2 pb-1 border-b border-primary/20">
              <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2">{navigationGroups.tools.label}</p>
              <div className="flex flex-col space-y-3 pl-2">
                {navigationGroups.tools.items.map((link) => (
                  <Link key={link.name} href={link.href} className="text-md font-medium" onClick={() => setIsOpen(false)}>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 pb-1 border-b border-primary/20">
              <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2">{navigationGroups.calculators.label}</p>
              <div className="flex flex-col space-y-3 pl-2">
                {navigationGroups.calculators.items.map((link) => (
                  <Link key={link.name} href={link.href} className="text-md font-medium" onClick={() => setIsOpen(false)}>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 pb-1 border-b border-primary/20">
              <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2">{navigationGroups.procedures.label}</p>
              <div className="flex flex-col space-y-3 pl-2">
                {navigationGroups.procedures.items.map((link) => (
                  <Link key={link.name} href={link.href} className="text-md font-medium" onClick={() => setIsOpen(false)}>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link href={navigationGroups.map.href} className="text-lg font-semibold" onClick={() => setIsOpen(false)}>
                {navigationGroups.map.name}
              </Link>
            </div>
            <Link href="#tramites" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-accent hover:bg-accent/90">
                Área Cliente
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
