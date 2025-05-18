from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    email: str
    username: Optional[str] = None
    display_name: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    display_name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None 