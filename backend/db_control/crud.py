from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
import uuid
import os

async def create_minutes(db: Session, user_id: str, filename: str = None) -> int:
    # ファイル名から拡張子を除去
    title = os.path.splitext(filename)[0] if filename else f"議事録_{func.now()}"
    
    db_minutes = models.Minutes(
        user_id=user_id,
        title=title
    )
    db.add(db_minutes)
    db.commit()
    db.refresh(db_minutes)
    return db_minutes.id

async def create_video(db: Session, minutes_id: int, video_url: str = None) -> int:
    db_video = models.Video(
        minutes_id=minutes_id,
        video_url=video_url,
        image_url=None,  # サムネイル画像はしばらく使用しない
        status="queued",
        progress=0
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video.id

async def update_video_status(db: Session, minutes_id: int, status: str, progress: int = None):
    video = db.query(models.Video).filter(models.Video.minutes_id == minutes_id).first()
    if video:
        video.status = status
        if progress is not None:
            video.progress = progress
        db.commit()

async def create_transcript(db: Session, video_id: int, content: str) -> int:
    db_transcript = models.Transcript(
        video_id=video_id,
        content=content,
        is_summaried=False,
        is_embedded=False
    )
    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)
    return db_transcript.id

async def create_transcript_chunk(db: Session, transcript_id: int, chunk_index: int, content: str) -> int:
    db_chunk = models.TranscriptChunk(
        transcript_id=transcript_id,
        chunk_index=chunk_index,
        content=content
    )
    db.add(db_chunk)
    db.commit()
    db.refresh(db_chunk)
    return db_chunk.id

async def create_vector_embedding(db: Session, chunk_id: int, embedding: str) -> int:
    db_embedding = models.VectorEmbedding(
        chunk_id=chunk_id,
        embedding=embedding
    )
    db.add(db_embedding)
    db.commit()
    db.refresh(db_embedding)
    return db_embedding.id

def get_minutes(db: Session, minutes_id: int):
    minutes = db.query(models.Minutes).filter(models.Minutes.id == minutes_id).first()
    if minutes:
        print(f"get_minutes - 取得したデータ: id={minutes.id}, user_id={minutes.user_id}, title={minutes.title}")
    else:
        print(f"get_minutes - データが見つかりません: minutes_id={minutes_id}")
    return minutes

def get_video(db: Session, minutes_id: int):
    return db.query(models.Video).filter(models.Video.minutes_id == minutes_id).first()

def get_transcript(db: Session, video_id: int):
    return db.query(models.Transcript).filter(models.Transcript.video_id == video_id).first()

async def update_video_progress(db: Session, minutes_id: int, progress: int) -> bool:
    """
    動画の処理進捗を更新する
    
    Args:
        db (Session): データベースセッション
        minutes_id (int): 議事録ID
        progress (int): 進捗状況（0-100）
        
    Returns:
        bool: 更新が成功したかどうか
    """
    try:
        video = db.query(models.Video).filter(models.Video.minutes_id == minutes_id).first()
        if not video:
            return False
        
        video.progress = progress
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"進捗更新中にエラーが発生: {str(e)}")
        return False

async def update_transcript_embedded(db: Session, transcript_id: int) -> bool:
    """
    文字起こしデータの埋め込み完了フラグを更新する
    
    Args:
        db (Session): データベースセッション
        transcript_id (int): 文字起こしID
        
    Returns:
        bool: 更新が成功したかどうか
    """
    try:
        transcript = db.query(models.Transcript).filter(models.Transcript.id == transcript_id).first()
        if not transcript:
            return False
        
        transcript.is_embedded = True
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"文字起こしの埋め込みフラグ更新中にエラーが発生: {str(e)}")
        return False
