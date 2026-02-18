
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Maximize2, Map as MapIcon, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MapPreview() {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rusticData, setRusticData] = useState({
    provincia: "Jaén",
    municipio: "Andújar",
    poligono: "",
    parcela: ""
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSearching(true);
    setFound(false);

    // Simulación de consulta técnica a la base de datos
    setTimeout(() => {
      setIsSearching(false);
      setFound(true);
      toast({
        title: "Propiedad Localizada",
        description: "Se ha establecido conexión con la cartografía técnica catastral.",
      });
    }, 1800);
  };

  const openOfficialCatastro = () => {
    // Enlace a la Sede Electrónica del Catastro
    window.open("https://www.sedecatastro.gob.es/", "_blank");
  };

  return (
    <section id="mapa" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-headline text-primary mb-4 uppercase tracking-tight">Visor de Localización Técnica</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Identifique su parcela rústica o urbana. Este visor simula la conexión técnica necesaria para iniciar la redacción de sus archivos GML.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto overflow-hidden border-none shadow-2xl">
          <div className="bg-muted p-1">
            <Tabs defaultValue="referencia" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="referencia" className="flex gap-2">
                  <Search className="h-4 w-4" /> Referencia Catastral
                </TabsTrigger>
                <TabsTrigger value="rustica" className="flex gap-2">
                  <MapIcon className="h-4 w-4" /> Búsqueda Rústica
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="referencia" className="p-4 bg-white mt-0 border-t">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="ref-search">Referencia Catastral (14 o 20 caracteres)</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="ref-search" 
                        className="pl-10" 
                        placeholder="Ej: 23005A00500124..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 px-8 h-10" disabled={isSearching}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Localizar Parcela"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="rustica" className="p-4 bg-white mt-0 border-t">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input 
                      id="provincia" 
                      value={rusticData.provincia}
                      onChange={(e) => setRusticData({...rusticData, provincia: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipio">Municipio</Label>
                    <Input 
                      id="municipio" 
                      value={rusticData.municipio}
                      onChange={(e) => setRusticData({...rusticData, municipio: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poligono">Polígono</Label>
                    <Input 
                      id="poligono" 
                      type="number" 
                      placeholder="Ej: 5" 
                      value={rusticData.poligono}
                      onChange={(e) => setRusticData({...rusticData, poligono: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parcela">Parcela</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="parcela" 
                        type="number" 
                        placeholder="Ej: 124"
                        value={rusticData.parcela}
                        onChange={(e) => setRusticData({...rusticData, parcela: e.target.value})}
                      />
                      <Button type="submit" className="bg-primary hover:bg-primary/90 px-4" disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ir"}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <CardContent className="p-0 relative h-[550px] bg-slate-200 flex items-center justify-center overflow-hidden">
            {/* Mock Map Image Background */}
            <div 
              className="absolute inset-0 transition-all duration-1000"
              style={{
                backgroundImage: `url('https://picsum.photos/seed/${found ? 'parcel-ortho' : 'cadastral-blueprint'}/1200/800')`,
                backgroundSize: 'cover',
                filter: isSearching ? 'blur(4px) grayscale(50%)' : 'none',
                transform: found ? 'scale(1.1)' : 'scale(1)'
              }}
              data-ai-hint="cartographic survey"
            />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-primary/20" />
              ))}
            </div>

            {/* Loading Overlay */}
            {isSearching && (
              <div className="absolute inset-0 z-20 bg-primary/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-primary">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="font-bold uppercase tracking-widest text-sm bg-white/80 px-4 py-2 rounded-full shadow-lg">
                  Conectando con Sede Electrónica...
                </p>
              </div>
            )}
            
            {/* Interactive Parcel Highlight */}
            {found && (
              <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
                 <div className="w-64 h-48 bg-accent/30 border-4 border-accent rounded-sm flex items-center justify-center relative shadow-[0_0_50px_rgba(0,128,128,0.5)]">
                    <MapPin className="h-10 w-10 text-primary drop-shadow-lg" />
                    
                    {/* Data Tooltip */}
                    <div className="absolute -top-32 bg-white p-4 rounded-lg shadow-2xl border-2 border-accent w-64 text-center">
                        <p className="font-bold text-primary mb-1 text-sm">FINCA LOCALIZADA</p>
                        <p className="text-[10px] text-muted-foreground font-mono mb-2">
                          {rusticData.poligono ? `POL: ${rusticData.poligono} PAR: ${rusticData.parcela} (${rusticData.municipio})` : searchQuery}
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" className="text-[10px] h-8 flex gap-1 border-accent text-accent" onClick={openOfficialCatastro}>
                            <ExternalLink className="h-3 w-3" /> Ver en Sede Catastro
                          </Button>
                          <Button size="sm" className="bg-accent text-[10px] h-8 text-white">
                            Solicitar GML de esta Finca
                          </Button>
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="shadow-md bg-white hover:bg-muted" onClick={() => {setFound(false); setSearchQuery(""); setRusticData({provincia: "Jaén", municipio: "Andújar", poligono: "", parcela: ""});}}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-md border shadow-sm max-w-[200px]">
              <p className="text-[10px] uppercase font-bold text-accent mb-1 tracking-widest">Capa Técnica Activa</p>
              <p className="text-xs font-medium text-primary">
                {found ? "Ortofoto y Parcelario ETRS89" : "Catastro Rústico/Urbano General"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
