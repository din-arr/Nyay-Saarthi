import os
import uuid
import pathlib
import logging
import re
import difflib # For comparison
import shutil # For file operations like copyfileobj
import aiofiles # For async file writing
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
import shutil
import ollama

# ---------------- CONFIG ----------------
load_dotenv()
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE_BYTES", 8 * 1024 * 1024))
TMP_DIR = "/tmp"  # Spaces-safe temporary directory
NLTK_DATA_DIR = os.path.join(TMP_DIR, "nltk_data")
os.makedirs(TMP_DIR, exist_ok=True)
os.makedirs(NLTK_DATA_DIR, exist_ok=True)

# NLTK setup (Ensure punkt and averaged_perceptron_tagger are downloaded)
nltk.data.path.append(NLTK_DATA_DIR)
try:
    # Attempt to download NLTK data if not present (quiet mode)
    nltk.download("punkt", download_dir=NLTK_DATA_DIR, quiet=True)
    nltk.download("averaged_perceptron_tagger", download_dir=NLTK_DATA_DIR, quiet=True)
except Exception as e:
    # Log warning if download fails (might work if already present)
    print(f"NLTK download warning: {e}")

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
ollama_client = ollama.Client(host=OLLAMA_BASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Be more specific in production, e.g., ["https://yourfrontend.com"]
    allow_credentials=True,
    allow_methods=["*"], # Allows all standard methods
    allow_headers=["*"], # Allows all headers
)

vectorstore = None
document_text = ""


# -------------- Pydantic Models --------------
class Query(BaseModel):
    """Request model for asking questions."""
    question: str
    language: str = "hi"


def call_ollama_json(prompt: str) -> dict:
    try:
        response = ollama_client.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options={"temperature": 0},
        )
        raw = get_message_content(response)
        return json.loads(raw)
    except Exception as e:
        print(f"Ollama JSON call failed: {e}")
        return {}


def call_ollama_text(prompt: str) -> str:
    try:
        response = ollama_client.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0},
        )
        return get_message_content(response)
    except Exception as e:
        print(f"Ollama text call failed: {e}")
        return "उत्तर देने में त्रुटि हुई। कृपया पुनः प्रयास करें।"


def get_message_content(response) -> str:
    if isinstance(response, dict):
        return response["message"]["content"].strip()
    message = getattr(response, "message", None)
    if isinstance(message, dict):
        return message.get("content", "").strip()
    return getattr(message, "content", "").strip()


def get_model_name(model) -> str:
    if isinstance(model, dict):
        return model.get("model") or model.get("name") or ""
    return getattr(model, "model", None) or getattr(model, "name", None) or ""


def load_document(file_path: str) -> list:
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".pdf":
            return PyPDFLoader(file_path).load()
        elif ext in (".txt", ".md"):
            return TextLoader(file_path, encoding="utf-8").load()
        elif ext == ".docx":
            import docx
            doc = docx.Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            return [Document(page_content=text, metadata={"source": file_path})]
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return [Document(page_content=f.read(), metadata={"source": file_path})]
    except Exception as e:
        print(f"Document load error: {e}")
        return [Document(page_content="", metadata={"source": file_path})]


async def analyze_document(text: str) -> dict:
    prompt = f"""You are an expert legal document analyzer. Analyze the legal document below and return ONLY a valid JSON object — no extra text, no markdown.

Document:
{text[:3500]}

Return exactly this JSON structure:
{{
  "document_type": "Type of legal document (e.g. Rental Agreement, NDA, Service Contract, Employment Agreement, Power of Attorney)",
  "parties": ["Party 1 name", "Party 2 name"],
  "key_dates": ["Important date 1 with context", "Important date 2 with context"],
  "key_clauses": ["Most important obligation or clause 1", "Clause 2", "Clause 3"],
  "risk_score": 45,
  "risk_level": "Medium",
  "risk_factors": ["Specific risky clause or term 1", "Risk 2"],
  "suggested_questions": [
    "Question 1 relevant to this document?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ]
}}

Rules:
- risk_score is an integer 0-100 (0-30=Low, 31-60=Medium, 61-100=High)
- risk_level must be exactly "Low", "Medium", or "High"
- suggested_questions must be specific to this document type
- Return ONLY the JSON object"""

    result = call_ollama_json(prompt)

    if not result:
        return {
            "document_type": "Legal Document",
            "parties": ["Party not identified"],
            "key_dates": ["No specific dates found"],
            "key_clauses": ["Document processed — ask questions to explore clauses"],
            "risk_score": 40,
            "risk_level": "Medium",
            "risk_factors": ["Manual review recommended"],
            "suggested_questions": [
                "मुख्य जोखिम क्या हैं?",
                "समय सीमा कब तक है?",
                "भुगतान की शर्तें क्या हैं?",
                "अनुबंध तोड़ने पर क्या होगा?",
                "दस्तावेज़ की मुख्य शर्तें क्या हैं?",
            ],
        }

    result.setdefault("document_type", "Legal Document")
    result.setdefault("parties", [])
    result.setdefault("key_dates", [])
    result.setdefault("key_clauses", [])
    result.setdefault("risk_score", 40)
    result.setdefault("risk_level", "Medium")
    result.setdefault("risk_factors", [])
    result.setdefault("suggested_questions", [])
    return result


async def verify_document_text(text: str) -> dict:
    prompt = f"""You are a legal document verification expert. Analyze this document for issues and return ONLY a valid JSON object.

Document:
{text[:3500]}

Return exactly this JSON structure:
{{
  "missing_signatures": ["Specific finding about missing or incomplete signatures, or empty list if none"],
  "inconsistent_dates": ["Specific date inconsistency found with details, or empty list if none"],
  "clause_mismatches": ["Specific problematic or unusual clause with details"],
  "overall_status": "Valid",
  "recommendations": ["Actionable recommendation 1", "Recommendation 2", "Recommendation 3"]
}}

overall_status must be one of: "Valid", "Issues Found", "Needs Review"
Return ONLY the JSON object."""

    result = call_ollama_json(prompt)

    if not result:
        return {
            "missing_signatures": [],
            "inconsistent_dates": [],
            "clause_mismatches": [],
            "overall_status": "Needs Review",
            "recommendations": ["दस्तावेज़ की मैन्युअल समीक्षा करें।"],
        }

    result.setdefault("missing_signatures", [])
    result.setdefault("inconsistent_dates", [])
    result.setdefault("clause_mismatches", [])
    result.setdefault("overall_status", "Needs Review")
    result.setdefault("recommendations", [])
    return result


# --- Clause Library and Pydantic Models for Clause Identification ---
CLAUSE_LIBRARY = {
    "Termination": {
        "en": "Specifies how and when the agreement can be ended by either party.",
        "hi": "निर्दिष्ट करता है कि समझौता किसी भी पक्ष द्वारा कैसे और कब समाप्त किया जा सकता है।"
    },
    "Liability": {
        "en": "Defines the responsibilities and extent of legal obligations if something goes wrong.",
        "hi": "कुछ गलत होने पर जिम्मेदारियों और कानूनी दायित्वों की सीमा को परिभाषित करता है।"
    },
    "Governing Law": {
        "en": "Specifies which jurisdiction's laws will be used to interpret the agreement.",
        "hi": "निर्दिष्ट करता है कि समझौते की व्याख्या के लिए किस क्षेत्राधिकार के कानूनों का उपयोग किया जाएगा।"
    },
    "Confidentiality": {
        "en": "Outlines obligations regarding the non-disclosure of sensitive information.",
        "hi": "संवेदनशील जानकारी का खुलासा न करने संबंधी दायित्वों की रूपरेखा बताता है।"
    },
    "Payment Terms": {
        "en": "Details the amount, timing, and method of payments.",
        "hi": "भुगतान की राशि, समय और तरीके का विवरण देता है।"
    },
    "Force Majeure": {
        "en": "Addresses unforeseeable circumstances that prevent someone from fulfilling a contract.",
        "hi": "अप्रत्याशित परिस्थितियों को संबोधित करता है जो किसी को अनुबंध पूरा करने से रोकती हैं।"
    },
    "Indemnification": {
        "en": "One party agrees to pay for potential losses or damages caused by another party.",
        "hi": "एक पक्ष दूसरे पक्ष के कारण होने वाले संभावित नुकसान या क्षति के लिए भुगतान करने पर सहमत होता है।"
    },
     "Dispute Resolution": {
        "en": "Specifies how disagreements related to the contract will be handled (e.g., arbitration, court).",
        "hi": "निर्दिष्ट करता है कि अनुबंध से संबंधित असहमतियों को कैसे संभाला जाएगा (जैसे, मध्यस्थता, अदालत)।"
    },
}

# Pydantic model for a single identified clause (using langchain's BaseModel)
class IdentifiedClauseInfo(LangchainBaseModel):
    clause_type: str = Field(description="The type of clause identified (e.g., Termination, Liability). Must be one of the predefined types.")
    extracted_text: str = Field(description="The exact sentence(s) or short paragraph representing the clause.")

# Pydantic model for the list of clauses expected from the LLM (using langchain's BaseModel)
class ClauseList(LangchainBaseModel):
    clauses: List[IdentifiedClauseInfo] = Field(description="A list of identified clauses found in the text.")

# Pydantic model for the final /upload response structure (using standard BaseModel)
class UploadResponse(BaseModel):
    message: str
    chunks_added: int
    identified_clauses: List[Dict[str, Any]] = [] # Holds final clause info + explanation

# Output parser for structured clause identification
clause_parser = PydanticOutputParser(pydantic_object=ClauseList)
# --- END Clause Library and Pydantic Models ---


# -------------- Utility Functions --------------
def safe_filename(name: Optional[str]) -> str:
    """Gets a safe filename from an optional full path."""
    return pathlib.Path(name or "upload").name

# Regex to find common non-printable characters
_NON_PRINTABLE_RE = re.compile(r"[\x00-\x08\x0B-\x0C\x0E-\x1F]")

def _looks_binary(s: str) -> bool:
    """Heuristic check for binary content."""
    if "\x00" in s: return True
    if "%PDF-" in s and "stream" in s and "endstream" in s: return True
    if len(_NON_PRINTABLE_RE.findall(s)) > max(5, len(s) // 50): return True
    return False

def _clean_text(s: str) -> str:
    """Removes non-printable characters and collapses excessive whitespace."""
    s = _NON_PRINTABLE_RE.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip()

async def _extract_docs(tmp_path: str, source_name: str) -> List[Document]:
    """
    Robustly extracts text from a file using multiple strategies:
    1. UnstructuredLoader
    2. PyPDFLoader
    3. PDFMinerLoader
    4. OCR
    """
    docs: List[Document] = []
    error_log = []

    # 1) Try UnstructuredLoader
    try:
        loader = UnstructuredLoader(file_path=tmp_path, languages=["hin", "eng"])
        docs = await loader.aload()
        if docs: logger.info(f"Extracted content using UnstructuredLoader for {source_name}")
    except Exception as e:
        logger.warning(f"UnstructuredLoader failed for {source_name}: {e}")
        error_log.append(f"Unstructured: {e}")
        docs = []

    # 2) Fallback to PyPDFLoader
    if not docs:
        try:
            pdf_loader = PyPDFLoader(tmp_path)
            if hasattr(pdf_loader, 'aload'): docs = await pdf_loader.aload()
            else: docs = pdf_loader.load()
            if docs: logger.info(f"Extracted content using PyPDFLoader for {source_name}")
        except Exception as e:
            logger.warning(f"PyPDFLoader failed for {source_name}: {e}")
            error_log.append(f"PyPDF: {e}")
            docs = []

    # 3) Fallback to PDFMinerLoader
    if not docs:
        try:
            pdfm_loader = PDFMinerLoader(tmp_path)
            docs = pdfm_loader.load()
            if docs: logger.info(f"Extracted content using PDFMinerLoader for {source_name}")
        except Exception as e:
            logger.warning(f"PDFMinerLoader failed for {source_name}: {e}")
            error_log.append(f"PDFMiner: {e}")
            docs = []

    # 4) Fallback to OCR for PDFs
    is_pdf = False
    try:
        is_pdf = source_name.lower().endswith(".pdf")
        if not is_pdf:
             async with aiofiles.open(tmp_path, 'rb') as f:
                 header = await f.read(5)
                 if header == b'%PDF-': is_pdf = True
    except Exception as read_err:
        logger.warning(f"Could not read header to check if PDF: {read_err}")

    if not docs and is_pdf:
        logger.info(f"Attempting OCR for PDF: {source_name}...")
        try:
            images = convert_from_path(tmp_path)
            ocr_docs = []
            for i, img in enumerate(images):
                try:
                    text = pytesseract.image_to_string(img, lang="hin+eng")
                    text = _clean_text(text)
                    if text: ocr_docs.append(Document(page_content=text, metadata={"source": source_name, "page_number": i + 1}))
                except pytesseract.TesseractError as ocr_err:
                     logger.warning(f"Tesseract error on page {i+1} of {source_name}: {ocr_err}")
                     error_log.append(f"OCR Page {i+1}: {ocr_err}")
                     continue
            if ocr_docs:
                docs = ocr_docs
                logger.info(f"Extracted content using OCR for {source_name}")
        except Exception as e:
            logger.warning(f"PDF OCR processing failed entirely for {source_name}: {e}")
            error_log.append(f"OCR General: {e}")
            docs = []

    if not docs:
        logger.error(f"Failed to extract readable text from {source_name}. Errors: {error_log}")
        raise HTTPException(status_code=400, detail=f"No readable text extracted from {source_name}. Extraction attempts failed.")

    # Clean and filter
    cleaned: List[Document] = []
    total_len = 0
    for d in docs:
        txt = getattr(d, 'page_content', '') or ""
        if not txt or not isinstance(txt, str) or _looks_binary(txt): continue
        cleaned_content = _clean_text(txt)
        if cleaned_content:
             metadata = {"source": source_name}
             if hasattr(d, 'metadata') and d.metadata: metadata["page_number"] = d.metadata.get("page_number", 1)
             else: metadata["page_number"] = 1
             cleaned.append(Document(page_content=cleaned_content, metadata=metadata))
             total_len += len(cleaned_content)

    if not cleaned:
        logger.error(f"Content extracted from {source_name} was empty or binary after cleaning. Errors: {error_log}")
        raise HTTPException(status_code=400, detail=f"Extracted content from {source_name} was empty or unreadable after cleaning.")

    logger.info(f"Successfully cleaned {len(cleaned)} document pages/sections, total chars: {total_len} from {source_name}")
    return cleaned


# --- Clause Identification Function ---
async def identify_clauses_llm(documents: List[Document]) -> List[Dict[str, Any]]:
    """Identifies predefined clauses in the document text using an LLM."""
    if not documents:
        return []

    full_text = "\n\n".join([doc.page_content for doc in documents])
    MAX_TEXT_LENGTH = 100000 # Limit text sent to LLM for clause identification
    if len(full_text) > MAX_TEXT_LENGTH:
        logger.warning(f"Document text too long ({len(full_text)} chars), truncating for clause analysis.")
        full_text = full_text[:MAX_TEXT_LENGTH] + "\n[...TRUNCATED...]"

    if not full_text.strip():
        logger.info("No text content provided for clause identification.")
        return []

    target_clauses = list(CLAUSE_LIBRARY.keys())

    prompt_template = """
    Analyze the following legal document text. Identify and extract the exact sentences or short paragraphs corresponding to these specific clause types: {clause_list}.
    Do not identify any other clause types. If a clause type is not found, do not include it in the output.
    Return ONLY a JSON object formatted according to the following instructions, with no preamble or explanation:
    {format_instructions}
    Document Text:
    ---
    {document_text}
    ---
    """
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["document_text", "clause_list"],
        partial_variables={"format_instructions": clause_parser.get_format_instructions()}
    )

    llm = ChatGoogleGenerativeAI(
            model="gemini-flash-latest",
            temperature=0.1, # Low temp for extraction
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

    chain = prompt | llm | clause_parser

    identified_clauses_details = []
    try:
        logger.info(f"Invoking LLM for clause identification on text (length {len(full_text)})...")
        result: ClauseList = await chain.ainvoke({
            "document_text": full_text,
            "clause_list": ", ".join(target_clauses)
        })

        if result and result.clauses:
            logger.info(f"LLM identified {len(result.clauses)} potential clauses.")
            for clause_info in result.clauses:
                 page_num = 1
                 for doc in documents:
                     if clause_info.extracted_text[:50] in doc.page_content:
                          page_num = doc.metadata.get("page_number", 1)
                          break

                 explanation = CLAUSE_LIBRARY.get(clause_info.clause_type, {"hi": "स्पष्टीकरण उपलब्ध नहीं है।", "en": "Explanation not available."})

                 identified_clauses_details.append({
                     "type": clause_info.clause_type,
                     "text": clause_info.extracted_text,
                     "page": page_num,
                     "explanation_hi": explanation.get("hi"),
                     "explanation_en": explanation.get("en"),
                 })
        else:
             logger.info("LLM did not identify any of the target clauses.")

    except Exception as e:
        logger.exception("Error during clause identification LLM call.")
        return [] # Return empty on error, don't fail the upload

    return identified_clauses_details
# --- END Clause Identification Function ---


# -------------- API Routes --------------
@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "tmp_dir": TMP_DIR,
        "tmp_writable": os.access(TMP_DIR, os.W_OK),
        "nltk_dir": NLTK_DATA_DIR,
        "index_stats": INDEX_STATS,
    }

@app.get("/stats")
def stats():
    """Returns basic indexing stats."""
    return INDEX_STATS

# --- MODIFIED /upload/ Endpoint ---
@app.post("/upload/", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    global vectorstore, document_text

    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    documents = load_document(file_location)

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)

    document_text = "\n".join([doc.page_content for doc in texts[:20]])

    embeddings = OllamaEmbeddings(model=OLLAMA_EMBED_MODEL, base_url=OLLAMA_BASE_URL)

    vectorstore = InMemoryVectorStore.from_documents(texts, embeddings)

    os.remove(file_location)

    analysis = await analyze_document(document_text)
    verification = await verify_document_text(document_text)

    return {
        "message": "File uploaded and processed successfully",
        "filename": file.filename,
        "analysis": analysis,
        "verification": verification,
    }


@app.post("/ask/")
async def ask_question(query: Query):
    """
    Performs Retrieval-Augmented Generation (RAG) QA in Hindi
    using the indexed documents and a Google Generative AI model.
    Applies accuracy improvements (retriever k=6, refined prompt).
    """
    global vectorstore
    if not vectorstore:
        return {"error": "Please upload a document first"}

    # Retrieve relevant chunks from vectorstore
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(query.question)

    context = "\n\n".join([doc.page_content for doc in docs])

    lang_instruction = (
        "Answer in simple Hindi. Use Devanagari script."
        if query.language == "hi"
        else "Answer in simple English."
    )
    prompt = f"""You are a helpful legal assistant. Use the context below to answer the question.
{lang_instruction}
If you don't know the answer from the context, say so — don't make things up.
Use **bold** for important terms and - for bullet points where appropriate.

Context:
{context}

Question: {query.question}

Answer:"""

    answer = call_ollama_text(prompt)

    return {
        "answer": answer,
        "sources": [
            {"content": doc.page_content, "page": doc.metadata.get("page_number", 1)}
            for doc in docs
        ],
    }


@app.get("/verify/")
async def verify_document():
    global vectorstore, document_text

    if not vectorstore or not document_text:
        return {
            "report": {
                "missing_signatures": ["कोई दस्तावेज़ अपलोड नहीं है।"],
                "inconsistent_dates": [],
                "clause_mismatches": [],
                "overall_status": "No Document",
                "recommendations": ["दस्तावेज़ अपलोड करके पुनः प्रयास करें।"],
            }
        }

    return {"report": await verify_document_text(document_text)}


@app.get("/")
async def root():
    return {
        "status": "Nyay-Saarthi backend running",
        "llm_provider": "ollama",
        "ollama_base_url": OLLAMA_BASE_URL,
        "model": OLLAMA_MODEL,
        "embedding_model": OLLAMA_EMBED_MODEL,
    }


@app.get("/health/")
async def health():
    try:
        response = ollama_client.list()
        models = response.get("models", []) if isinstance(response, dict) else getattr(response, "models", [])
        return {
            "status": "ok",
            "llm_provider": "ollama",
            "ollama_base_url": OLLAMA_BASE_URL,
            "model": OLLAMA_MODEL,
            "embedding_model": OLLAMA_EMBED_MODEL,
            "available_models": [name for name in (get_model_name(model) for model in models) if name],
        }
    except Exception as e:
        return {
            "status": "ollama_unavailable",
            "llm_provider": "ollama",
            "ollama_base_url": OLLAMA_BASE_URL,
            "model": OLLAMA_MODEL,
            "embedding_model": OLLAMA_EMBED_MODEL,
            "error": str(e),
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
