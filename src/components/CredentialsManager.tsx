'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Mail,
  User,
  Users,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Download,
  GraduationCap,
  UserCog,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/types';

interface CredentialsManagerProps {
  company: Company;
  onClose: () => void;
}

interface UserCredentials {
  role: 'admin' | 'coordinator' | 'learner';
  email: string;
  password: string;
  portalUrl: string;      // Actual working URL (Vercel or custom domain)
  displayUrl: string;     // User-friendly URL to show in credentials
  name: string;
}

/**
 * Portal Domain Configuration
 * ===========================
 *
 * Dynamic subdomain-based URLs for white-label client portals.
 * Format: {company-slug}.learnova.training
 *
 * Examples:
 * - PWC: pwc.learnova.training
 * - Accenture: accenture.learnova.training
 * - TCS: tcs.learnova.training
 *
 * Fallback Vercel URLs (for development or if custom domain not configured):
 * - Student Portal: learnovastudent3.vercel.app
 * - TC Dashboard: koeniglearnova.vercel.app
 * - Sales Portal: salesmanager.vercel.app
 */

// Base domain for white-label portals
const LEARNOVA_DOMAIN = process.env.NEXT_PUBLIC_LEARNOVA_DOMAIN || 'learnova.training';

// Fallback Vercel URLs
const FALLBACK_URLS = {
  student: process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'https://learnovastudent3.vercel.app',
  coordinator: process.env.NEXT_PUBLIC_TC_PORTAL_URL || 'https://koeniglearnova.vercel.app',
  sales: process.env.NEXT_PUBLIC_SALES_PORTAL_URL || 'https://salesmanager.vercel.app',
};

// Check if custom domain is configured
const useCustomDomain = process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAIN === 'true';

// Get the base URL for portals based on role and company
function getPortalUrl(role: 'admin' | 'coordinator' | 'learner', companySlug: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.host;

    // For development/localhost - use localhost URLs
    if (host.includes('localhost')) {
      const port = role === 'learner' ? '3001' : role === 'coordinator' || role === 'admin' ? '3002' : '3000';
      const roleParam = role === 'admin' ? '&role=admin' : '';
      return `http://localhost:${port}?company=${companySlug}${roleParam}`;
    }
  }

  // Use custom subdomain format: {company}.learnova.training
  if (useCustomDomain) {
    const baseUrl = `https://${companySlug}.${LEARNOVA_DOMAIN}`;
    switch (role) {
      case 'learner':
        return baseUrl;
      case 'coordinator':
        return `${baseUrl}/tc`;
      case 'admin':
        return `${baseUrl}/admin`;
      default:
        return baseUrl;
    }
  }

  // Fallback to Vercel deployment URLs with query params
  switch (role) {
    case 'learner':
      return `${FALLBACK_URLS.student}?company=${companySlug}`;
    case 'coordinator':
      return `${FALLBACK_URLS.coordinator}?company=${companySlug}`;
    case 'admin':
      return `${FALLBACK_URLS.coordinator}?company=${companySlug}&role=admin`;
    default:
      return `${FALLBACK_URLS.student}?company=${companySlug}`;
  }
}

// Generate display URL for credentials (user-friendly format)
function getDisplayUrl(role: 'admin' | 'coordinator' | 'learner', companySlug: string): string {
  // Always show the nice subdomain format in credentials
  const baseUrl = `https://${companySlug}.${LEARNOVA_DOMAIN}`;
  switch (role) {
    case 'learner':
      return baseUrl;
    case 'coordinator':
      return `${baseUrl}/tc`;
    case 'admin':
      return `${baseUrl}/admin`;
    default:
      return baseUrl;
  }
}

export default function CredentialsManager({ company, onClose }: CredentialsManagerProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'coordinator' | 'learner'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Generate credentials for different user types with proper portal URLs
  const credentials: Record<string, UserCredentials> = {
    admin: {
      role: 'admin',
      name: 'Company Admin',
      email: company.adminEmail || `admin@${company.slug}.com`,
      password: `Admin${company.slug.charAt(0).toUpperCase()}${company.slug.slice(1)}2024!`,
      portalUrl: getPortalUrl('admin', company.slug),
      displayUrl: getDisplayUrl('admin', company.slug),
    },
    coordinator: {
      role: 'coordinator',
      name: 'Training Coordinator',
      email: `coordinator@${company.slug}.com`,
      password: `Train${company.slug.charAt(0).toUpperCase()}${company.slug.slice(1)}2024!`,
      portalUrl: getPortalUrl('coordinator', company.slug),
      displayUrl: getDisplayUrl('coordinator', company.slug),
    },
    learner: {
      role: 'learner',
      name: 'Student/Learner',
      email: `learner@${company.slug}.com`,
      password: `Learn${company.slug.charAt(0).toUpperCase()}${company.slug.slice(1)}2024!`,
      portalUrl: getPortalUrl('learner', company.slug),
      displayUrl: getDisplayUrl('learner', company.slug),
    },
  };

  const currentCreds = credentials[activeTab];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllCredentials = () => {
    const text = `
${company.name} - ${currentCreds.name} Credentials
==========================================

Portal URL: ${currentCreds.displayUrl}
Email: ${currentCreds.email}
Password: ${currentCreds.password}

Note: Please change your password after first login.
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(null), 2000);
  };

  const regeneratePassword = () => {
    // In a real app, this would call an API to regenerate the password
    alert('Password regeneration would be handled by the backend API');
  };

  const sendCredentialsEmail = () => {
    // Generate email body with credentials
    const subject = encodeURIComponent(`${company.name} - ${currentCreds.name} Portal Access Credentials`);
    const body = encodeURIComponent(`
Hello,

Here are your ${company.name} ${currentCreds.name} portal access credentials:

Portal URL: ${currentCreds.displayUrl}
Email: ${currentCreds.email}
Password: ${currentCreds.password}

Please bookmark the portal URL and change your password after first login.

If you have any questions, please contact your administrator.

Best regards,
${company.name} Learning Team

---
This is an automated message from Koenig Learnova Platform.
    `.trim());

    // Open default email client with pre-filled content
    window.open(`mailto:${currentCreds.email}?subject=${subject}&body=${body}`, '_blank');

    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  // Send credentials to a specific email address (e.g., TC email)
  const sendToRecipient = (recipientEmail: string) => {
    const subject = encodeURIComponent(`${company.name} - ${currentCreds.name} Portal Access Credentials`);
    const body = encodeURIComponent(`
Hello,

Here are the ${company.name} ${currentCreds.name} portal access credentials:

Portal URL: ${currentCreds.displayUrl}
Email: ${currentCreds.email}
Password: ${currentCreds.password}

Please share these credentials securely and ask the user to change their password after first login.

Best regards,
${company.name} Sales Team

---
This is an automated message from Koenig Learnova Platform.
    `.trim());

    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const downloadCredentials = () => {
    const allCreds = Object.values(credentials);
    let content = `${company.name} - Portal Access Credentials\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `==========================================\n\n`;

    allCreds.forEach((cred) => {
      content += `${cred.name}\n`;
      content += `-----------\n`;
      content += `Portal URL: ${cred.displayUrl}\n`;
      content += `Email: ${cred.email}\n`;
      content += `Password: ${cred.password}\n\n`;
    });

    content += `\nNote: Please share these credentials securely and ask users to change their passwords after first login.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company.slug}-credentials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Portal Access Credentials</h2>
            <p className="text-sm text-gray-500">{company.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'admin', label: 'Admin', icon: Shield, color: 'violet' },
            { id: 'coordinator', label: 'Training Coordinator', icon: UserCog, color: 'blue' },
            { id: 'learner', label: 'Learner', icon: GraduationCap, color: 'green' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-cyan-600 text-cyan-600 bg-cyan-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Role Description */}
          <div className={cn(
            'p-4 rounded-xl',
            activeTab === 'admin' && 'bg-violet-50 border border-violet-200',
            activeTab === 'coordinator' && 'bg-blue-50 border border-blue-200',
            activeTab === 'learner' && 'bg-green-50 border border-green-200'
          )}>
            <h3 className="font-semibold text-gray-900 mb-1">{currentCreds.name}</h3>
            <p className="text-sm text-gray-600">
              {activeTab === 'admin' && 'Full access to manage users, view reports, and configure portal settings.'}
              {activeTab === 'coordinator' && 'Manage learner enrollments, track progress, and generate reports.'}
              {activeTab === 'learner' && 'Access courses, take quizzes, and track personal learning progress.'}
            </p>
          </div>

          {/* Credentials */}
          <div className="space-y-4">
            {/* Portal URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Portal URL
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <code className="text-sm text-cyan-600 break-all">{currentCreds.displayUrl}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(currentCreds.displayUrl, 'url')}
                  className={cn(
                    'p-3 rounded-lg transition-colors',
                    copied === 'url' ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  )}
                  title="Copy URL"
                >
                  {copied === 'url' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <a
                  href={currentCreds.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  title="Open Portal"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Login Email
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <code className="text-sm text-gray-900">{currentCreds.email}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(currentCreds.email, 'email')}
                  className={cn(
                    'p-3 rounded-lg transition-colors',
                    copied === 'email' ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  )}
                >
                  {copied === 'email' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Temporary Password
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="w-4 h-4 text-gray-400" />
                  <code className="text-sm text-gray-900">
                    {showPassword ? currentCreds.password : '••••••••••••••'}
                  </code>
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(currentCreds.password, 'password')}
                  className={cn(
                    'p-3 rounded-lg transition-colors',
                    copied === 'password' ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  )}
                >
                  {copied === 'password' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyAllCredentials}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                copied === 'all'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {copied === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'all' ? 'Copied!' : 'Copy All'}
            </button>

            <button
              onClick={sendCredentialsEmail}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                emailSent
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              )}
            >
              {emailSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {emailSent ? 'Email Sent!' : 'Send via Email'}
            </button>

            <button
              onClick={regeneratePassword}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate Password
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={downloadCredentials}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download All Credentials
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
