export interface ISortingFormula {
  operator: string;
  name: string;
}

export interface IVariants {
  name: string;
  stock: number;
  pageView: number;
  conversionRate?: number;
  refundRate?: number
}

interface IAccumulatedProductData {
  stock: number;
  pageView?: number;
  conversionRate?: number;
  price?: number;
  sortingScore?: number;
  refundRate?: number;
}

export interface IProduct {
  name: string;
  price: number;
  variants: Array<IVariants>;
  accumulatedProductData?: IAccumulatedProductData;
}