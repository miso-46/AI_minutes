from openai import AzureOpenAI
import os
from dotenv import load_dotenv
import logging
from typing import List, Tuple

load_dotenv()

logger = logging.getLogger(__name__)

# Azure OpenAIの設定
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION_CHAT", "2025-01-01-preview"),
    azure_endpoint=os.getenv("AZURE_OPENAI_BASE_URL")
)

async def generate_chat_response(user_question: str, related_chunks: List[Tuple]) -> str:
    """
    Azure OpenAIのチャットモデルを使用してユーザーの質問に対する応答を生成する
    
    Args:
        user_question (str): ユーザーの質問
        related_chunks (List[Tuple]): (chunk, embedding, similarity, rank)のタプルのリスト
        
    Returns:
        str: 生成された応答
        
    Raises:
        Exception: 応答生成中にエラーが発生した場合
    """
    try:
        # 関連チャンクのコンテンツを抽出
        context_parts = []
        for chunk, embedding, similarity, rank in related_chunks:
            context_parts.append(f"[参考情報{rank}] {chunk.content}")
        
        context = "\n\n".join(context_parts)
        
        # システムプロンプトの設定
        system_prompt = """あなたは議事録の内容に基づいて質問に答えるAIアシスタントです。
以下のルールに従って回答してください：

1. 提供された議事録の参考情報のみを基に回答してください
2. 参考情報にない内容は推測や補足をしないでください
3. 回答は簡潔で分かりやすく、日本語で行ってください
"""
        
        # ユーザープロンプトの設定
        user_prompt = f"""質問: {user_question}

参考情報:
{context}

上記の参考情報に基づいて、質問に答えてください。"""
        
        # Azure OpenAIのチャットモデルに送信
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_CHAT"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # 一貫性のある応答のため低めに設定
            max_tokens=800    # 応答の長さを制限
        )
        
        generated_response = response.choices[0].message.content
        logger.info(f"チャット応答を生成しました: 長さ={len(generated_response)}文字")
        
        return generated_response
        
    except Exception as e:
        error_message = f"チャット応答の生成中にエラーが発生しました: {str(e)}"
        logger.error(error_message)
        raise Exception(error_message)
