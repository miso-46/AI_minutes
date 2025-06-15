from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
import tempfile
import asyncio
from urllib.parse import urlparse, unquote, quote_plus


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

def extract_blob_name_from_url(url: str) -> str:
    """
    Azure Blob StorageのURLからブロブ名を抽出する
    
    Args:
        url (str): Azure Blob StorageのURL
        
    Returns:
        str: ブロブ名
    """
    # URLの例: https://accountname.blob.core.windows.net/container/blob_name?sas_token
    # または: blob_name のみの場合もある
    
    if url.startswith("https://"):
        # フルURLの場合、ブロブ名を抽出
        parts = url.split("/")
        if len(parts) >= 5:
            blob_name = parts[-1].split("?")[0]  # SASトークンを除去
            return blob_name
    
    # すでにブロブ名のみの場合はそのまま返す
    return url.split("?")[0]  # SASトークンがある場合は除去
def _extract_blob_name(blob_name_or_url: str, container: str) -> str:
    """
    フル URL または blob 名から **URL デコード済み** の blob 名を返す。
    """
    if blob_name_or_url.startswith("http"):
        # 例: https://acc.blob.core.../video/i3...%3D
        path = urlparse(blob_name_or_url).path.lstrip("/")      # video/i3...%3D
        if path.startswith(container + "/"):
            path = path[len(container) + 1 :]                   # i3...%3D
        blob_enc = path
    else:
        blob_enc = blob_name_or_url                             # すでに blob 名
    return unquote(blob_enc)  # i3pKKo3p1eYPR5Xz4N4Y=  ← "=" が戻る!

def generate_sas_url(blob_name: str, container_name: str) -> str:
    """
    指定 blob を 1 時間ダウンロード可能な SAS URL に変換して返す。
    blob_name は **フル URL でも blob 名だけでも可**。
    """
    raw_blob_name = _extract_blob_name(blob_name, container_name)

    now_utc = datetime.utcnow().replace(tzinfo=timezone.utc)

    sas_token = generate_blob_sas(
        account_name   = account_name,
        container_name = container_name,
        blob_name      = raw_blob_name,                 # デコード済み!
        account_key    = account_key,
        permission     = BlobSasPermissions(read=True),
        expiry         = now_utc + timedelta(hours=1),  # 有効期限
        start          = now_utc - timedelta(minutes=30),  # 時計ずれ吸収
        version        = "2023-11-03",                  # devtools と揃える
    )

    # URL に載せるときだけ再エンコード
    blob_name_url = quote_plus(raw_blob_name)           # '=' → %3D

    return (
        f"https://{account_name}.blob.core.windows.net/"
        f"{container_name}/{blob_name_url}?{sas_token}"
    )
# def generate_sas_url(blob_name: str, container_name: str) -> str:
#     """
#     SASトークンを含むURLを生成する
    
#     Args:
#         blob_name (str): ブロブ名またはフルURL
#         container_name (str): コンテナ名
        
#     Returns:
#         str: SASトークンを含むURL
#     """
#     # ブロブ名を抽出
#     actual_blob_name = extract_blob_name_from_url(blob_name)
    
#     # SASトークンの有効期限を設定（1時間）
#     expiry = datetime.utcnow() + timedelta(hours=1)
    
#     # SASトークンを生成
#     sas_token = generate_blob_sas(
#         account_name=account_name,
#         container_name=container_name,
#         blob_name=actual_blob_name,
#         account_key=account_key,
#         permission=BlobSasPermissions(read=True),
#         expiry=expiry
#     )
    
#     # SASトークンを含むURLを生成
#     return f"https://{account_name}.blob.core.windows.net/{container_name}/{actual_blob_name}?{sas_token}"

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
