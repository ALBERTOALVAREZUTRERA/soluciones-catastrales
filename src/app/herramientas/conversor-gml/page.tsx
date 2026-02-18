"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { GmlConverter } from "@/components/tools/gml-converter";
import { Toaster } from "@/components/ui/toaster";

export default function GmlConverterPage() {
    return (
        <main className="min-h-screen bg-slate-50 font-body">
            <Navbar />

            <div className="pt-32 pb-20 container mx-auto px-4">
                <GmlConverter />
            </div>

            <Footer />
            <Toaster />
        </main>
    );
}
