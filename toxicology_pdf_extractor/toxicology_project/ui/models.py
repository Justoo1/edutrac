from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Extended user profile for additional settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organization = models.CharField(max_length=200, blank=True)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    auto_process_uploads = models.BooleanField(default=True)
    default_study_phase = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} Profile"
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


class UserActivity(models.Model):
    """Track user activities for audit purposes"""
    ACTIVITY_TYPES = [
        ('upload', 'File Upload'),
        ('process', 'File Processing'),
        ('download', 'File Download'),
        ('view', 'Document View'),
        ('delete', 'Document Delete'),
        ('export', 'Data Export'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Optional reference to related objects
    document_id = models.IntegerField(null=True, blank=True)
    submission_id = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()} - {self.timestamp}"
    
    class Meta:
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"
        ordering = ['-timestamp']


class SystemNotification(models.Model):
    """System-wide notifications for users"""
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    
    # Targeting
    target_users = models.ManyToManyField(User, blank=True)
    target_all_users = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    viewed_by = models.ManyToManyField(User, related_name='viewed_notifications', blank=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name = "System Notification"
        verbose_name_plural = "System Notifications"
        ordering = ['-created_at']
