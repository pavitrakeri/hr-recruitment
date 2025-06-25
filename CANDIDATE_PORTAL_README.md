# Enhanced Candidate Portal - AImploy

## Overview

The Enhanced Candidate Portal is a comprehensive job application system that provides a secure, feature-rich experience for job seekers. It includes **mandatory email verification**, **dynamic application forms**, and **enhanced job data display**. The system ensures only verified HR professionals can post jobs and candidates must verify their email before accessing any features.

## 🔐 **Enhanced Authentication & Security**

### **Email Verification Required**
- **Mandatory Verification**: Candidates must verify their email before accessing any features
- **Secure Registration**: Email verification link sent automatically upon registration
- **Resend Functionality**: Users can resend verification emails if needed
- **Session Protection**: Unverified users are redirected to verification screen

### **Authentication Flow**
1. **Registration**: Email, password, full name, phone (optional)
2. **Email Verification**: Click link in email to verify account
3. **Login**: Only verified users can access the dashboard
4. **Password Reset**: Secure email-based password reset

## 📋 **Enhanced Job Browsing & Data**

### **Verified HR Jobs Only**
- **HR Verification**: Only jobs from verified HR professionals are displayed
- **Enhanced Job Data**: Each listing shows comprehensive information:
  - Job title and department
  - Location and employment type
  - **Salary range** (min/max with currency)
  - **Experience level** (Junior, Mid, Senior)
  - Company information
  - Posted date

### **Dynamic Job Display**
```typescript
interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  department: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  experience_level?: string;
  required_fields?: string[];
  custom_questions?: any[];
  created_at: string;
}
```

## 📝 **Dynamic Application Forms**

### **Adaptive Form Fields**
The application form dynamically adapts based on job requirements:

#### **Required Fields System**
- **Cover Letter**: Required if specified in job requirements
- **Resume Upload**: PDF only, max 5MB, required if specified
- **GitHub URL**: Required for technical positions
- **LinkedIn URL**: Required for professional roles
- **Portfolio URL**: Required for design/creative positions

#### **File Upload Security**
- **PDF Only**: Resumes must be in PDF format
- **Size Limit**: Maximum 5MB per file
- **Secure Storage**: Files stored in Supabase Storage with user-specific paths
- **Validation**: Real-time file type and size validation

#### **Custom Questions Support**
- **Dynamic Questions**: HR can add custom questions per job
- **Multiple Types**: Text input and textarea support
- **Required/Optional**: Questions can be marked as required
- **Structured Storage**: Answers stored as JSON for easy processing

### **Form Features**
- **Auto-fill**: Personal information pre-filled from profile
- **Validation**: Real-time validation of required fields
- **Progress Tracking**: Clear indication of form completion
- **Error Handling**: Comprehensive error messages and validation

## 🧾 **Enhanced Application Handling**

### **Application Data Structure**
```typescript
interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  name: string;
  email: string;
  phone: string;
  cover_letter?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  custom_answers?: Record<string, string>;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### **Duplicate Prevention**
- **One Application Per Job**: System prevents multiple applications
- **Visual Indicators**: "Applied" badge for submitted applications
- **Database Constraints**: Server-side validation

### **Application Storage**
- **Resume Files**: Securely stored in Supabase Storage
- **Profile Updates**: URLs automatically saved to candidate profile
- **Linked Data**: Applications linked to both candidate and job

## 📊 **Enhanced Dashboard Features**

### **Statistics Dashboard**
- **Available Jobs**: Count of active jobs from verified HRs
- **My Applications**: Total applications submitted
- **Under Review**: Applications currently being reviewed

### **Job Search & Filtering**
- **Real-time Search**: Search by title, department, or location
- **Enhanced Job Cards**: Display salary, experience level, and requirements
- **Apply Status**: Clear indication of application status

### **Application Tracking**
- **Status Updates**: Track application progress
- **Job Details**: View applied job information
- **Application History**: Complete history with timestamps

## 🏗️ **Technical Architecture**

### **Database Schema Updates**

#### **Enhanced Jobs Table**
```sql
ALTER TABLE public.jobs ADD COLUMN salary_min INTEGER;
ALTER TABLE public.jobs ADD COLUMN salary_max INTEGER;
ALTER TABLE public.jobs ADD COLUMN salary_currency TEXT DEFAULT 'USD';
ALTER TABLE public.jobs ADD COLUMN experience_level TEXT;
ALTER TABLE public.jobs ADD COLUMN custom_questions JSONB;
ALTER TABLE public.jobs ADD COLUMN required_fields JSONB;
```

#### **Enhanced Applications Table**
```sql
ALTER TABLE public.applications ADD COLUMN github_url TEXT;
ALTER TABLE public.applications ADD COLUMN linkedin_url TEXT;
ALTER TABLE public.applications ADD COLUMN portfolio_url TEXT;
ALTER TABLE public.applications ADD COLUMN custom_answers JSONB;
```

#### **Enhanced Candidate Profiles**
```sql
ALTER TABLE public.candidate_profiles ADD COLUMN github_url TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN linkedin_url TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN portfolio_url TEXT;
```

#### **HR Verification System**
```sql
ALTER TABLE public.profiles ADD COLUMN is_verified_hr BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN verification_date TIMESTAMP WITH TIME ZONE;
```

### **Security Policies**
- **Verified HR Jobs Only**: RLS policy ensures only verified HR jobs are visible
- **Candidate Data Protection**: Candidates can only access their own data
- **File Upload Security**: Secure storage with user-specific paths

## 🎨 **User Experience Enhancements**

### **Visual Design**
- **Distinct Styling**: Green-to-blue gradient theme for candidates
- **Status Indicators**: Color-coded application status badges
- **Loading States**: Smooth loading animations
- **Responsive Design**: Works on all device sizes

### **User Flow**
1. **Landing Page**: Choose between HR and Candidate portals
2. **Registration**: Create account with email verification
3. **Email Verification**: Verify email to activate account
4. **Dashboard Access**: Browse jobs and manage applications
5. **Dynamic Application**: Fill job-specific application forms
6. **Application Tracking**: Monitor application status

## 🚀 **Setup & Configuration**

### **Database Migration**
Run the enhanced migration:
```bash
# File: 20250619000000-add-candidate-portal.sql
# This includes:
# - Enhanced job fields (salary, experience, custom questions)
# - HR verification system
# - Enhanced application fields
# - Sample verified HR data and jobs
```

### **Supabase Configuration**
Ensure your Supabase project has:
- **Email Templates**: Configure verification and reset emails
- **Storage Bucket**: 'applications' bucket for resume uploads
- **RLS Policies**: Proper security policies for all tables
- **Email Settings**: Configure SMTP for email delivery

### **Environment Variables**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 **Usage Examples**

### **For Candidates**

#### **Registration & Verification**
```typescript
// Registration flow
1. Visit /candidate
2. Click "Sign Up"
3. Fill: Full Name, Email, Phone (optional), Password
4. Check email for verification link
5. Click verification link
6. Sign in to access dashboard
```

#### **Job Application**
```typescript
// Dynamic application process
1. Browse available jobs
2. Click "Apply Now" on desired position
3. Fill required fields based on job requirements:
   - Cover letter (if required)
   - Resume upload (PDF, max 5MB)
   - GitHub/LinkedIn/Portfolio URLs (if required)
   - Custom questions (if any)
4. Submit application
5. Track status in "My Applications"
```

### **For HR/Admins**

#### **Job Creation with Enhanced Fields**
```sql
INSERT INTO jobs (
  hr_id, title, type, location, department, description,
  salary_min, salary_max, experience_level, required_fields
) VALUES (
  'hr_user_id', 'Senior Developer', 'Full-time', 'Remote',
  'Engineering', 'Job description...',
  80000, 120000, 'Senior',
  '["resume", "cover_letter", "github_url"]'
);
```

## 🔒 **Security Features**

### **Authentication Security**
- **Email Verification**: Prevents fake accounts
- **Session Management**: Secure session handling
- **Password Requirements**: Strong password validation
- **Rate Limiting**: Prevents brute force attacks

### **Data Protection**
- **Row Level Security**: Database-level access control
- **File Upload Security**: Type and size validation
- **Input Sanitization**: XSS protection
- **CSRF Protection**: Built-in CSRF protection

### **Privacy Features**
- **Candidate Isolation**: Candidates can only see their own data
- **HR Verification**: Only verified HR professionals can post jobs
- **Secure File Storage**: Encrypted file storage with access controls

## 🎯 **Future Enhancements**

### **Planned Features**
- **Profile Management**: Allow candidates to update profiles
- **Skills Assessment**: AI-powered skills evaluation
- **Interview Scheduling**: Direct interview booking
- **Notifications**: Email/SMS for application updates
- **Resume Builder**: Built-in resume creation
- **Job Alerts**: Email notifications for matching jobs
- **Application Analytics**: Detailed insights

### **Advanced Features**
- **Video Applications**: Record video introductions
- **Skills Matching**: AI-powered job-candidate matching
- **Reference System**: Digital reference collection
- **Background Checks**: Integrated background verification
- **Multi-language Support**: International candidate support

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Email Verification Problems**
```bash
# Check Supabase email settings
# Verify SMTP configuration
# Check spam folder for verification emails
```

#### **File Upload Issues**
```bash
# Verify storage bucket exists
# Check file size limits (5MB)
# Ensure PDF format only
# Verify storage policies
```

#### **Job Display Issues**
```bash
# Check HR verification status
# Verify job status is 'active'
# Check RLS policies
# Ensure proper data in database
```

## 📞 **Support**

For technical support or questions about the enhanced candidate portal:
- **Documentation**: Refer to this README
- **Issues**: Check GitHub issues
- **Email**: support@aimploy.com

---

**Version**: 2.0 Enhanced  
**Last Updated**: January 2025  
**Compatibility**: Supabase, React 18+, TypeScript 