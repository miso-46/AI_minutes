# get_current_user_id()を作成
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from db_control.connect import get_db
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import requests
import httpx
import logging
from typing import Optional

load_dotenv()

logger = logging.getLogger(__name__)
security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# アクセストークンからユーザーIDを取得
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    アクセストークンからユーザーIDを取得する
    
    Args:
        credentials (HTTPAuthorizationCredentials): 認証情報
        
    Returns:
        str: ユーザーID
        
    Raises:
        HTTPException: 認証に失敗した場合
    """
    try:
        # Supabaseの認証エンドポイントにリクエスト
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{os.getenv('SUPABASE_URL')}/auth/v1/user",
                headers={
                    "apikey": os.getenv("SUPABASE_API_KEY"),
                    "Authorization": f"Bearer {credentials.credentials}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="認証に失敗しました"
                )
            
            user_data = response.json()
            return user_data["id"]
            
    except Exception as e:
        logger.error(f"認証中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました"
        )