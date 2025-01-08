// Funcții utilitare comune

export function formatNumber(number) {
    if (number === 0) return '0';
    
    // Pentru numere mai mari ca 1
    if (number >= 1) {
        return number.toFixed(2);
    }
    
    // Pentru numere foarte mici, găsim prima cifră diferită de 0
    const str = number.toString();
    const decimalPart = str.split('.')[1] || '';
    let significantDigits = 0;
    
    for (let i = 0; i < decimalPart.length; i++) {
        significantDigits++;
        if (decimalPart[i] !== '0') {
            // Adăugăm încă 2 zecimale după prima cifră semnificativă
            significantDigits += 2;
            break;
        }
    }
    
    // Limităm la maxim 8 zecimale
    significantDigits = Math.min(8, significantDigits);
    return number.toFixed(significantDigits);
}

export function formatPrice(number) {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
} 