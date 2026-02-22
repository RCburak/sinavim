from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Any

# --- Auth Schemas ---

class RegisterRequest(BaseModel):
    uid: str
    email: EmailStr
    name: str

class LoginRequest(BaseModel):
    email: EmailStr

class SyncUserRequest(BaseModel):
    uid: str
    email: EmailStr
    name: str

class UpdateProfileRequest(BaseModel):
    user_id: str
    name: str

# --- Admin Schemas ---

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class CreateTeacherRequest(BaseModel):
    admin_id: str
    name: str
    teacher_type: str = "teacher"  # "teacher" | "rehber"

class DeleteTeacherRequest(BaseModel):
    teacher_id: str
    admin_id: str

class CompleteRegistrationRequest(BaseModel):
    token: str
    email: EmailStr
    password: str = Field(..., min_length=6)

class UpdateInviteCodeRequest(BaseModel):
    teacher_id: str
    admin_id: str
    new_code: str

class UpdateSettingsRequest(BaseModel):
    admin_id: str
    name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

# --- Teacher Schemas ---

class TeacherLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class AssignProgramRequest(BaseModel):
    student_id: str
    program: List[Any]  # Complex nested structure, keeping as Any or list for now

class ApproveStudentRequest(BaseModel):
    student_id: str

class CreateClassRequest(BaseModel):
    institution_id: str
    name: str

class DeleteClassRequest(BaseModel):
    institution_id: str
    class_id: str

class AssignClassRequest(BaseModel):
    student_id: str
    class_id: Optional[str] = None

# --- Question Schemas ---

class UpdateQuestionStatusRequest(BaseModel):
    user_id: str
    solved: bool

# --- Program Schemas ---

class SaveProgramRequest(BaseModel):
    user_id: str
    program: List[Any]

class ArchiveProgramRequest(BaseModel):
    user_id: str
    type: str = "manual"

# --- Institution Schemas ---

class JoinInstitutionRequest(BaseModel):
    code: str
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None

class LeaveInstitutionRequest(BaseModel):
    user_id: str

# --- Analiz Schemas ---

class AddAnalizRequest(BaseModel):
    user_id: str
    ad: str
    net: float
    type: str = "Diğer"
    date: Optional[str] = None

    @field_validator('net', mode='after')
    def validate_net_positive(cls, v):
        if v < 0:
            raise ValueError("Net value cannot be negative")
        return v
    
    @field_validator('net', mode='before')
    def parse_net(cls, v):
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                raise ValueError("Invalid net value")
        return v
