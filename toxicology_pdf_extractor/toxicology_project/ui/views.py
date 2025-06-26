from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from datetime import datetime, timedelta
import json

from pdf_processor.models import PDFDocument, ExtractionTask
from submission_generator.models import SubmissionFile
from .models import UserActivity, SystemNotification


def dashboard(request):
    """Main dashboard view"""
    context = {
        'page_title': 'Dashboard',
    }
    
    # Get recent documents
    recent_documents = []
    if request.user.is_authenticated:
        recent_documents = PDFDocument.objects.filter(
            uploaded_by=request.user
        ).order_by('-uploaded_at')[:5]
    
    # Get processing statistics
    stats = {}
    if request.user.is_authenticated:
        stats = {
            'total_documents': PDFDocument.objects.filter(uploaded_by=request.user).count(),
            'processing': ExtractionTask.objects.filter(
                document__uploaded_by=request.user,
                status='processing'
            ).count(),
            'completed': ExtractionTask.objects.filter(
                document__uploaded_by=request.user,
                status='completed'
            ).count(),
            'submissions': SubmissionFile.objects.filter(
                document__uploaded_by=request.user
            ).count(),
        }
    
    # Get system notifications
    notifications = []
    if request.user.is_authenticated:
        notifications = SystemNotification.objects.filter(
            Q(target_all_users=True) | Q(target_users=request.user),
            is_active=True,
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).exclude(viewed_by=request.user)[:3]
    
    context.update({
        'recent_documents': recent_documents,
        'stats': stats,
        'notifications': notifications,
    })
    
    return render(request, 'ui/dashboard.html', context)


@login_required
def upload_pdf(request):
    """PDF upload page"""
    if request.method == 'POST':
        try:
            # Handle file upload via AJAX
            if request.headers.get('Content-Type', '').startswith('multipart/form-data'):
                uploaded_file = request.FILES.get('pdf_file')
                
                if not uploaded_file:
                    return JsonResponse({
                        'success': False,
                        'message': 'No file provided'
                    })
                
                # Validate file type
                if not uploaded_file.name.lower().endswith('.pdf'):
                    return JsonResponse({
                        'success': False,
                        'message': 'Please upload a PDF file'
                    })
                
                # Create PDF document
                from pdf_processor.models import PDFDocument
                document = PDFDocument.objects.create(
                    filename=uploaded_file.name,
                    file=uploaded_file,
                    uploaded_by=request.user,
                    file_size=uploaded_file.size
                )
                
                # Log activity
                UserActivity.objects.create(
                    user=request.user,
                    activity_type='upload',
                    description=f'Uploaded PDF: {uploaded_file.name}',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    document_id=document.id
                )
                
                # Start processing if auto-process is enabled
                user_profile = getattr(request.user, 'userprofile', None)
                if user_profile and user_profile.auto_process_uploads:
                    from pdf_processor.tasks import process_pdf_document
                    process_pdf_document.delay(document.id)
                
                return JsonResponse({
                    'success': True,
                    'message': 'File uploaded successfully',
                    'redirect_url': f'/document/{document.id}/'
                })
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Upload failed: {str(e)}'
            })
    
    return render(request, 'ui/upload.html', {
        'page_title': 'Upload PDF Document'
    })


@login_required
def documents_list(request):
    """List all documents for the current user"""
    documents = PDFDocument.objects.filter(
        uploaded_by=request.user
    ).select_related('extraction_task').order_by('-uploaded_at')
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        documents = documents.filter(
            Q(filename__icontains=search_query) |
            Q(study_title__icontains=search_query)
        )
    
    # Status filter
    status_filter = request.GET.get('status', '')
    if status_filter:
        if status_filter == 'pending':
            documents = documents.filter(extraction_task__isnull=True)
        elif status_filter == 'processing':
            documents = documents.filter(extraction_task__status='processing')
        elif status_filter == 'completed':
            documents = documents.filter(extraction_task__status='completed')
        elif status_filter == 'error':
            documents = documents.filter(extraction_task__status='error')
    
    # Pagination
    paginator = Paginator(documents, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_title': 'My Documents',
        'documents': page_obj,
        'search_query': search_query,
        'status_filter': status_filter,
        'total_count': documents.count(),
    }
    
    return render(request, 'ui/documents.html', context)


@login_required
def document_detail(request, document_id):
    """Document detail view with extracted data"""
    document = get_object_or_404(
        PDFDocument,
        id=document_id,
        uploaded_by=request.user
    )
    
    # Log activity
    UserActivity.objects.create(
        user=request.user,
        activity_type='view',
        description=f'Viewed document: {document.filename}',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        document_id=document.id
    )
    
    # Get extraction task if exists
    extraction_task = getattr(document, 'extraction_task', None)
    
    # Get extracted data if available
    extracted_data = None
    if extraction_task and extraction_task.status == 'completed':
        extracted_data = extraction_task.get_extracted_data()
    
    # Get submission files
    submission_files = document.submission_files.all()
    
    context = {
        'page_title': f'Document: {document.filename}',
        'document': document,
        'extraction_task': extraction_task,
        'extracted_data': extracted_data,
        'submission_files': submission_files,
    }
    
    return render(request, 'ui/document_detail.html', context)


@login_required
def submissions_list(request):
    """List all submission files for the current user"""
    submissions = SubmissionFile.objects.filter(
        document__uploaded_by=request.user
    ).select_related('document').order_by('-created_at')
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        submissions = submissions.filter(
            Q(filename__icontains=search_query) |
            Q(document__filename__icontains=search_query) |
            Q(file_type__icontains=search_query)
        )
    
    # File type filter
    file_type_filter = request.GET.get('file_type', '')
    if file_type_filter:
        submissions = submissions.filter(file_type=file_type_filter)
    
    # Pagination
    paginator = Paginator(submissions, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get file type choices for filter
    file_types = submissions.values_list('file_type', flat=True).distinct()
    
    context = {
        'page_title': 'Submission Files',
        'submissions': page_obj,
        'search_query': search_query,
        'file_type_filter': file_type_filter,
        'file_types': file_types,
        'total_count': submissions.count(),
    }
    
    return render(request, 'ui/submissions.html', context)


@login_required
@require_http_methods(["POST"])
def process_document(request, document_id):
    """Start processing a document"""
    document = get_object_or_404(
        PDFDocument,
        id=document_id,
        uploaded_by=request.user
    )
    
    # Check if already processing
    if hasattr(document, 'extraction_task') and document.extraction_task.status == 'processing':
        return JsonResponse({
            'success': False,
            'message': 'Document is already being processed'
        })
    
    try:
        # Start processing task
        from pdf_processor.tasks import process_pdf_document
        task = process_pdf_document.delay(document.id)
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='process',
            description=f'Started processing: {document.filename}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            document_id=document.id
        )
        
        messages.success(request, f'Started processing {document.filename}')
        
        return JsonResponse({
            'success': True,
            'message': 'Processing started successfully',
            'task_id': task.id
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to start processing: {str(e)}'
        })


@login_required
@require_http_methods(["POST"])
def generate_submission(request, document_id):
    """Generate submission files for a document"""
    document = get_object_or_404(
        PDFDocument,
        id=document_id,
        uploaded_by=request.user
    )
    
    # Check if extraction is completed
    if not hasattr(document, 'extraction_task') or document.extraction_task.status != 'completed':
        return JsonResponse({
            'success': False,
            'message': 'Document must be processed before generating submissions'
        })
    
    try:
        # Get submission types from request
        submission_types = request.POST.getlist('submission_types', ['xpt'])
        
        # Start submission generation task
        from submission_generator.tasks import generate_submission_files
        task = generate_submission_files.delay(document.id, submission_types)
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='export',
            description=f'Generated submission files for: {document.filename}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            document_id=document.id
        )
        
        messages.success(request, f'Started generating submission files for {document.filename}')
        
        return JsonResponse({
            'success': True,
            'message': 'Submission generation started',
            'task_id': task.id
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to generate submissions: {str(e)}'
        })


@login_required
@require_http_methods(["POST"])
def delete_document(request, document_id):
    """Delete a document and its associated files"""
    document = get_object_or_404(
        PDFDocument,
        id=document_id,
        uploaded_by=request.user
    )
    
    try:
        filename = document.filename
        
        # Log activity before deletion
        UserActivity.objects.create(
            user=request.user,
            activity_type='delete',
            description=f'Deleted document: {filename}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            document_id=document.id
        )
        
        # Delete the document (cascade will handle related objects)
        document.delete()
        
        messages.success(request, f'Successfully deleted {filename}')
        
        return JsonResponse({
            'success': True,
            'message': 'Document deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to delete document: {str(e)}'
        })


@login_required
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    notification = get_object_or_404(SystemNotification, id=notification_id)
    notification.viewed_by.add(request.user)
    
    return JsonResponse({'success': True})


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


# API Views for AJAX requests

@login_required
@require_http_methods(["POST"])
def api_document_status(request):
    """Get status updates for multiple documents"""
    try:
        data = json.loads(request.body)
        document_ids = data.get('ids', [])
        
        statuses = []
        for doc_id in document_ids:
            try:
                document = PDFDocument.objects.get(
                    id=doc_id,
                    uploaded_by=request.user
                )
                
                status_info = {
                    'id': doc_id,
                    'status': 'pending',
                    'status_display': 'Pending',
                    'progress': 0
                }
                
                if hasattr(document, 'extraction_task'):
                    task = document.extraction_task
                    status_info.update({
                        'status': task.status,
                        'status_display': task.get_status_display(),
                        'progress': task.progress
                    })
                
                statuses.append(status_info)
                
            except PDFDocument.DoesNotExist:
                continue
        
        return JsonResponse({
            'success': True,
            'statuses': statuses
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })


@login_required
def api_dashboard_stats(request):
    """Get dashboard statistics"""
    try:
        # Calculate date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get statistics
        stats = {
            'total_documents': PDFDocument.objects.filter(uploaded_by=request.user).count(),
            'this_week': PDFDocument.objects.filter(
                uploaded_by=request.user,
                uploaded_at__date__gte=week_ago
            ).count(),
            'processing': ExtractionTask.objects.filter(
                document__uploaded_by=request.user,
                status='processing'
            ).count(),
            'completed_today': ExtractionTask.objects.filter(
                document__uploaded_by=request.user,
                status='completed',
                completed_at__date=today
            ).count(),
            'errors': ExtractionTask.objects.filter(
                document__uploaded_by=request.user,
                status='error'
            ).count(),
        }
        
        # Get domain distribution
        domain_stats = {}
        completed_tasks = ExtractionTask.objects.filter(
            document__uploaded_by=request.user,
            status='completed'
        )
        
        for task in completed_tasks:
            if task.domains_detected:
                for domain in task.domains_detected:
                    domain_stats[domain] = domain_stats.get(domain, 0) + 1
        
        return JsonResponse({
            'success': True,
            'stats': stats,
            'domain_stats': domain_stats
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })
