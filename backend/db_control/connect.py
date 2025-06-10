from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from db_control.models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_size=5,  # 接続プールのサイズ
    max_overflow=10,  # 最大オーバーフロー接続数
    pool_timeout=30,  # プールからの接続取得タイムアウト（秒）
    pool_recycle=1800,  # 接続の再利用時間（秒）
    pool_pre_ping=True  # 接続の有効性を確認
)

# テーブル作成（すでに存在するテーブルはスキップされる）
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# データベース接続テスト
if __name__ == "__main__":
    try:
        db = SessionLocal()
        print("✅ DB接続に成功しました")
        db.close()
    except Exception as e:
        print("❌ エラーが発生しました:", e)
