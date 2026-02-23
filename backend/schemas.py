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
    teacher_type: str = "teacher"

class DeleteClassRequest(BaseModel):
    institution_id: str
    class_id: str
    teacher_type: str = "teacher"

class AssignClassRequest(BaseModel):
    student_id: str
    class_id: Optional[str] = None
    teacher_type: str = "teacher"

# --- Assignment Template Schemas ---

class CreateAssignmentTemplateRequest(BaseModel):
    teacher_id: str
    name: str # e.g. "TYT Başlangıç Kampı"
    items: List[Any]

class DeleteAssignmentTemplateRequest(BaseModel):
    teacher_id: str
    template_id: str

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


# --- Communication Schemas ---

class CreateAnnouncementRequest(BaseModel):
    institution_id: str
    author_id: str
    title: str
    content: str
    class_id: Optional[str] = None # If None, it's for the whole institution
    image_url: Optional[str] = None

class CreateMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    # metadata for push notifications etc.

class CreateMaterialRequest(BaseModel):
    institution_id: str
    teacher_id: str
    title: str
    file_url: str
    type: str # 'pdf', 'video', 'link'
    class_id: Optional[str] = None

class CreateCalendarEventRequest(BaseModel):
    institution_id: str
    title: str
    description: Optional[str] = None
    date: str # ISO format or YYYY-MM-DD
    type: str # 'trial', 'exam', 'holiday', 'other'
    class_id: Optional[str] = None


# --- Friends Schemas ---

class SearchUserRequest(BaseModel):
    query: str
    current_user_id: str

class FriendRequestAction(BaseModel):
    request_id: str
    action: str  # "accept" | "decline"

class SendFriendRequest(BaseModel):
    sender_id: str
    receiver_id: str

