'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const { toast } = useToast();

  const handleUpgradeClick = () => {
    toast({
      title: 'Próximamente',
      description: 'La funcionalidad de actualización estará disponible pronto.',
    });
  };

  return (
    <div className="container mx-auto py-8 md:py-12 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl">
          Elige tu Plan
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Empieza gratis y desbloquea más funciones con nuestro plan Pro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Gratis</CardTitle>
            <CardDescription>
              Funcionalidades básicas para empezar a encontrar tus canciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold font-headline">0€<span className="text-xl font-normal text-muted-foreground">/mes</span></div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Búsqueda en hasta 1 playlist</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Hasta 10 búsquedas al mes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Resultados básicos</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Tu Plan Actual
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-primary shadow-lg relative">
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
             <div className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                Más Popular
             </div>
          </div>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>
              Desbloquea todo el potencial de TuneFinder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold font-headline">5€<span className="text-xl font-normal text-muted-foreground">/mes</span></div>
            <ul className="space-y-3">
               <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Búsqueda en playlists ilimitadas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Búsquedas ilimitadas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Búsqueda y filtrado avanzados</span>
              </li>
               <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>Soporte prioritario</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleUpgradeClick}>
              Actualizar a Pro
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
