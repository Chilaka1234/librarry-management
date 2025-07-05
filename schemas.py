from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address: str

class UserCreate(UserBase):
    membership_type: str = "basic"

class User(UserBase):
    id: int
    membership_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    genre: str
    publication_year: int

class BookCreate(BookBase):
    quantity: int = 1

class Book(BookBase):
    id: int
    quantity: int
    available: int
    added_at: datetime
    
    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    name: str
    description: str
    price: float

class ServiceCreate(ServiceBase):
    duration_days: int = 7

class Service(ServiceBase):
    id: int
    duration_days: int
    is_active: bool
    
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    user_id: int
    service_id: int
    amount: float

class TransactionCreate(TransactionBase):
    book_id: Optional[int] = None
    due_date: Optional[datetime] = None

class Transaction(TransactionBase):
    id: int
    book_id: Optional[int]
    status: str
    transaction_date: datetime
    due_date: Optional[datetime]
    completed_date: Optional[datetime]
    
    class Config:
        from_attributes = True
