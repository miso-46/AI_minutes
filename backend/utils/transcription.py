from openai import AzureOpenAI
import os
from dotenv import load_dotenv
import tempfile
import requests
import mimetypes
import logging
import subprocess
import shutil

# ロギングの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION_WHISPER"),
    azure_endpoint=os.getenv("AZURE_OPENAI_BASE_URL")
)

def compress_video(input_path: str, output_path: str) -> None:
    """
    動画ファイルを圧縮する
    
    Args:
        input_path (str): 入力ファイルのパス
        output_path (str): 出力ファイルのパス
    """
    try:
        # ffmpegを使用して動画を圧縮
        command = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libx264',
            '-crf', '32',  # 圧縮率を上げる（画質は下がるが、処理が速くなる）
            '-preset', 'ultrafast',  # 最速のプリセット
            '-c:a', 'aac',
            '-b:a', '96k',  # 音声ビットレートを下げる
            '-y',  # 既存ファイルを上書き
            output_path
        ]
        
        logger.info("動画の圧縮を開始")
        # リアルタイムでログを出力
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        # 進捗をログに出力
        while True:
            output = process.stderr.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                logger.info(f"圧縮進捗: {output.strip()}")
        
        if process.returncode != 0:
            _, stderr = process.communicate()
            logger.error(f"圧縮エラー: {stderr}")
            raise Exception(f"動画の圧縮に失敗しました: {stderr}")
            
        logger.info("動画の圧縮が完了")
        
    except Exception as e:
        logger.error(f"圧縮処理中にエラーが発生: {str(e)}")
        raise

async def transcribe_video(video_url: str) -> str:
    """
    Azure OpenAIのWhisperを使用して動画の文字起こしを行う
    
    Args:
        video_url (str): 文字起こし対象の動画URL
        
    Returns:
        str: 文字起こし結果のテキスト
    """
    temp_file_path = None
    compressed_file_path = None
    try:
        logger.info(f"動画のダウンロードを開始: {video_url}")
        
        # 動画URLからファイルをダウンロード
        response = requests.get(video_url)
        logger.info(f"ダウンロードレスポンス: status={response.status_code}, headers={dict(response.headers)}")
        
        if response.status_code != 200:
            raise Exception(f"動画のダウンロードに失敗しました: {response.status_code}, レスポンス: {response.text}")
        
        # Content-Typeからファイル形式を取得
        content_type = response.headers.get('content-type', '')
        logger.info(f"Content-Type: {content_type}")
        
        ext = mimetypes.guess_extension(content_type)
        if not ext:
            ext = '.mp4'  # デフォルトの拡張子
        logger.info(f"使用する拡張子: {ext}")
        
        # 一時ファイルとして動画を保存
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
            logger.info(f"一時ファイルを作成: {temp_file_path}")
        
        # 圧縮用の一時ファイルを作成
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as compressed_file:
            compressed_file_path = compressed_file.name
        
        # 動画を圧縮
        compress_video(temp_file_path, compressed_file_path)
        
        # 圧縮後のファイルサイズを確認
        compressed_size = os.path.getsize(compressed_file_path)
        logger.info(f"圧縮後のファイルサイズ: {compressed_size} bytes")
        
        # Azure OpenAIのWhisperを使用して文字起こしを実行
        logger.info("文字起こしを開始")
        with open(compressed_file_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                file=audio_file,
                model=os.getenv("AZURE_OPENAI_DEPLOYMENT_WHISPER")
            )
        logger.info("文字起こしが完了")
        
        return response.text
        
    except Exception as e:
        logger.error(f"エラーが発生: {str(e)}", exc_info=True)
        raise Exception(f"文字起こし処理中にエラーが発生しました: {str(e)}")
    finally:
        # 一時ファイルの削除
        for file_path in [temp_file_path, compressed_file_path]:
            if file_path and os.path.exists(file_path):
                try:
                    os.unlink(file_path)
                    logger.info(f"一時ファイルを削除: {file_path}")
                except Exception as e:
                    logger.error(f"一時ファイルの削除に失敗: {str(e)}")
