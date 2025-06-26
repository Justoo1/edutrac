# Toxicology PDF Data Extractor

A Django web application for extracting structured data from complex PDF documents related to toxicology studies, following SENDIG 3.1 standards and generating FDA-compliant submission files.

## Features

- **PDF Processing**: Extract data from complex PDFs with tables, text, and images
- **AI-Powered Extraction**: Uses Langchain, LangGraph, and Ollama for intelligent data extraction
- **SENDIG 3.1 Compliance**: Follows industry standards for toxicology data
- **FDA Submission Files**: Generates `.xpt` and other compliant formats
- **Multi-Domain Support**: Clinical Observation, Demographic, Food Consumption domains
- **Data Management**: Store, search, and retrieve processed files
- **User-Friendly Interface**: Clean, responsive web interface

## Project Structure

```
toxicology_project/
├── toxicology_project/          # Main Django project settings
├── pdf_processor/               # PDF processing and data extraction
├── submission_generator/        # FDA submission file generation
├── ui/                         # User interface components
├── schemas/                    # Pydantic models for data validation
├── core/                       # Core utilities and AI components
│   ├── ai/                     # AI processing modules
│   └── utils/                  # Helper utilities
├── static/                     # Static files (CSS, JS)
├── templates/                  # HTML templates
└── media/                      # File uploads and generated files
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd toxicology_pdf_extractor
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run migrations**
```bash
cd toxicology_project
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Run development server**
```bash
python manage.py runserver
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `DATABASE_URL`: Database connection string
- `OLLAMA_BASE_URL`: Ollama API endpoint
- `REDIS_URL`: Redis connection for Celery

### AI Setup

1. **Install Ollama**
   - Download and install Ollama from https://ollama.ai
   - Pull required models: `ollama pull llama2`

2. **Configure AI Models**
   - Edit `core/ai/config.py` to set model preferences
   - Ensure models are compatible with your hardware

## Usage

1. **Upload PDF**: Navigate to the upload page and select toxicology PDF files
2. **Process Document**: The system will automatically detect domains and extract data
3. **Review Data**: View and validate extracted data in structured format
4. **Generate Submissions**: Create FDA-compliant `.xpt` files
5. **Download Results**: Download processed data and submission files

## Development

### Running Tests
```bash
python manage.py test
```

### Code Quality
```bash
black .
flake8 .
```

### Background Tasks
```bash
# Start Redis
redis-server

# Start Celery worker
celery -A toxicology_project worker --loglevel=info
```

## API Endpoints

- `POST /api/upload/` - Upload PDF files
- `GET /api/documents/` - List processed documents
- `GET /api/documents/{id}/` - Get document details
- `POST /api/extract/{id}/` - Extract data from document
- `GET /api/submissions/` - List submission files
- `POST /api/generate-xpt/{id}/` - Generate XPT file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Run quality checks
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
