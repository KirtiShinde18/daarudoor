export interface Category {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

export type ProductCategory = 'Whiskey' | 'Vodka' | 'Rum' | 'Beer' | 'Wine' | 'Gin' | 'Tequila' | 'Mixers' | string;
