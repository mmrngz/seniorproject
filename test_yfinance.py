#!/usr/bin/env python3
"""
YFinance Testi

Bu script, YFinance kütüphanesinin BIST sembolleri için çalışıp çalışmadığını test eder.
Çalıştırmak için: python test_yfinance.py
"""

import yfinance as yf
import pandas as pd
import time
import traceback
from datetime import datetime

def test_symbol(symbol, suffix=".IS"):
    """Belirli bir sembolü test eder"""
    if not symbol.endswith(suffix):
        symbol = f"{symbol}{suffix}"
    
    print(f"\n{'='*60}\nSEMBOL TESTİ: {symbol}\n{'='*60}")
    
    results = {
        "symbol": symbol,
        "ticker_success": False,
        "ticker_rows": 0,
        "ticker_error": None,
        "download_success": False,
        "download_rows": 0,
        "download_error": None,
    }
    
    # 1. Yöntem: Ticker nesnesi
    try:
        print(f"1. Yöntem: Ticker nesnesi kullanılıyor ({symbol})")
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1mo")
        
        if hist.empty:
            print(f"Ticker.history() sonucu: Veri yok veya boş ({symbol})")
        else:
            results["ticker_success"] = True
            results["ticker_rows"] = len(hist)
            print(f"Ticker.history() sonucu: {len(hist)} satır veri alındı ({symbol})")
            print("\nVeri Örneği:")
            print(hist.head(2))
    except Exception as e:
        results["ticker_error"] = str(e)
        print(f"Ticker nesnesi hatası: {str(e)}")
        print(traceback.format_exc())
    
    time.sleep(2)  # API sınırlamalarını aşmamak için kısa bekleme
    
    # 2. Yöntem: download fonksiyonu
    try:
        print(f"\n2. Yöntem: download() fonksiyonu kullanılıyor ({symbol})")
        df = yf.download(symbol, period="1mo", progress=False)
        
        if df.empty:
            print(f"yf.download() sonucu: Veri yok veya boş ({symbol})")
        else:
            results["download_success"] = True
            results["download_rows"] = len(df)
            print(f"yf.download() sonucu: {len(df)} satır veri alındı ({symbol})")
            print("\nVeri Örneği:")
            print(df.head(2))
    except Exception as e:
        results["download_error"] = str(e)
        print(f"download fonksiyonu hatası: {str(e)}")
        print(traceback.format_exc())
    
    # Sonuç özeti
    success = results["ticker_success"] or results["download_success"]
    print(f"\nSonuç: {symbol} {'BAŞARILI' if success else 'BAŞARISIZ'}")
    
    return results

def test_with_different_formats(symbol):
    """Bir sembolü farklı formatlarla test eder"""
    print(f"\n{'#'*80}\nFARKLI FORMATLARDA TEST: {symbol}\n{'#'*80}")
    
    formats = [
        ".IS",  # Standart BIST formatı
        ".E",   # Bazı BIST sembolleri için alternatif
        "",     # Uzantısız
    ]
    
    results = {}
    
    for fmt in formats:
        print(f"\n{'-'*50}\nFormat: '{fmt}'\n{'-'*50}")
        result = test_symbol(symbol, suffix=fmt)
        results[f"{symbol}{fmt}"] = result
        
        # Formatlar arasında biraz bekleyelim
        if fmt != formats[-1]:
            wait_time = 10
            print(f"\n{wait_time} saniye bekleniyor...")
            time.sleep(wait_time)
    
    return results

def test_multiple_symbols(symbols, wait_time=15):
    """Birden fazla sembolü test eder"""
    print(f"\n{'#'*80}\nÇOKLU SEMBOL TESTİ\n{'#'*80}")
    
    results = {}
    
    for i, symbol in enumerate(symbols):
        print(f"\nTest {i+1}/{len(symbols)}: {symbol}")
        result = test_symbol(symbol)
        results[symbol] = result
        
        # Semboller arasında biraz bekleyelim
        if i < len(symbols) - 1:
            print(f"\n{wait_time} saniye bekleniyor...")
            time.sleep(wait_time)
    
    return results

def print_summary(results):
    """Sonuçları özetler"""
    print(f"\n{'#'*80}\nTEST SONUÇLARI\n{'#'*80}")
    
    success_count = 0
    total_count = len(results)
    
    for symbol, result in results.items():
        success = result["ticker_success"] or result["download_success"]
        if success:
            success_count += 1
        
        status = "✓ BAŞARILI" if success else "✗ BAŞARISIZ"
        ticker_status = "✓" if result["ticker_success"] else "✗"
        download_status = "✓" if result["download_success"] else "✗"
        
        print(f"{symbol.ljust(12)} {status.ljust(15)} Ticker: {ticker_status} ({result['ticker_rows']} satır), Download: {download_status} ({result['download_rows']} satır)")
    
    print("\n" + "-" * 70)
    print(f"Toplam {total_count} sembolden {success_count} tanesi için veri alınabildi.")
    print(f"Başarı Oranı: {(success_count/total_count)*100:.1f}%")

def main():
    print(f"\n{'#'*80}")
    print(f"YFINANCE KÜTÜPHANESİ TESTİ")
    print(f"{'#'*80}")
    
    print(f"YFinance Versiyonu: {yf.__version__}")
    print(f"Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Popüler BIST sembollerini test et
    popular_symbols = ["THYAO", "GARAN", "ASELS"]
    popular_results = test_multiple_symbols(popular_symbols, wait_time=15)
    
    # Sorunlu sembolleri test et
    problem_symbols = ["A1CAP", "ADEL", "ACSEL"]
    problem_results = test_multiple_symbols(problem_symbols, wait_time=15)
    
    # ADEL sembolünü farklı formatlarda test et
    format_results = test_with_different_formats("ADEL")
    
    # Tüm sonuçları birleştir
    all_results = {}
    all_results.update(popular_results)
    all_results.update(problem_results)
    
    # Sonuçları yazdır
    print_summary(all_results)
    print("\nFarklı Format Testleri:")
    print_summary(format_results)
    
    print("\nTest tamamlandı!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nTest kullanıcı tarafından durduruldu.")
    except Exception as e:
        print(f"\nTest sırasında hata oluştu: {str(e)}")
        print(traceback.format_exc()) 