// Image imports for the restaurant
import restaurantFacade from '@/assets/restaurant-facade.jpg';
import restaurantInterior from '@/assets/restaurant-interior.jpg';
import restaurantTable from '@/assets/restaurant-table.jpg';
import adanaKebab from '@/assets/adana-kebab.jpg';
import hummus from '@/assets/hummus.jpg';
import baklava from '@/assets/baklava.jpg';
import iskenderKebab from '@/assets/iskender-kebab.jpg';
import cacik from '@/assets/cacik.jpg';
import kunefe from '@/assets/kunefe.jpg';
import turkishTea from '@/assets/turkish-tea.jpg';
import ayran from '@/assets/ayran.jpg';

export const restaurantPhotos = [
  restaurantFacade,
  restaurantInterior,
  restaurantTable,
];

export const dishImages: { [key: string]: string } = {
  'adana-kebab': adanaKebab,
  'hummus': hummus,
  'baklava': baklava,
  'iskender': iskenderKebab,
  'cacik': cacik,
  'kunefe': kunefe,
  'turkish-tea': turkishTea,
  'ayran': ayran,
};
