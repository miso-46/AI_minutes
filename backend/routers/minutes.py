from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import List
import asyncio
from db_control import crud, schemas
from utils.auth import get_current_user_id
from utils import transcription, storage, chunk, embedding
from sqlalchemy.orm import Session
from db_control.connect import get_db
import tempfile
import os

router = APIRouter()

ALLOWED_EXTENSIONS = {'mp4', 'mov'}

def validate_video_file(file: UploadFile) -> bool:
    return file.filename.split('.')[-1].lower() in ALLOWED_EXTENSIONS

@router.post("/api/upload_video", response_model=schemas.VideoUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    # ファイル形式のバリデーション
    if not validate_video_file(file):
        raise HTTPException(
            status_code=400,
            detail="無効なファイル形式です。mp4またはmov形式のファイルをアップロードしてください。"
        )
    
    try:
        # minutes_idの生成とDBへの保存（ファイル名を渡す）
        minutes_id = await crud.create_minutes(db, user_id=user_id, filename=file.filename)
        
        # 動画データをDBに保存（status: queued）
        video_id = await crud.create_video(db, minutes_id, None)
        
        # 一時ファイルに保存
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # バックグラウンドタスクとして処理を開始
        background_tasks.add_task(process_video, temp_file.name, minutes_id, db)
        
        return schemas.VideoUploadResponse(
            minutes_id=minutes_id,
            status="queued"
        )
        
    except Exception as e:
        # エラー発生時の処理
        error_message = f"動画のアップロード中にエラーが発生しました: {str(e)}"
        print(error_message)  # ログ出力
        raise HTTPException(
            status_code=500,
            detail=error_message
        )

async def process_video(file_path: str, minutes_id: int, db: Session):
    try:
        # 処理開始を通知
        await crud.update_video_status(db, minutes_id, "processing")
        
        # 1. 動画をAzure Blob Storageにアップロード
        with open(file_path, 'rb') as f:
            video_url = await storage.upload_video(f, minutes_id)
        if not video_url:
            raise Exception("動画のアップロードに失敗しました")
        
        # 2. 動画データのURLを更新
        video = await crud.get_video(db, minutes_id)
        if not video:
            raise Exception("動画データが見つかりません")
        video.video_url = video_url
        db.commit()
        
        # 3. 文字起こしの実行
        transcript_content = await transcription.transcribe_video(video_url)
        if not transcript_content:
            raise Exception("文字起こしに失敗しました")
        
        # 4. 文字起こしデータの保存
        transcript_id = await crud.create_transcript(db, video.id, transcript_content)
        if not transcript_id:
            raise Exception("文字起こしデータの保存に失敗しました")
        
        # 5. チャンク分割
        chunks = chunk.split_into_chunks(transcript_content)
        if not chunks:
            raise Exception("チャンク分割に失敗しました")
        
        # 6. チャンクの保存とベクトル化
        for i, chunk_content in enumerate(chunks):
            chunk_id = await crud.create_transcript_chunk(db, transcript_id, i, chunk_content)
            if not chunk_id:
                raise Exception("チャンクの保存に失敗しました")
                
            embedding_vector = await embedding.generate_embedding(chunk_content)
            if not embedding_vector:
                raise Exception("ベクトル化に失敗しました")
                
            await crud.create_vector_embedding(db, chunk_id, embedding_vector)
        
        # 7. 処理完了の更新
        await crud.update_video_status(db, minutes_id, "completed")
        
    except Exception as e:
        # エラー発生時の処理
        error_message = f"動画処理中にエラーが発生しました: {str(e)}"
        print(error_message)  # ログ出力
        try:
            db.rollback()  # トランザクションをロールバック
            await crud.update_video_status(db, minutes_id, "failed")
        except Exception as update_error:
            print(f"ステータス更新中にエラーが発生: {str(update_error)}")
        raise Exception(error_message)
    finally:
        # 一時ファイルの削除
        try:
            os.unlink(file_path)
        except Exception as e:
            print(f"一時ファイルの削除に失敗: {str(e)}")
