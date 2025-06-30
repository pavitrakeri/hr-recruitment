// Currency conversion rates (you can update these or fetch from an API)
const EXCHANGE_RATES = {
  USD_TO_INR: 83.0, // Approximate rate, consider using a real-time API
  INR_TO_USD: 1 / 83.0,
};

// Currency formatting options
const CURRENCY_FORMATS = {
  USD: {
    symbol: '$',
    locale: 'en-US',
    currency: 'USD',
  },
  INR: {
    symbol: '₹',
    locale: 'en-IN',
    currency: 'INR',
  },
};

/**
 * Convert USD amount to INR
 * @param usdAmount - Amount in USD
 * @returns Amount in INR
 */
export const convertUSDToINR = (usdAmount: number): number => {
  return Math.round(usdAmount * EXCHANGE_RATES.USD_TO_INR);
};

/**
 * Convert INR amount to USD
 * @param inrAmount - Amount in INR
 * @returns Amount in USD
 */
export const convertINRToUSD = (inrAmount: number): number => {
  return Math.round(inrAmount * EXCHANGE_RATES.INR_TO_USD * 100) / 100;
};

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (USD or INR)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: 'USD' | 'INR' = 'USD'): string => {
  const format = CURRENCY_FORMATS[currency];
  
  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency for display in subscription plans
 * @param amount - Amount in USD
 * @param currency - Target currency
 * @returns Formatted string with symbol
 */
export const formatPlanPrice = (amount: number, currency: 'USD' | 'INR' = 'USD'): string => {
  if (currency === 'INR') {
    const inrAmount = convertUSDToINR(amount);
    return `${CURRENCY_FORMATS.INR.symbol}${inrAmount.toLocaleString('en-IN')}`;
  }
  
  return `${CURRENCY_FORMATS.USD.symbol}${amount}`;
};

/**
 * Get currency symbol
 * @param currency - Currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: 'USD' | 'INR'): string => {
  return CURRENCY_FORMATS[currency].symbol;
};

/**
 * Convert amount to paise (for Razorpay)
 * @param amount - Amount in INR
 * @returns Amount in paise
 */
export const convertToPaise = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert paise to INR
 * @param paise - Amount in paise
 * @returns Amount in INR
 */
export const convertFromPaise = (paise: number): number => {
  return paise / 100;
};

/**
 * Get exchange rate
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Exchange rate
 */
export const getExchangeRate = (fromCurrency: 'USD' | 'INR', toCurrency: 'USD' | 'INR'): number => {
  if (fromCurrency === toCurrency) return 1;
  
  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return EXCHANGE_RATES.USD_TO_INR;
  }
  
  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return EXCHANGE_RATES.INR_TO_USD;
  }
  
  return 1;
};

/**
 * Update exchange rates from an API (optional)
 * You can call this function to fetch real-time rates
 */
export const updateExchangeRates = async (): Promise<void> => {
  try {
    // Example: Fetch from a currency API
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    // EXCHANGE_RATES.USD_TO_INR = data.rates.INR;
    // EXCHANGE_RATES.INR_TO_USD = 1 / data.rates.INR;
    
    console.log('Exchange rates updated successfully');
  } catch (error) {
    console.error('Failed to update exchange rates:', error);
  }
}; 