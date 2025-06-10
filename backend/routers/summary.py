from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from db_control import crud, schemas
from db_control.connect import get_db
from utils.auth import get_current_user_id
import os
from openai import AzureOpenAI
import logging

router = APIRouter(tags=["summary"])
logger = logging.getLogger(__name__)

# Azure OpenAIの設定
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION_CHAT", "2025-01-01-preview"),
    azure_endpoint=os.getenv("AZURE_OPENAI_BASE_URL")
)

@router.post("/api/generate_summary", response_model=schemas.SummaryResponse)
async def generate_summary(
    request: schemas.SummaryRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    文字起こし文章から要約を生成する
    
    Args:
        request (SummaryRequest): 文字起こしIDを含むリクエスト
        user_id (str): 認証されたユーザーID
        db (Session): データベースセッション
        
    Returns:
        SummaryResponse: 生成された要約
    """
    try:
        # 文字起こしデータを取得
        transcript = crud.get_transcript_by_id(db, request.transcript_id)
        if not transcript:
            raise HTTPException(
                status_code=404,
                detail="指定された文字起こしIDのデータが見つかりません"
            )
        
        # デバッグ情報を追加
        logger.info(f"取得した文字起こしデータ: {transcript.__dict__}")
        
        # 動画データを取得してユーザーIDを確認
        video = crud.get_video(db, transcript.video_id)
        if not video:
            raise HTTPException(
                status_code=404,
                detail="動画データが見つかりません"
            )
        
        minutes = crud.get_minutes(db, video.minutes_id)
        if not minutes:
            raise HTTPException(
                status_code=404,
                detail="議事録データが見つかりません"
            )
        
        # ユーザーIDの比較
        if str(minutes.user_id) != str(user_id):
            raise HTTPException(
                status_code=403,
                detail="この議事録へのアクセス権限がありません"
            )
        
        # Azure OpenAIを使用して要約を生成
        try:
            # 文字起こしの内容を取得（content属性を使用）
            transcript_content = transcript.content if hasattr(transcript, 'content') else transcript.text
            
            response = client.chat.completions.create(
                model=os.getenv("AZURE_OPENAI_DEPLOYMENT_CHAT", "gpt-4.1"),
                messages=[
                    {"role": "system", "content": "あなたは会議の議事録を要約する専門家です。与えられた文字起こし文章を、重要なポイントを漏らさず、簡潔にマークダウン記法で要約してください。"},
                    {"role": "user", "content": f"以下の会議の文字起こしを要約してください：\n\n{transcript_content}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            summary_content = response.choices[0].message.content
            
            # 要約を保存
            summary = crud.create_summary(db, request.transcript_id, summary_content)
            
            return {"summary": summary.content}
            
        except Exception as e:
            error_message = f"要約の生成中にエラーが発生しました: {str(e)}"
            logger.error(error_message)
            raise HTTPException(
                status_code=500,
                detail=error_message
            )
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = f"要約の生成中にエラーが発生しました: {str(e)}"
        logger.error(error_message)
        raise HTTPException(
            status_code=500,
            detail=error_message
        )
