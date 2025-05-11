import sys
sys.path.append('..')

from backend.app.services.stock_filter import StockFilter
import pandas as pd
import logging

# Logging ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_symbol_loading():
    """BIST sembollerini çekme testi"""
    print("\n1. BIST Sembollerini Çekme Testi")
    print("-" * 30)
    
    # StockFilter örneği oluştur
    stock_filter = StockFilter()
    
    # BIST sembollerini çek
    symbols = stock_filter.load_bist_symbols()
    
    print(f"Toplam {len(symbols)} adet sembol bulundu.")
    print("\nİlk 10 sembol:")
    print(symbols[:10])
    
    return stock_filter, symbols

def test_single_stock(stock_filter: StockFilter, symbols: list):
    """
    Tek bir hisse için veri çekme ve gösterge hesaplama testleri
    """
    print("\n2. Tek Hisse Testi")
    print("------------------------------")
    symbol = symbols[0]  # İlk sembolü al (THYAO)
    print(f"{symbol} hissesi için veri çekiliyor...")
    
    df = stock_filter.fetch_stock_data(symbol)
    print("\nVeri başarıyla çekildi. DataFrame yapısı:\n")
    print("Sütunlar:")
    print(df.columns)
    
    print("\nÖrnek veri (son 5 kayıt):")
    print(df.tail())
    
    print("\nMultiIndex düzeltiliyor...")
    if isinstance(df.columns, pd.MultiIndex):
        print("\nMultiIndex seviyeleri:")
        for level in range(df.columns.nlevels):
            print(f"Seviye {level}: {df.columns.get_level_values(level).unique()}")
    
    # İlk seviyeyi al
    df.columns = df.columns.get_level_values(0)
    print("\nİlk seviye sütunları:")
    print(df.columns)
    
    # Sütun isimlerini düzelt
    column_mapping = {
        col: col.split('.')[0] for col in df.columns
        if isinstance(col, str) and '.' in col
    }
    if column_mapping:
        df = df.rename(columns=column_mapping)
        print("\nDüzeltilmiş sütun isimleri:")
        print(df.columns)
    
    print("\nDüzeltilmiş veri (son 5 kayıt):")
    print(df.tail())
    
    # Göstergeleri hesapla
    df = stock_filter.calculate_filter_indicators(df)
    
    print("\nGöstergeler hesaplandı. Son 5 kayıt:")
    print(df.tail())

def test_all_stocks(stock_filter):
    """Tüm hisseleri işleme testi"""
    print("\n3. Tüm Hisseleri İşleme Testi")
    print("-" * 30)
    
    # Filtreleme kriterlerine uyan hisseleri bul
    filtered_stocks = stock_filter.process_all_stocks()
    
    # Sonuçları DataFrame'e çevir
    results_df = pd.DataFrame(filtered_stocks)
    
    print(f"\nFiltreleme kriterlerine uyan {len(filtered_stocks)} hisse bulundu.")
    if not results_df.empty:
        print("\nSonuçlar:")
        print(results_df)

def main():
    """Ana test fonksiyonu"""
    stock_filter, symbols = test_symbol_loading()
    test_single_stock(stock_filter, symbols)
    test_all_stocks(stock_filter)

if __name__ == "__main__":
    main() 