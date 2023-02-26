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
    const { conversionRate, refundRate } = product.accumulatedProductData;
    let sortingScore: number;
    if(conversionRate) {
      sortingScore = this.setByConversionRate(product);
    } else if(refundRate) {
      sortingScore = this.setByRefundRate(product);
    }
    return { ...product, accumulatedProductData: { ...product.accumulatedProductData, sortingScore } };
  }

  private setByConversionRate(product: IProduct): number {
    const { stock, pageView, price, conversionRate } = product.accumulatedProductData;
    return stock + (( pageView * price * product.variants.length) / conversionRate );
  }

  private setByRefundRate(product: IProduct): number {
    const { stock, pageView, refundRate } = product.accumulatedProductData;
    return stock + (pageView - refundRate);
  }

}
