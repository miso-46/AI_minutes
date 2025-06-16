from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from db_control import crud, schemas
from db_control.connect import get_db
from utils.auth import get_current_user_id
from utils.embedding import generate_embedding
from utils.similarity import find_similar_chunks, parse_embedding_vector
from utils.chat_response import generate_chat_response
from typing import Optional
import logging
import json

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

@router.post("/api/send_chat", response_model=schemas.ChatSendResponse)
async def send_chat(
    request: schemas.ChatSendRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    チャットメッセージを送信する
    
    Args:
        request (ChatSendRequest): セッションIDとメッセージを含むリクエスト
        user_id (str): 認証されたユーザーID
        db (Session): データベースセッション
        
    Returns:
        ChatSendResponse: メッセージID、役割、メッセージ、作成日時
    """
    try:
        logger.info(f"チャットメッセージ送信リクエスト: session_id={request.session_id}, user_id={user_id}")
        
        # チャットセッションを取得
        chat_session = crud.get_chat_session(db, request.session_id)
        if not chat_session:
            logger.error(f"チャットセッションが見つかりません: session_id={request.session_id}")
            raise HTTPException(
                status_code=404,
                detail="指定されたチャットセッションが見つかりません"
            )
        
        # 議事録の所有者チェック
        minutes = crud.get_minutes(db, chat_session.minutes_id)
        if not minutes:
            logger.error(f"議事録が見つかりません: minutes_id={chat_session.minutes_id}")
            raise HTTPException(
                status_code=404,
                detail="関連する議事録が見つかりません"
            )
        
        if str(minutes.user_id) != str(user_id):
            logger.error(f"アクセス権限がありません: minutes_user_id={minutes.user_id}, request_user_id={user_id}")
            raise HTTPException(
                status_code=403,
                detail="このチャットセッションへのアクセス権限がありません"
            )
        
        # ユーザーメッセージを保存
        user_message = crud.create_chat_message(db, request.session_id, "user", request.message)
        logger.info(f"ユーザーメッセージを保存: message_id={user_message.id}")
        
        # ユーザーメッセージをベクトル化
        try:
            query_embedding_str = await generate_embedding(request.message)
            query_vector = parse_embedding_vector(query_embedding_str)
            logger.info(f"ユーザーメッセージをベクトル化完了")
        except Exception as e:
            logger.error(f"ベクトル化中にエラーが発生: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="メッセージのベクトル化中にエラーが発生しました"
            )
        
        # 文字起こしのチャンクとベクトル埋め込みを取得
        try:
            chunks_with_embeddings = crud.get_transcript_chunks_with_embeddings(db, chat_session.transcript_id)
            logger.info(f"チャンクとベクトル埋め込みを取得: {len(chunks_with_embeddings)}件")
        except Exception as e:
            logger.error(f"チャンクとベクトル埋め込みの取得中にエラーが発生: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="文字起こしデータの取得中にエラーが発生しました"
            )
        
        # 類似度検索を実行
        try:
            similar_chunks = find_similar_chunks(
                query_vector=query_vector,
                chunks_with_embeddings=chunks_with_embeddings,
                threshold=0.65,
                max_results=5
            )
            logger.info(f"類似度検索完了: {len(similar_chunks)}件のマッチ")
        except Exception as e:
            logger.error(f"類似度検索中にエラーが発生: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="類似度検索中にエラーが発生しました"
            )
        
        # 参照情報があるかどうかを判定
        is_referenced = len(similar_chunks) > 0
        
        # アシスタントの応答を生成
        if not similar_chunks:
            # 条件に一致するチャンクが見つからない場合
            assistant_response = "申し訳ございませんが、お探しの内容に関連する情報が見つかりませんでした。別のキーワードや表現で質問を言い換えてみてください。"
            assistant_message = crud.create_chat_message(db, request.session_id, "assistant", assistant_response)
            logger.info(f"アシスタントメッセージを保存（情報なし）: message_id={assistant_message.id}")
        else:
            # 類似度の高いチャンクを基にAIが応答を生成
            try:
                assistant_response = await generate_chat_response(request.message, similar_chunks)
                logger.info(f"AI応答を生成しました: 長さ={len(assistant_response)}文字")
            except Exception as e:
                logger.error(f"AI応答の生成中にエラーが発生: {str(e)}")
                # フォールバック: 従来の方式で応答を生成
                context_chunks = []
                for chunk, embedding, similarity, rank in similar_chunks:
                    context_chunks.append(f"[参考 {rank}] {chunk.content}")
                context = "\n\n".join(context_chunks)
                assistant_response = f"以下の議事録内容に基づいてお答えします：\n\n{context}"
                logger.info(f"フォールバック応答を生成しました")
            
            # アシスタントメッセージを保存
            assistant_message = crud.create_chat_message(db, request.session_id, "assistant", assistant_response)
            logger.info(f"アシスタントメッセージを保存: message_id={assistant_message.id}")
            
            # 参照情報を保存
            for chunk, embedding, similarity, rank in similar_chunks:
                try:
                    crud.create_reference(db, assistant_message.id, chunk.id, rank)
                    logger.info(f"参照情報を保存: chunk_id={chunk.id}, rank={rank}, similarity={similarity:.3f}")
                except Exception as e:
                    logger.warning(f"参照情報の保存中にエラーが発生: {str(e)}")
        
        return {
            "message_id": assistant_message.id,
            "role": assistant_message.role,
            "message": assistant_message.message,
            "created_at": assistant_message.created_at,
            "is_referenced": is_referenced
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = f"チャットメッセージ送信中にエラーが発生しました: {str(e)}"
        logger.error(error_message)
        raise HTTPException(
            status_code=500,
            detail=error_message
        )

@router.get("/api/reference", response_model=schemas.ReferenceResponse)
async def get_references(
    message_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    チャットメッセージに紐づく参照情報を取得する
    
    Args:
        message_id (int): チャットメッセージID
        user_id (str): 認証されたユーザーID
        db (Session): データベースセッション
        
    Returns:
        ReferenceResponse: 参照情報のリスト（rank昇順）
    """
    try:
        logger.info(f"参照情報取得リクエスト: message_id={message_id}, user_id={user_id}")
        
        # チャットメッセージとセッション情報を取得
        message_with_session = crud.get_chat_message_with_session(db, message_id)
        if not message_with_session:
            logger.error(f"チャットメッセージが見つかりません: message_id={message_id}")
            raise HTTPException(
                status_code=404,
                detail="指定されたメッセージが見つかりません"
            )
        
        chat_message, chat_session = message_with_session
        
        # 議事録の所有者チェック
        minutes = crud.get_minutes(db, chat_session.minutes_id)
        if not minutes:
            logger.error(f"議事録が見つかりません: minutes_id={chat_session.minutes_id}")
            raise HTTPException(
                status_code=404,
                detail="関連する議事録が見つかりません"
            )
        
        if str(minutes.user_id) != str(user_id):
            logger.error(f"アクセス権限がありません: minutes_user_id={minutes.user_id}, request_user_id={user_id}")
            raise HTTPException(
                status_code=403,
                detail="このメッセージの参照情報へのアクセス権限がありません"
            )
        
        # 参照情報を取得
        references_with_chunks = crud.get_references_by_message_id(db, message_id)
        logger.info(f"参照情報を取得: {len(references_with_chunks)}件")
        
        # レスポンス形式に変換
        reference_items = []
        for reference, chunk in references_with_chunks:
            reference_items.append({
                "chunk_id": chunk.id,
                "content": chunk.content,
                "rank": reference.rank
            })
        
        return {
            "references": reference_items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = f"参照情報取得中にエラーが発生しました: {str(e)}"
        logger.error(error_message)
        raise HTTPException(
            status_code=500,
            detail=error_message
        )
