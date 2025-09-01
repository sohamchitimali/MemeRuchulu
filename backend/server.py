from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import requests
import aiofiles
import base64
from io import BytesIO
from PIL import Image
import json
import asyncio
from filelock import FileLock

# Updated Google Gemini imports
from google import genai
from google.genai import types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Local storage setup
STORAGE_DIR = ROOT_DIR / 'data'
MEMES_FILE = STORAGE_DIR / 'memes.json'
STATUS_FILE = STORAGE_DIR / 'status.json'

# Create storage directory if it doesn't exist
STORAGE_DIR.mkdir(exist_ok=True)

# Initialize storage files if they don't exist
if not MEMES_FILE.exists():
    with open(MEMES_FILE, 'w') as f:
        json.dump([], f)

if not STATUS_FILE.exists():
    with open(STATUS_FILE, 'w') as f:
        json.dump([], f)

# File locks for thread-safe operations
memes_lock = FileLock(str(MEMES_FILE) + '.lock')
status_lock = FileLock(str(STATUS_FILE) + '.lock')

# Initialize Google Gemini client with new pattern
try:
    api_key = os.environ.get('GOOGLE_AI_API_KEY', '')
    if not api_key:
        raise ValueError("GOOGLE_AI_API_KEY not found in environment variables")
    # Initialize with the new SDK pattern
    gemini_client = genai.Client(api_key=api_key)
except Exception as e:
    logging.error(f"Failed to initialize Gemini client: {e}")
    gemini_client = None

# Create the main app without a prefix
app = FastAPI(title="Meme Ruchulu API", description="AI-enhanced meme creation platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class MemeTemplate(BaseModel):
    id: str
    name: str
    url: str
    box_count: int
    width: int
    height: int

class UserMeme(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    meme_url: str
    template_id: Optional[str] = None
    prompt_used: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_ai_generated: bool = False

class UserMemeCreate(BaseModel):
    user_id: str
    meme_url: str
    template_id: Optional[str] = None
    prompt_used: Optional[str] = None
    is_ai_generated: bool = False

class AIImageRequest(BaseModel):
    prompt: str
    reference_image_base64: Optional[str] = None
    user_id: str

class ManualMemeRequest(BaseModel):
    template_id: str
    text_boxes: List[Dict[str, Any]]
    user_id: str

# Local storage helper functions
async def read_json_file(file_path: Path, lock: FileLock) -> List[Dict]:
    """Read JSON file with file locking for thread safety"""
    with lock:
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error reading {file_path}: {e}")
            return []

async def write_json_file(file_path: Path, data: List[Dict], lock: FileLock) -> bool:
    """Write JSON file with file locking for thread safety"""
    with lock:
        try:
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            return True
        except Exception as e:
            logging.error(f"Error writing to {file_path}: {e}")
            return False

async def append_to_json_file(file_path: Path, item: Dict, lock: FileLock) -> bool:
    """Append item to JSON file"""
    data = await read_json_file(file_path, lock)
    data.append(item)
    return await write_json_file(file_path, data, lock)

async def delete_from_json_file(file_path: Path, condition: Dict, lock: FileLock) -> bool:
    """Delete items from JSON file based on condition"""
    data = await read_json_file(file_path, lock)
    original_count = len(data)
    data = [item for item in data if not all(item.get(k) == v for k, v in condition.items())]
    if len(data) < original_count:
        return await write_json_file(file_path, data, lock)
    return False

async def find_in_json_file(file_path: Path, condition: Dict, lock: FileLock) -> List[Dict]:
    """Find items in JSON file based on condition"""
    data = await read_json_file(file_path, lock)
    return [item for item in data if all(item.get(k) == v for k, v in condition.items())]

# Utility functions
async def download_image_as_base64(url: str) -> str:
    """Download image from URL and convert to base64"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to download image from {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")

async def base64_to_pil_image(base64_string: str) -> Image.Image:
    """Convert base64 string to PIL Image"""
    try:
        image_data = base64.b64decode(base64_string)
        return Image.open(BytesIO(image_data))
    except Exception as e:
        logging.error(f"Failed to convert base64 to PIL Image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

async def pil_image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    try:
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to convert PIL Image to base64: {e}")
        raise HTTPException(status_code=500, detail=f"Image processing error: {str(e)}")

# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "Meme Ruchulu API - AI Enhanced Meme Creation Platform (Local Storage)"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    await append_to_json_file(STATUS_FILE, status_obj.dict(), status_lock)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await read_json_file(STATUS_FILE, status_lock)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Meme Template endpoints using Memegen.link API
@api_router.get("/templates", response_model=List[MemeTemplate])
async def get_meme_templates():
    """Fetch popular meme templates from Memegen.link API"""
    try:
        response = requests.get("https://api.memegen.link/templates/", timeout=10)
        response.raise_for_status()
        templates_data = response.json()
        
        templates = []
        # Get all available templates
        for template_info in templates_data:
            template = MemeTemplate(
                id=template_info.get('id', ''),
                name=template_info.get('name', template_info.get('id', '').replace('_', ' ').title()),
                url=template_info.get('example', {}).get('url', f"https://api.memegen.link/images/{template_info.get('id', '')}.png"),
                box_count=template_info.get('lines', 2),
                width=500,
                height=500
            )
            templates.append(template)
        
        return templates
    except Exception as e:
        logging.error(f"Failed to fetch templates from Memegen.link: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch templates: {str(e)}")

@api_router.get("/templates/{template_id}")
async def get_template_details(template_id: str):
    """Get detailed information about a specific template"""
    try:
        response = requests.get(f"https://api.memegen.link/templates/{template_id}", timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logging.error(f"Failed to fetch template {template_id}: {e}")
        raise HTTPException(status_code=404, detail=f"Template not found: {str(e)}")

# Manual meme creation using Memegen.link
@api_router.post("/create-meme-manual")
async def create_meme_manual(request: ManualMemeRequest):
    """Create a meme using manual text editing with Memegen.link API"""
    try:
        # Build the memegen.link URL
        text_parts = []
        for text_box in request.text_boxes:
            text = text_box.get('text', '').strip()
            # Replace spaces with underscores and handle special characters
            text = text.replace(' ', '_').replace('?', '~q').replace('#', '~h').replace('/', '~s')
            text_parts.append(text if text else '_')
        
        # Ensure we have at least 2 text parts for most templates
        while len(text_parts) < 2:
            text_parts.append('_')
        
        # Build the meme URL
        meme_url = f"https://api.memegen.link/images/{request.template_id}/{'/'.join(text_parts)}.png"
        
        # Create user meme record
        user_meme = UserMeme(
            user_id=request.user_id,
            meme_url=meme_url,
            template_id=request.template_id,
            is_ai_generated=False
        )
        
        # Save to local storage
        await append_to_json_file(MEMES_FILE, user_meme.dict(), memes_lock)
        
        return {
            "success": True,
            "meme_url": meme_url,
            "meme_id": user_meme.id,
            "message": "Meme created successfully using manual editing"
        }
    except Exception as e:
        logging.error(f"Failed to create manual meme: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create meme: {str(e)}")

@api_router.post("/create-meme-ai")
async def create_meme_ai(request: AIImageRequest):
    
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini AI client not initialized")

    try:
        # Default enhanced prompt
        enhanced_prompt = f"Create a funny meme image with the following concept: {request.prompt}. Make it humorous and visually appealing as a meme."

        contents = [enhanced_prompt]

        # If a reference image is provided
        if request.reference_image_base64:
            reference_image = await base64_to_pil_image(request.reference_image_base64)
            contents = [
                f"Using the provided image as reference, create a funny meme based on: {request.prompt}. Make it humorous and meme-worthy.",
                reference_image
            ]

        # Call Gemini
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=contents,
            config={
                "response_modalities": ["TEXT", "IMAGE"]
            }   
        )

        generated_image_base64 = None
        response_text = None

        # Extract text + image from response
        for part in response.candidates[0].content.parts:
            if part.text:
                response_text = part.text
            elif part.inline_data and part.inline_data.data:
                try:
                    image_bytes = part.inline_data.data
                    generated_image = Image.open(BytesIO(image_bytes))

                    buffer = BytesIO()
                    generated_image.save(buffer, format="PNG")
                    buffer.seek(0)
                    generated_image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
                except Exception as img_error:
                    raise HTTPException(status_code=500, detail=f"Error processing generated image: {img_error}")

        if not generated_image_base64:
            return {
                "success": False,
                "message": "No image was generated. Try making your prompt more specific.",
                "ai_response": response_text or "No response from AI",
            }

        meme_url = f"data:image/png;base64,{generated_image_base64}"

        # Save meme record
        user_meme = UserMeme(
            user_id=request.user_id,
            meme_url=meme_url,
            prompt_used=request.prompt,
            is_ai_generated=True
        )
        await append_to_json_file(MEMES_FILE, user_meme.dict(), memes_lock)

        return {
            "success": True,
            "meme_url": meme_url,
            "meme_id": user_meme.id,
            "ai_response": response_text,
            "message": "AI-enhanced meme created successfully"
        }

    except Exception as e:
        logging.error(f"Failed to create AI meme: {e}")
        error_message = str(e)
        import traceback; logging.error(traceback.format_exc())

        if "API key" in error_message:
            raise HTTPException(status_code=500, detail="API key configuration error. Please check your Google AI API key.")
        elif "quota" in error_message.lower():
            raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
        elif "model" in error_message.lower():
            raise HTTPException(status_code=500, detail="Model access error. The gemini-2.5-flash-image-preview model might not be available.")
        else:
            raise HTTPException(status_code=500, detail=f"AI meme creation failed: {error_message}")


# User meme gallery endpoints
@api_router.get("/user-memes/{user_id}", response_model=List[UserMeme])
async def get_user_memes(user_id: str):
    """Get all memes created by a specific user"""
    try:
        user_memes = await find_in_json_file(MEMES_FILE, {"user_id": user_id}, memes_lock)
        # Sort by created_at in descending order
        user_memes.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return [UserMeme(**meme) for meme in user_memes]
    except Exception as e:
        logging.error(f"Failed to fetch user memes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user memes: {str(e)}")

@api_router.delete("/user-memes/{meme_id}")
async def delete_user_meme(meme_id: str, user_id: str):
    """Delete a specific meme by ID (only if it belongs to the user)"""
    try:
        deleted = await delete_from_json_file(MEMES_FILE, {"id": meme_id, "user_id": user_id}, memes_lock)
        if not deleted:
            raise HTTPException(status_code=404, detail="Meme not found or doesn't belong to user")
        
        return {"success": True, "message": "Meme deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to delete meme: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete meme: {str(e)}")

@api_router.post("/user-memes", response_model=UserMeme)
async def save_user_meme(meme: UserMemeCreate):
    """Save a meme to user's gallery"""
    try:
        user_meme = UserMeme(**meme.dict())
        await append_to_json_file(MEMES_FILE, user_meme.dict(), memes_lock)
        return user_meme
    except Exception as e:
        logging.error(f"Failed to save user meme: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save meme: {str(e)}")

# File upload endpoint for custom images
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload custom image and return base64 encoded data"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        content = await file.read()
        
        # Convert to base64
        base64_data = base64.b64encode(content).decode('utf-8')
        
        return {
            "success": True,
            "filename": file.filename,
            "base64_data": base64_data,
            "content_type": file.content_type
        }
    except Exception as e:
        logging.error(f"Failed to upload image: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    gemini_status = "disconnected"
    if gemini_client:
        try:
            # Try a simple test to verify the client is working
            gemini_status = "connected"
        except:
            gemini_status = "error"
    
    # Check if storage files are accessible
    storage_status = "healthy"
    try:
        if not MEMES_FILE.exists() or not STATUS_FILE.exists():
            storage_status = "files missing"
    except:
        storage_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "local_storage": storage_status,
            "gemini_ai": gemini_status
        }
    }

# Clear all data endpoint (for testing/development)
@api_router.delete("/clear-all-data")
async def clear_all_data(confirm: bool = False):
    """Clear all stored data (use with caution)"""
    if not confirm:
        raise HTTPException(status_code=400, detail="Please confirm by setting confirm=true")
    
    try:
        await write_json_file(MEMES_FILE, [], memes_lock)
        await write_json_file(STATUS_FILE, [], status_lock)
        return {"success": True, "message": "All data cleared successfully"}
    except Exception as e:
        logging.error(f"Failed to clear data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear data: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)