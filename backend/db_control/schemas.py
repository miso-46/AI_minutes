from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VideoUploadResponse(BaseModel):
    minutes_id: int
    status: str

class MinutesBase(BaseModel):
    user_id: str
    title: str

class MinutesCreate(MinutesBase):
    pass

class Minutes(MinutesBase):
    id: int
    created_at: datetime
    is_deleted: bool = False

    class Config:
        from_attributes = True

class VideoBase(BaseModel):
    minutes_id: int
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    progress: Optional[int] = None

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: int
    created_at: datetime
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TranscriptBase(BaseModel):
    video_id: int
    content: str
    is_summaried: bool = False
    is_embedded: bool = False

class TranscriptCreate(TranscriptBase):
    pass

class Transcript(TranscriptBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TranscriptChunkBase(BaseModel):
    transcript_id: int
    chunk_index: int
    content: str

class TranscriptChunkCreate(TranscriptChunkBase):
    pass

class TranscriptChunk(TranscriptChunkBase):
    id: int

    class Config:
        from_attributes = True

class VectorEmbeddingBase(BaseModel):
    chunk_id: int
    embedding: str

class VectorEmbeddingCreate(VectorEmbeddingBase):
    pass

class VectorEmbedding(VectorEmbeddingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
