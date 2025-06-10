from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import tempfile
import asyncio

load_dotenv()

# Azure Blob Storageの接続情報
account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
container_name_video = os.getenv("AZURE_STORAGE_CONTAINER_VIDEO", "video")

# BlobServiceClientの初期化
blob_service_client = BlobServiceClient(
    account_url=f"https://{account_name}.blob.core.windows.net",
    credential=account_key
)

def generate_sas_url(blob_name: str, container_name: str) -> str:
    """
    SASトークンを含むURLを生成する
    
    Args:
        blob_name (str): ブロブ名
        container_name (str): コンテナ名
        
    Returns:
        str: SASトークンを含むURL
    """
    # SASトークンの有効期限を設定（1時間）
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    # SASトークンを生成
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=expiry
    )
    
    # SASトークンを含むURLを生成
    return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"

async def upload_video(video_file, minutes_id: int) -> str:
    """
    動画ファイルをAzure Blob Storageにアップロードする
    
    Args:
        video_file: アップロードする動画ファイル
        minutes_id (int): 議事録ID
        
    Returns:
        str: アップロードされた動画のURL
    """
    try:
        # コンテナクライアントの取得
        container_client = blob_service_client.get_container_client(container_name_video)
        
        # ブロブ名の生成
        blob_name = f"video_{minutes_id}.mp4"
        
        # ファイルのアップロード（非同期で実行）
        await asyncio.to_thread(
            container_client.upload_blob,
            name=blob_name,
            data=video_file,
            overwrite=True
        )
        
        # SASトークンを含むURLを生成して返す
        return generate_sas_url(blob_name, container_name_video)
        
    except Exception as e:
        raise Exception(f"動画のアップロード中にエラーが発生しました: {str(e)}")
