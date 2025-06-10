from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db_control import models, schemas, crud, connect
from routers import minutes
import os
from dotenv import load_dotenv
from utils.auth import get_current_user_id  #あとで消す

app = FastAPI()

# 環境変数の読み込み
load_dotenv()

# フロントエンドのURLを環境変数から取得
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")  # デフォルトをローカル開発環境に設定

# CORSの設定 フロントエンドからの接続を許可する部分
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],  # 許可するオリジン
    allow_credentials=True, # Cookie や認証情報を許可
    allow_methods=["*"], # すべてのHTTPメソッド（GET, POST, PUT, DELETEなど）を許可
    allow_headers=["*"] # すべてのHTTPヘッダーを許可
)

# DB初期化
models.Base.metadata.create_all(bind=connect.engine)

# ルーターを追加
app.include_router(minutes.router)

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/test-user-id") #あとで消す
def test_user_id(user_id: str = Depends(get_current_user_id)):
    return {"user_id": user_id}