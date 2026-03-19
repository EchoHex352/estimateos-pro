# 🏗️ PHASE 2: BACKEND ARCHITECTURE - ESTIMATEOS PRO

## 🎯 **BACKEND MISSION**

Build a production-grade FastAPI backend that:
1. Processes PDF blueprints (multi-page, full spec books)
2. Integrates Anthropic Claude API for AI material detection
3. Stores all data in PostgreSQL
4. Provides RESTful API for frontend
5. Handles labor unit calculations
6. Integrates vendor pricing databases
7. Deploys to Railway

---

## 📦 **TECHNOLOGY STACK**

### **Core Framework**
- **FastAPI** - Modern, fast Python web framework
- **Python 3.11+** - Latest stable version
- **Uvicorn** - ASGI server

### **Database**
- **PostgreSQL 15** - Primary database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations

### **PDF Processing**
- **PyPDF2** - PDF parsing
- **pdf2image** - Convert PDF pages to images
- **Pillow** - Image manipulation
- **pytesseract** - OCR for text extraction

### **AI Integration**
- **Anthropic Python SDK** - Claude API client
- **OpenAI** - Backup/comparison (optional)

### **Storage**
- **S3/Railway Storage** - File storage for uploaded PDFs
- **Base64** - For sending images to Claude API

### **Utilities**
- **pandas** - Data manipulation for quantities
- **openpyxl** - Excel file generation
- **pydantic** - Data validation
- **python-dotenv** - Environment variables

---

## 🗄️ **DATABASE SCHEMA**

### **1. Projects Table**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    project_number VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, archived
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Uploaded Files Table**
```sql
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- blueprint, spec_book, schedule
    file_url TEXT NOT NULL, -- S3/storage URL
    page_count INTEGER,
    file_size_mb DECIMAL(10, 2),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **3. Selected Divisions Table**
```sql
CREATE TABLE selected_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    division_id VARCHAR(10) NOT NULL, -- '03', '04', etc.
    division_name VARCHAR(255),
    division_color VARCHAR(20),
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **4. PDF Pages Table**
```sql
CREATE TABLE pdf_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    image_url TEXT, -- Converted image URL
    raw_text TEXT, -- OCR extracted text
    sheet_type VARCHAR(50), -- architectural, structural, MEP, civil
    sheet_number VARCHAR(100),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP
);
```

### **5. Annotations Table**
```sql
CREATE TABLE annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pdf_pages(id) ON DELETE CASCADE,
    annotation_type VARCHAR(50), -- rectangle, line, polygon, note
    coordinates JSONB NOT NULL, -- {x, y, width, height} or array of points
    division_id VARCHAR(10),
    material_type VARCHAR(255),
    material_description TEXT,
    quantity DECIMAL(15, 2),
    unit VARCHAR(20), -- SF, LF, CY, EA, etc.
    color VARCHAR(20),
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00 (AI confidence)
    detected_by VARCHAR(50) DEFAULT 'ai', -- ai, manual
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **6. Material Legend Table**
```sql
CREATE TABLE material_legend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pdf_pages(id) ON DELETE CASCADE,
    division_id VARCHAR(10),
    material_type VARCHAR(255),
    color VARCHAR(20),
    count INTEGER DEFAULT 1,
    total_quantity DECIMAL(15, 2),
    unit VARCHAR(20)
);
```

### **7. Quantity Takeoff Table**
```sql
CREATE TABLE quantity_takeoff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    division_id VARCHAR(10),
    csi_code VARCHAR(50), -- e.g., 03 31 00
    material_name VARCHAR(255),
    material_description TEXT,
    quantity DECIMAL(15, 2),
    unit VARCHAR(20),
    unit_cost DECIMAL(10, 2),
    material_cost DECIMAL(15, 2),
    labor_hours DECIMAL(10, 2),
    labor_rate DECIMAL(10, 2),
    labor_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    waste_factor DECIMAL(5, 2) DEFAULT 0.00, -- Percentage
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **8. Labor Units Database Table**
```sql
CREATE TABLE labor_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    csi_code VARCHAR(50),
    material_type VARCHAR(255),
    description TEXT,
    unit VARCHAR(20),
    labor_hours_per_unit DECIMAL(10, 4),
    crew_size INTEGER,
    daily_output DECIMAL(10, 2),
    source VARCHAR(100), -- RSMeans, internal, etc.
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **9. Material Pricing Database Table**
```sql
CREATE TABLE material_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name VARCHAR(255),
    vendor_name VARCHAR(255),
    vendor_sku VARCHAR(100),
    unit VARCHAR(20),
    unit_price DECIMAL(10, 2),
    location VARCHAR(100), -- ZIP or city/state
    effective_date DATE,
    expiration_date DATE,
    minimum_quantity INTEGER,
    lead_time_days INTEGER,
    vendor_contact JSONB -- {name, email, phone}
);
```

### **10. RFQ Table**
```sql
CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    rfq_number VARCHAR(100) UNIQUE,
    vendor_name VARCHAR(255),
    vendor_email VARCHAR(255),
    items JSONB, -- Array of materials requested
    status VARCHAR(50) DEFAULT 'sent', -- sent, responded, accepted, declined
    sent_at TIMESTAMP,
    due_date DATE,
    response_data JSONB, -- Vendor's pricing response
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **11. Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'estimator', -- estimator, admin, viewer
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

---

## 🔌 **API ENDPOINTS**

### **Authentication**
```
POST   /api/v1/auth/register       - Create new user
POST   /api/v1/auth/login          - Login and get JWT token
POST   /api/v1/auth/refresh        - Refresh JWT token
GET    /api/v1/auth/me             - Get current user info
```

### **Projects**
```
GET    /api/v1/projects            - List all projects
POST   /api/v1/projects            - Create new project
GET    /api/v1/projects/{id}       - Get project details
PUT    /api/v1/projects/{id}       - Update project
DELETE /api/v1/projects/{id}       - Delete project
```

### **File Upload & Processing**
```
POST   /api/v1/upload              - Upload PDF file(s)
GET    /api/v1/files/{id}          - Get file details
DELETE /api/v1/files/{id}          - Delete file
POST   /api/v1/process/{file_id}   - Trigger AI processing
GET    /api/v1/process/status/{id} - Check processing status
```

### **Divisions**
```
GET    /api/v1/divisions           - Get all CSI divisions
POST   /api/v1/projects/{id}/divisions - Select divisions for project
GET    /api/v1/projects/{id}/divisions - Get selected divisions
```

### **PDF Pages**
```
GET    /api/v1/files/{file_id}/pages        - Get all pages
GET    /api/v1/pages/{page_id}              - Get page details
GET    /api/v1/pages/{page_id}/image        - Get page image
POST   /api/v1/pages/{page_id}/analyze      - Run AI analysis on page
```

### **Annotations**
```
GET    /api/v1/pages/{page_id}/annotations  - Get all annotations for page
POST   /api/v1/annotations                  - Create annotation (manual)
PUT    /api/v1/annotations/{id}             - Update annotation
DELETE /api/v1/annotations/{id}             - Delete annotation
```

### **Material Legend**
```
GET    /api/v1/pages/{page_id}/legend       - Get material legend for page
GET    /api/v1/projects/{id}/legend         - Get full project legend
```

### **Quantity Takeoff**
```
GET    /api/v1/projects/{id}/quantities     - Get quantity takeoff data
POST   /api/v1/quantities                   - Add manual quantity
PUT    /api/v1/quantities/{id}              - Update quantity
DELETE /api/v1/quantities/{id}              - Delete quantity
POST   /api/v1/quantities/calculate         - Recalculate costs
```

### **Labor Units**
```
GET    /api/v1/labor-units                  - Search labor database
GET    /api/v1/labor-units/{id}             - Get labor unit details
POST   /api/v1/labor-units                  - Add custom labor unit
```

### **Material Pricing**
```
GET    /api/v1/pricing/search               - Search pricing database
GET    /api/v1/pricing/vendors              - Get vendor list
POST   /api/v1/pricing/update               - Update pricing data
```

### **RFQ Generation**
```
POST   /api/v1/rfq/generate                 - Generate RFQ document
GET    /api/v1/rfq/{id}                     - Get RFQ details
POST   /api/v1/rfq/{id}/send                - Send RFQ to vendor
PUT    /api/v1/rfq/{id}/response            - Record vendor response
```

### **Export**
```
GET    /api/v1/export/excel/{project_id}    - Export to Excel
GET    /api/v1/export/pdf/{project_id}      - Export to PDF
GET    /api/v1/export/csv/{project_id}      - Export to CSV
```

---

## 🤖 **AI PROCESSING WORKFLOW**

### **Step 1: PDF Upload**
```python
1. User uploads PDF via /api/v1/upload
2. Save file to storage (Railway/S3)
3. Extract metadata (page count, size)
4. Create database records (uploaded_files, pdf_pages)
5. Return file_id
```

### **Step 2: PDF Processing**
```python
1. Convert each page to high-res image (300 DPI)
2. Run OCR to extract all text
3. Store images and text in database
4. Mark pages as ready for analysis
```

### **Step 3: AI Analysis (Per Page)**
```python
1. Get page image as base64
2. Send to Anthropic Claude API with prompt:
   - "Analyze this construction blueprint"
   - "Identify all materials in selected divisions"
   - "For each material, provide: type, location (coordinates), quantity estimate"
   - Include OCR text for context
   - Include legend/schedule information
3. Parse Claude's response
4. Create annotation records
5. Calculate quantities
6. Update material legend
```

### **Step 4: Post-Processing**
```python
1. Group similar materials
2. Calculate totals by division
3. Look up labor units from database
4. Look up material pricing (if available)
5. Calculate costs
6. Update quantity_takeoff table
```

### **Step 5: Human Review**
```python
1. Frontend displays annotations
2. User can edit, add, or delete
3. Changes update database via API
4. Recalculate totals on change
```

---

## 🧠 **CLAUDE API INTEGRATION**

### **Prompt Template for Blueprint Analysis**

```python
SYSTEM_PROMPT = """
You are an expert construction estimator with deep knowledge of:
- Blueprint reading and symbol interpretation
- All 50 CSI MasterFormat divisions
- Material identification and quantification
- Construction drawings (architectural, structural, MEP, civil)

Your task is to analyze construction blueprints and identify materials for quantity takeoff.
"""

USER_PROMPT = """
Analyze this construction blueprint page.

SELECTED DIVISIONS TO FOCUS ON:
{selected_divisions}

LEGEND/SCHEDULE INFORMATION (if visible on page):
{legend_info}

OCR EXTRACTED TEXT:
{ocr_text}

For each material you identify:
1. Division (CSI code)
2. Material type (e.g., "Concrete Slab 6 inch", "CMU Block 8 inch")
3. Location on drawing (bounding box coordinates)
4. Quantity estimate (numerical value)
5. Unit (SF, LF, CY, EA, etc.)
6. Confidence level (high/medium/low)

Return as structured JSON:
{
  "materials": [
    {
      "division": "03",
      "material_type": "Concrete Slab",
      "description": "6 inch thick slab on grade",
      "bbox": {"x": 100, "y": 200, "width": 300, "height": 150},
      "quantity": 1200,
      "unit": "SF",
      "confidence": "high",
      "notes": "Based on dimensions shown"
    }
  ],
  "legend_items": [...],
  "schedules": [...]
}
"""
```

---

## 🔧 **CORE PROCESSING FUNCTIONS**

### **PDF to Images**
```python
from pdf2image import convert_from_path

def process_pdf_to_images(pdf_path: str, output_dir: str):
    images = convert_from_path(pdf_path, dpi=300)
    for i, image in enumerate(images):
        image_path = f"{output_dir}/page_{i+1}.png"
        image.save(image_path, 'PNG')
    return len(images)
```

### **OCR Text Extraction**
```python
import pytesseract
from PIL import Image

def extract_text_from_image(image_path: str) -> str:
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text
```

### **Claude Analysis**
```python
import anthropic
import base64

def analyze_blueprint_page(
    image_path: str,
    selected_divisions: list,
    ocr_text: str,
    legend_info: str
) -> dict:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    # Convert image to base64
    with open(image_path, "rb") as img_file:
        image_data = base64.b64encode(img_file.read()).decode()
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": USER_PROMPT.format(
                            selected_divisions=selected_divisions,
                            legend_info=legend_info,
                            ocr_text=ocr_text
                        )
                    }
                ]
            }
        ]
    )
    
    return parse_claude_response(response.content[0].text)
```

### **Labor Unit Lookup**
```python
def get_labor_hours(csi_code: str, material_type: str, quantity: float, unit: str) -> dict:
    # Query labor_units table
    labor_unit = db.query(LaborUnit).filter(
        LaborUnit.csi_code == csi_code,
        LaborUnit.material_type == material_type
    ).first()
    
    if labor_unit:
        total_hours = quantity * labor_unit.labor_hours_per_unit
        return {
            "labor_hours": total_hours,
            "crew_size": labor_unit.crew_size,
            "daily_output": labor_unit.daily_output
        }
    return None
```

### **Material Pricing Lookup**
```python
def get_material_price(material_name: str, location: str) -> float:
    pricing = db.query(MaterialPricing).filter(
        MaterialPricing.material_name.ilike(f"%{material_name}%"),
        MaterialPricing.location == location,
        MaterialPricing.effective_date <= date.today(),
        MaterialPricing.expiration_date >= date.today()
    ).order_by(MaterialPricing.unit_price).first()
    
    return pricing.unit_price if pricing else None
```

---

## 🚀 **DEPLOYMENT TO RAILWAY**

### **Railway Configuration**

**File: `railway.json`**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

**File: `requirements.txt`**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic==2.5.3
python-dotenv==1.0.0
python-multipart==0.0.6
PyPDF2==3.0.1
pdf2image==1.16.3
Pillow==10.2.0
pytesseract==0.3.10
anthropic==0.18.0
pandas==2.1.4
openpyxl==3.1.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

### **Environment Variables**
```
DATABASE_URL=postgresql://user:pass@host:5432/estimateos
ANTHROPIC_API_KEY=sk-ant-xxxxx
JWT_SECRET_KEY=your-secret-key
AWS_ACCESS_KEY_ID=xxxxx (if using S3)
AWS_SECRET_ACCESS_KEY=xxxxx
S3_BUCKET_NAME=estimateos-uploads
FRONTEND_URL=https://estimateos-pro.vercel.app
```

### **Database Setup on Railway**
1. Add PostgreSQL plugin
2. Run migrations: `alembic upgrade head`
3. Seed labor units database
4. Seed material pricing (if available)

---

## 📊 **PERFORMANCE CONSIDERATIONS**

### **Optimization Strategies**

1. **Async Processing**
   - Use Celery or FastAPI BackgroundTasks
   - Process PDF pages in parallel
   - Queue AI analysis requests

2. **Caching**
   - Cache Claude API responses
   - Cache labor unit lookups
   - Use Redis for session data

3. **Database Indexing**
```sql
CREATE INDEX idx_annotations_page ON annotations(page_id);
CREATE INDEX idx_quantities_project ON quantity_takeoff(project_id);
CREATE INDEX idx_labor_csi ON labor_units(csi_code);
CREATE INDEX idx_pricing_material ON material_pricing(material_name);
```

4. **Image Optimization**
   - Compress stored images
   - Use WebP format
   - Lazy load in frontend

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
- PDF processing functions
- OCR accuracy
- Claude response parsing
- Cost calculations

### **Integration Tests**
- API endpoint responses
- Database operations
- File upload/download

### **End-to-End Tests**
- Full workflow: Upload → Process → Review → Export
- Multi-page PDF handling
- User authentication

---

## 📈 **MONITORING & LOGGING**

### **Key Metrics**
- PDF processing time per page
- Claude API response time
- Accuracy rate (compared to human estimates)
- User edit frequency (indicates AI accuracy)

### **Logging**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
logger.info(f"Processing page {page_num} of {total_pages}")
logger.error(f"Claude API error: {error}")
```

---

## 🔐 **SECURITY MEASURES**

1. **Authentication**: JWT tokens
2. **Authorization**: Role-based access
3. **File Upload**: Validate file types, size limits
4. **SQL Injection**: Use ORM, parameterized queries
5. **API Rate Limiting**: Prevent abuse
6. **CORS**: Whitelist frontend domain
7. **Secrets**: Environment variables only

---

## 🎯 **NEXT STEPS FOR PHASE 2**

1. **Set up FastAPI project structure**
2. **Configure PostgreSQL database**
3. **Implement authentication system**
4. **Build PDF processing pipeline**
5. **Integrate Anthropic Claude API**
6. **Create all API endpoints**
7. **Deploy to Railway**
8. **Connect frontend to backend**
9. **Test full workflow**
10. **Optimize performance**

---

**PHASE 2 STATUS: READY TO BUILD 🚀**

This architecture provides a solid, scalable foundation for EstimateOS Pro backend!
