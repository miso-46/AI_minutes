import json
import numpy as np
from typing import List, Tuple
from sklearn.metrics.pairwise import cosine_similarity

def calculate_cosine_similarity(vector1: List[float], vector2: List[float]) -> float:
    """
    2つのベクトル間のコサイン類似度を計算する
    
    Args:
        vector1 (List[float]): 比較対象のベクトル1
        vector2 (List[float]): 比較対象のベクトル2
        
    Returns:
        float: コサイン類似度（0から1の値）
    """
    try:
        # numpy配列に変換
        v1 = np.array(vector1).reshape(1, -1)
        v2 = np.array(vector2).reshape(1, -1)
        
        # コサイン類似度を計算
        similarity = cosine_similarity(v1, v2)[0][0]
        return float(similarity)
    except Exception as e:
        raise Exception(f"コサイン類似度計算中にエラーが発生しました: {str(e)}")

def find_similar_chunks(
    query_vector: List[float], 
    chunks_with_embeddings: List[Tuple], 
    threshold: float = 0.65, 
    max_results: int = 5
) -> List[Tuple]:
    """
    クエリベクトルと類似するチャンクを見つける
    
    Args:
        query_vector (List[float]): 検索クエリのベクトル
        chunks_with_embeddings (List[Tuple]): (chunk, embedding)のタプルのリスト
        threshold (float): 類似度の閾値（デフォルト: 0.65）
        max_results (int): 最大結果数（デフォルト: 5）
        
    Returns:
        List[Tuple]: (chunk, embedding, similarity, rank)のタプルのリスト
    """
    try:
        similarities = []
        
        for chunk, embedding in chunks_with_embeddings:
            # JSONから埋め込みベクトルをパース
            embedding_vector = json.loads(embedding.embedding)
            
            # 類似度を計算
            similarity = calculate_cosine_similarity(query_vector, embedding_vector)
            
            # 閾値以上の場合のみ追加
            if similarity >= threshold:
                similarities.append((chunk, embedding, similarity))
        
        # 類似度で降順ソート
        similarities.sort(key=lambda x: x[2], reverse=True)
        
        # 最大結果数まで取得し、rankを追加
        results = []
        for rank, (chunk, embedding, similarity) in enumerate(similarities[:max_results], 1):
            results.append((chunk, embedding, similarity, rank))
        
        return results
        
    except Exception as e:
        raise Exception(f"類似チャンク検索中にエラーが発生しました: {str(e)}")

def parse_embedding_vector(embedding_str: str) -> List[float]:
    """
    JSON文字列からベクトルをパースする
    
    Args:
        embedding_str (str): JSON形式のベクトル文字列
        
    Returns:
        List[float]: ベクトルのリスト
    """
    try:
        return json.loads(embedding_str)
    except Exception as e:
        raise Exception(f"ベクトルのパース中にエラーが発生しました: {str(e)}") 