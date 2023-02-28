import { Injectable } from '@nestjs/common';
import { IProduct, ISortingFormula, IVariants } from './sort.interface';

@Injectable()
export class SortService {
  sortProducts(products: Array<IProduct>, sortingFormula: Array<ISortingFormula>): Array<IProduct> {
    sortingFormula.forEach((formula) => {
      this.setVariants(products, formula.name, this.formulaForVariantField(formula.name));      
    });
    return products
      .map((product) => this.setSortingScore(product))
      .sort((a, b) => b.accumulatedProductData?.sortingScore - a.accumulatedProductData?.sortingScore);
  }

  private formulaForVariantField(fieldName: string): string {
    switch (fieldName) {
      case 'stock':
        return 'arithmetic-sum';
      case 'pageView':
        return 'arithmetic-mean';
      case 'conversionRate':
        return 'arithmetic-mean';
      case 'refundRate':
        return 'arithmetic-mean';
      default:
        return 'arithmetic-mean';
    }
  }

  private formulaForScoring(product: IProduct, formulaName: string): number {
    const { stock, pageView, price, conversionRate, refundRate } = product.accumulatedProductData;
    switch(formulaName) {
      case 'conversionRate':
        return Math.trunc(stock + (( pageView * price * product.variants.length) / conversionRate ));
      case 'refundRate':
        return Math.trunc(stock + (pageView - refundRate));
      default:
        return null;
    }
  }

  private calculateArithmetic(variants: IVariants[], formulaName: string, type: string): object {
    const reduce: number = variants.reduce((acc, variant) => acc + variant[formulaName], 0);
    return type === 'arithmetic-sum'
      ? {[formulaName]: reduce}
      : {[formulaName]: Math.trunc(reduce / variants.length)};
  }

  private setVariants(products: Array<IProduct>, formulaName: string, type: string): Array<IProduct> {
    products.map((product: IProduct) => {
      product.accumulatedProductData = {
        ...product.accumulatedProductData,
        ...this.calculateArithmetic(product.variants, formulaName, type),
        price: product.price,
      };
      return product
    });
    return products;
  }

  private setSortingScore(product: IProduct): IProduct {
    const accumulatedKeys = Object.keys(product.accumulatedProductData);
    accumulatedKeys.forEach((value) => {
      product.accumulatedProductData.sortingScore = this.formulaForScoring(product, value);
    });
    return product
  }

}
