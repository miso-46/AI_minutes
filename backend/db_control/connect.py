from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from db_control.models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# テーブル作成（すでに存在するテーブルはスキップされる）
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# get_db()をコメントアウトして以下で接続確認
# if __name__ == "__main__":
#     try:
#         db = SessionLocal()
#         print("✅ DB接続に成功しました")
#         db.close()
#     except Exception as e:
#         print("❌ エラーが発生しました:", e)
