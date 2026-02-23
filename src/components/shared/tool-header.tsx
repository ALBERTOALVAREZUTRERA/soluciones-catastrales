import { LucideIcon } from "lucide-react";

interface ToolHeaderProps {
    title: string;
    description: string;
    Icon: LucideIcon;
}

export function ToolHeader({ title, description, Icon }: ToolHeaderProps) {
    return (
        <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline flex flex-col items-center justify-center gap-4">
                <Icon className="h-12 w-12 text-accent" />
                {title}
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                {description}
            </p>
        </div>
    );
}
