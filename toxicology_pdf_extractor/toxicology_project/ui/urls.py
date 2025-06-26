from django.urls import path
from . import views

app_name = 'ui'

urlpatterns = [
    # Main pages
    path('', views.dashboard, name='dashboard'),
    path('upload/', views.upload_pdf, name='upload'),
    path('documents/', views.documents_list, name='documents'),
    path('document/<int:document_id>/', views.document_detail, name='document_detail'),
    path('submissions/', views.submissions_list, name='submissions'),
    
    # Actions
    path('document/<int:document_id>/process/', views.process_document, name='process_document'),
    path('document/<int:document_id>/generate/', views.generate_submission, name='generate_submission'),
    path('document/<int:document_id>/delete/', views.delete_document, name='delete_document'),
    path('notification/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    
    # API endpoints
    path('api/document-status/', views.api_document_status, name='api_document_status'),
    path('api/dashboard-stats/', views.api_dashboard_stats, name='api_dashboard_stats'),
    
    # Static files handler (for development)
    path('static/<path:path>', lambda request, path: None, name='static'),
]
