
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = (data as any).placeholderImages || [];

export function getPlaceholderImage(id: string): ImagePlaceholder {
  return PlaceHolderImages.find(img => img.id === id) || {
    id: 'unknown',
    description: 'Imagen no encontrada',
    imageUrl: 'https://picsum.photos/seed/error/600/400',
    imageHint: 'technical drawing'
  };
}
