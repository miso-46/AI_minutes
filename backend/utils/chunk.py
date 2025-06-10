def split_into_chunks(text: str, chunk_size: int = 400, overlap: int = 50) -> list:
    """
    テキストを指定されたサイズのチャンクに分割する
    
    Args:
        text (str): 分割するテキスト
        chunk_size (int): チャンクのサイズ（文字数）
        overlap (int): チャンク間のオーバーラップ（文字数）
        
    Returns:
        list: チャンクのリスト
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        # チャンクの終了位置を計算
        end = start + chunk_size
        
        # テキストの終わりに達した場合
        if end >= text_length:
            chunks.append(text[start:])
            break
        
        # 文の区切りで分割するために、最後の句点を探す
        last_period = text.rfind('。', start, end)
        if last_period != -1:
            end = last_period + 1
        
        # チャンクを追加
        chunks.append(text[start:end])
        
        # 次のチャンクの開始位置を計算（オーバーラップを考慮）
        start = end - overlap
    
    return chunks
