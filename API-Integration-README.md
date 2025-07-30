# PIF Vue App - SubmitIQ Authentication Integration

## Overview

This Vue.js application has been updated with a professional, secure, and fast authentication system that integrates with the SubmitIQ Authentication API. The implementation follows security best practices and provides a seamless user experience.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SubmitIQ Authentication API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔐 Authentication Features

### Core Security Features

- **JWT Token Management**: Secure access and refresh token handling
- **Automatic Token Refresh**: Seamless token renewal on expiration
- **Role-Based Access Control**: Administrator and Company user roles
- **Account Status Management**: Pending, Accepted, Rejected status handling
- **Password Security**: Strong password requirements (12+ chars, uppercase, lowercase, digit, special character)
- **Rate Limiting Protection**: Built-in handling for API rate limits
- **Session Management**: Secure token storage and automatic cleanup

### User Registration

The registration process includes:

- **Username**: 3-30 characters, alphanumeric and underscores only
- **Email**: Valid email format, must be unique
- **Password**: Minimum 12 characters with complexity requirements
- **Name Fields**: First and last name (max 30 characters each)
- **Account Status**: All new accounts start as "Pending" and require admin approval

### User Login

Login supports:

- **Flexible Authentication**: Username or email + password
- **Account Validation**: Checks for account status and activity
- **Error Handling**: User-friendly error messages for different scenarios
- **Remember Me**: Optional extended session

## 🏗️ Architecture

### Services

#### AuthService (`src/services/authService.ts`)

Core authentication service with:

- **Token Management**: Secure storage in sessionStorage (access) and localStorage (refresh)
- **HTTP Client**: Axios with automatic token refresh interceptors
- **API Integration**: Full SubmitIQ API endpoint coverage
- **Error Handling**: Comprehensive error parsing and user-friendly messages

#### NotificationService (`src/services/notificationService.ts`)

Professional notification system:

- **Toast Notifications**: Success, error, warning, and info types
- **Auto-dismiss**: Configurable duration
- **Authentication Helpers**: Pre-configured messages for auth scenarios

#### Auth Store (`src/stores/useAuthStore.ts`)

Pinia store for global state management:

- **Reactive State**: User data, authentication status, loading states
- **Computed Properties**: Role checking, permissions, display names
- **Actions**: Login, register, logout, profile management
- **Helpers**: Status checking, permission validation

### Components

#### AuthCard (`src/components/AuthCard/AuthCard.vue`)

Unified authentication form component:

- **Dynamic Mode**: Switches between login and registration
- **Validation**: Real-time field validation
- **Password Strength**: Visual password requirements
- **Accessibility**: ARIA labels, keyboard navigation

#### NotificationContainer (`src/components/NotificationContainer/`)

Professional notification display:

- **Visual Design**: Modern toast notifications
- **Animations**: Smooth enter/exit transitions
- **Responsive**: Mobile-optimized layouts
- **Theming**: Light/dark mode support

### Router Guard

Advanced authentication protection:

- **Route Protection**: Automatic redirect for unauthenticated users
- **Token Validation**: Real-time token validity checking
- **Session Expiry**: Graceful handling of expired sessions

## 🔧 Configuration

### API Configuration

Update the API base URL in `src/services/authService.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1'
```

### Token Lifetimes

Configure token durations:

```typescript
const ACCESS_TOKEN_LIFETIME = 7 * 60 * 1000 // 7 minutes
```

## 📊 API Integration

### Endpoints Used

- `POST /auth/login/` - User authentication
- `POST /auth/register/` - User registration  
- `POST /auth/logout/` - Session termination
- `POST /auth/token/refresh/` - Token renewal
- `GET /auth/profile/` - User profile retrieval
- `PATCH /auth/profile/` - Profile updates
- `POST /auth/profile/change-password/` - Password changes

### Request/Response Flow

1. **Registration**: User submits form → API validates → Account created as "Pending"
2. **Login**: Credentials submitted → API validates → Returns JWT tokens + user data
3. **Token Refresh**: Automatic on 401 responses → New tokens issued → Request retried
4. **Logout**: Refresh token blacklisted → Local tokens cleared → Redirect to login

## 🎨 User Experience

### Visual Feedback

- **Loading States**: Spinners and disabled states during API calls
- **Success Messages**: Professional toast notifications
- **Error Handling**: Clear, actionable error messages
- **Progress Indicators**: Visual feedback for multi-step processes

### Responsive Design

- **Mobile First**: Optimized for all screen sizes
- **Touch Friendly**: Large tap targets, gesture support
- **Accessibility**: WCAG compliant, screen reader friendly

## 🔒 Security Implementation

### Token Security

- **Storage**: Access tokens in sessionStorage, refresh tokens in localStorage
- **Headers**: Proper Authorization Bearer token format
- **Rotation**: Automatic token refresh prevents long-lived sessions
- **Cleanup**: Complete token removal on logout/session expiry

### Password Security

- **Client Validation**: Real-time password strength checking
- **Server Validation**: API enforces security requirements
- **Secure Transmission**: HTTPS required for production

### Session Management

- **Automatic Expiry**: Tokens expire per API configuration
- **User Feedback**: Clear session expiry notifications
- **Forced Logout**: Password changes invalidate all sessions

## 🧪 Testing

### Manual Testing

1. **Registration Flow**:
   ```bash
   # Navigate to /register
   # Fill out form with valid data
   # Verify "Pending" status message
   ```

2. **Login Flow**:
   ```bash
   # Navigate to /login
   # Use approved account credentials
   # Verify successful dashboard redirect
   ```

3. **Token Refresh**:
   ```bash
   # Wait for token expiry (7 minutes)
   # Make authenticated request
   # Verify automatic refresh
   ```

### Test Accounts

Create test accounts through the registration endpoint. Accounts require admin approval to become active.

## 📋 Environment Setup

### Development

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚨 Error Handling

### Common Scenarios

- **Invalid Credentials**: Clear message with retry option
- **Account Pending**: Information about approval process
- **Rate Limiting**: User-friendly delay message
- **Network Issues**: Retry suggestions and connection checks
- **Session Expiry**: Automatic redirect with explanation

### Error Types

- **Validation Errors**: Field-specific error messages
- **Authentication Errors**: Login/registration failures
- **Authorization Errors**: Permission-based access denials
- **Network Errors**: Connection and timeout issues

## 🎯 Best Practices

### Performance

- **Lazy Loading**: Route-based code splitting
- **Token Caching**: Efficient storage and retrieval
- **Request Optimization**: Minimal API calls, efficient caching

### Security

- **Input Validation**: Client and server-side validation
- **XSS Protection**: Proper data sanitization
- **CSRF Protection**: Token-based request authentication

### User Experience

- **Progressive Enhancement**: Works without JavaScript for basic features
- **Offline Handling**: Graceful degradation when offline
- **Loading States**: Always show user what's happening

## 📖 API Documentation

Full API documentation available at: `http://localhost:8000/api/docs/`

### Key Features

- **Interactive Docs**: Swagger/OpenAPI interface
- **Request Examples**: Copy-paste ready code samples
- **Response Schemas**: Complete data structure documentation
- **Authentication**: Token-based security testing

## 🛠️ Development Notes

### Code Organization

- **Services**: Business logic and API integration
- **Stores**: Global state management with Pinia
- **Components**: Reusable UI components
- **Pages**: Route-specific views
- **Styles**: CSS modules with theme support

### Type Safety

- **TypeScript**: Full type coverage
- **Interface Definitions**: Clear API contracts
- **Type Guards**: Runtime type checking

### Styling

- **CSS Modules**: Scoped styles
- **Theme Support**: Light/dark mode
- **Responsive**: Mobile-first approach
- **Animations**: Smooth, performant transitions

## 🔄 Future Enhancements

### Planned Features

- **Remember Me**: Extended session duration
- **Password Recovery**: Email-based password reset
- **Two-Factor Authentication**: TOTP/SMS support
- **Social Login**: OAuth integration
- **Account Management**: Self-service profile updates

### Performance Optimizations

- **Service Workers**: Offline functionality
- **Caching Strategies**: Intelligent data caching
- **Bundle Optimization**: Tree shaking and minification

## 📞 Support

For technical support or questions:

1. Check the API documentation: `http://localhost:8000/api/docs/`
2. Review error messages in browser console
3. Verify API server is running and accessible
4. Check network connectivity and CORS configuration

## 📝 Changelog

### Version 1.0.0

- ✅ Complete SubmitIQ API integration
- ✅ Professional authentication UI
- ✅ Automatic token refresh
- ✅ Role-based access control
- ✅ Comprehensive error handling
- ✅ Mobile-responsive design
- ✅ Security best practices
- ✅ TypeScript implementation
- ✅ Notification system
- ✅ Route protection
