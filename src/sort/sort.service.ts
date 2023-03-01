import { Injectable } from '@nestjs/common';
import { IProduct, ISortingFormula, IVariants, IAccumulatedProductData } from './sort.interface';

@Injectable()
export class SortService {
  sortProducts(products: Array<IProduct>, sortingFormula: Array<ISortingFormula>): Array<IProduct> {
    sortingFormula.forEach((formula) => {
      this.setVariants(products, formula.name);      
    });
    return products
      .map((product) => this.setSortingScore(product))
      .sort((a, b) => b.accumulatedProductData?.sortingScore - a.accumulatedProductData?.sortingScore);
  }

  private formulaForVariantField(fieldName: string, product: IProduct): IAccumulatedProductData {
    switch (fieldName) {
      case 'stock':
        return { [fieldName]: this.aritmeticSum(fieldName, product.variants)}
      case 'pageView':
      case 'conversionRate':
      case 'refundRate':
        return { [fieldName]: this.aritmeticMean(fieldName, product.variants) }
      case 'sortingScore':
        const { stock, pageView, price, conversionRate, refundRate } = product.accumulatedProductData;
        if(conversionRate) {
          return { [fieldName]: Math.trunc(stock + (( pageView * price * product.variants.length) / conversionRate ))};
        } 
        else if (refundRate) {
          return { [fieldName]: Math.trunc(stock + (pageView - refundRate))};
        }
      default:
        return {};
    }
  }

  private aritmeticSum(fieldName: string, variants: IVariants[]): number {
    return variants.reduce((acc, variant) => acc + variant[fieldName], 0);
  }

  private aritmeticMean(fieldName: string, variants: IVariants[]): number {
    const reduce: number = variants.reduce((acc, variant) => acc + variant[fieldName], 0);
    return Math.trunc(reduce / variants.length);
  }

  private setVariants(products: Array<IProduct>, fieldName: string): Array<IProduct> {
    products.map((product: IProduct) => {
      product.accumulatedProductData = {
        ...product.accumulatedProductData,
        ...this.formulaForVariantField(fieldName, product),
        price: product.price,
      };
      return product
    });
    return products;
  }

  private setSortingScore(product: IProduct): IProduct {
    product.accumulatedProductData = {...product.accumulatedProductData, ...this.formulaForVariantField('sortingScore', product)};
    return product;
  }

}
