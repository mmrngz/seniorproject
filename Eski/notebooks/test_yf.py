import yfinance as yf
import pandas as pd

def test_single_stock():
    print("THYAO için veri çekme testi:")
    try:
        # Tek bir hisse için test
        thyao = yf.Ticker("THYAO.IS")
        hist = thyao.history(period="1d")
        print("\nGünlük veri:")
        print(hist)
        
        # Hisse bilgilerini göster
        info = thyao.info
        if info:
            print("\nHisse bilgileri:")
            print(f"Şirket adı: {info.get('longName', 'Bilgi yok')}")
            print(f"Sektör: {info.get('sector', 'Bilgi yok')}")
            print(f"Piyasa değeri: {info.get('marketCap', 'Bilgi yok')}")
    except Exception as e:
        print(f"Hata: {str(e)}")

def test_multiple_stocks():
    print("\nBirden fazla hisse için test:")
    try:
        # Birden fazla hisse için test
        symbols = ["THYAO.IS", "ASELS.IS", "SISE.IS"]
        data = yf.download(
            tickers=symbols,
            period="1d",
            group_by='ticker',
            auto_adjust=True,
            progress=False
        )
        print(data)
    except Exception as e:
        print(f"Hata: {str(e)}")

if __name__ == "__main__":
    print("yfinance sürümü:", yf.__version__)
    test_single_stock()
    test_multiple_stocks() 