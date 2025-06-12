from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from db_control import crud, schemas
from db_control.connect import get_db
from utils.auth import get_current_user_id
from typing import Optional
import logging

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)

@router.post("/api/start_chat", response_model=schemas.ChatStartResponse)
async def start_chat(
    request: schemas.ChatStartRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    チャットを開始する
    
    Args:
        request (ChatStartRequest): 議事録IDを含むリクエスト
        user_id (str): 認証されたユーザーID
        db (Session): データベースセッション
        
    Returns:
        ChatStartResponse: チャット開始の結果（埋め込み状態とセッションID）
    """
    try:
        logger.info(f"チャット開始リクエスト: minutes_id={request.minutes_id}, user_id={user_id}")
        
        # 議事録データを取得
        minutes = crud.get_minutes(db, request.minutes_id)
        if not minutes:
            logger.error(f"議事録が見つかりません: minutes_id={request.minutes_id}")
            raise HTTPException(
                status_code=404,
                detail="指定された議事録IDのデータが見つかりません"
            )
        
        # ユーザーIDの比較
        if str(minutes.user_id) != str(user_id):
            logger.error(f"アクセス権限がありません: minutes_user_id={minutes.user_id}, request_user_id={user_id}")
            raise HTTPException(
                status_code=403,
                detail="この議事録へのアクセス権限がありません"
            )
        
        # 動画データを取得
        video = crud.get_video_by_minutes_id(db, request.minutes_id)
        if not video:
            logger.error(f"動画データが見つかりません: minutes_id={request.minutes_id}")
            raise HTTPException(
                status_code=404,
                detail="動画データが見つかりません"
            )
        
        # 文字起こしデータを取得
        transcript = crud.get_transcript_by_video_id(db, video.id)
        if not transcript:
            logger.error(f"文字起こしデータが見つかりません: video_id={video.id}")
            raise HTTPException(
                status_code=404,
                detail="文字起こしデータが見つかりません"
            )
        
        # 埋め込み状態を確認
        is_embedded = transcript.is_embedded
        logger.info(f"埋め込み状態: is_embedded={is_embedded}")
        
        # 埋め込みが完了している場合のみセッションIDを生成
        session_id = None
        if is_embedded:
            try:
                # 既存のチャットセッションを確認
                existing_session = crud.get_chat_session_by_minutes_and_transcript(
                    db, request.minutes_id, transcript.id
                )
                
                if existing_session:
                    # 既存のセッションIDを返す
                    session_id = existing_session.id
                    logger.info(f"既存のチャットセッションを使用: session_id={session_id}")
                else:
                    # 新しいチャットセッションを作成
                    chat_session = crud.create_chat_session(db, request.minutes_id, transcript.id)
                    session_id = chat_session.id
                    logger.info(f"新しいチャットセッションを作成: session_id={session_id}")
            except IntegrityError as e:
                logger.error(f"チャットセッションの作成中に整合性エラーが発生: {str(e)}")
                raise HTTPException(
                    status_code=409,
                    detail="チャットセッションの作成に失敗しました"
                )
            except Exception as e:
                logger.error(f"チャットセッションの作成中にエラーが発生: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="チャットセッションの作成中にエラーが発生しました"
                )
        
        return {
            "is_embedded": is_embedded,
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = f"チャット開始中にエラーが発生しました: {str(e)}"
        logger.error(error_message)
        raise HTTPException(
            status_code=500,
            detail=error_message
        )
