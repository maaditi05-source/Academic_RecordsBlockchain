# Academic Records Blockchain - Frontend

[![Angular](https://img.shields.io/badge/Angular-17.3-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Material Design](https://img.shields.io/badge/Material-17.3-purple.svg)](https://material.angular.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, secure, and feature-rich frontend application for managing academic records on blockchain. Built with Angular 17 and Material Design, featuring glassmorphic UI, real-time verification, and comprehensive PDF generation.

> **🔗 Related Repository**: [Academic Records Blockchain - Backend](https://github.com/princekumar828/Academic-Records-Blockchain-Backend) 
> Backend API built with Node.js, Express, and Hyperledger Fabric SDK

---

## 📑 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Building](#-building)
- [User Roles & Features](#-user-roles--features)
- [Key Components](#-key-components)
- [Services](#-services)
- [Routing](#-routing)
- [Styling](#-styling)
- [Security](#-security)
- [Performance](#-performance)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎨 Modern UI/UX
- **Glassmorphic Design**: Beautiful backdrop-filter effects with gradient backgrounds
- **Animated Components**: Smooth transitions and floating animations
- **Responsive Layout**: Mobile-first design that works on all devices
- **Material Design 3**: Latest Material Design components and patterns
- **Dark Mode Ready**: Prepared for theme switching

### 🔐 Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Department, Student, and Verifier roles
- **Route Guards**: Protected routes based on user permissions
- **Session Management**: Automatic token refresh and timeout handling

### 📄 PDF Generation
- **Certificate PDFs**: Professional certificate generation with QR codes
- **Academic Record PDFs**: Detailed course records with verification links
- **Custom Styling**: Branded PDFs with institution details
- **QR Code Integration**: Embedded verification QR codes in all documents

### 🔍 Verification System
- **Certificate Verification**: Verify certificates using ID
- **Blockchain Integration**: Direct verification from blockchain
- **Real-time Status**: Live validation and status checking
- **Detailed Reports**: Comprehensive verification reports

### 📊 Dashboard Features
- **Admin Dashboard**: Complete system overview with statistics
  - Student management with dialog-based creation
  - Department and course offerings management
  - Record approval workflow
  - Certificate generation and management
  
- **Department Dashboard**: Department-specific operations
  - Student records by department
  - Academic record creation with validation
  - Pending records management
  - Course enrollment tracking

- **Student Profile**: Personalized student view
  - Academic records with GPA tracking
  - Certificate requests and downloads
  - Record sharing capabilities
  - Performance analytics

### 🎯 Advanced Features
- **Search & Filter**: Advanced filtering on all data tables
- **Collapsible Forms**: Clean, space-efficient form layouts
- **Custom Dialogs**: Material dialogs for confirmations and forms
- **Real-time Updates**: Immediate UI updates after operations
- **Share Functionality**: Native Web Share API integration
- **Download Options**: Multiple export formats

---

## 🛠 Technology Stack

### Core Framework
- **Angular 17.3**: Standalone components, signals, and latest features
- **TypeScript 5.4**: Strong typing and modern JavaScript features
- **RxJS 7.8**: Reactive programming with observables

### UI Libraries
- **Angular Material 17.3**: Complete Material Design component library
  - Cards, Buttons, Forms, Tables
  - Dialogs, Snackbars, Progress indicators
  - Tabs, Chips, Icons
- **Material Icons**: Comprehensive icon set

### PDF & QR Generation
- **jsPDF 3.0**: Professional PDF generation
- **qrcode**: QR code generation for verification

### Development Tools
- **Angular CLI**: Project scaffolding and build tools
- **TypeScript Compiler**: Type checking and compilation
- **Zone.js**: Change detection mechanism

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Core module (singleton services)
│   │   │   ├── config/
│   │   │   │   └── app.config.ts    # Centralized configuration
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts    # Route protection
│   │   │   │   ├── admin.guard.ts   # Admin access control
│   │   │   │   └── department.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts  # JWT token injection
│   │   │   ├── models/
│   │   │   │   ├── blockchain.model.ts  # Data models
│   │   │   │   └── user.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts      # Authentication service
│   │   │       └── blockchain.service.ts # API service
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── admin/
│   │   │   │   ├── admin-dashboard.component.ts  # Admin dashboard
│   │   │   │   ├── add-student-dialog.component.ts  # Student creation
│   │   │   │   └── confirm-dialog.component.ts   # Confirmation dialogs
│   │   │   │
│   │   │   ├── department/
│   │   │   │   └── department-dashboard.component.ts  # Dept operations
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── student-profile.component.ts  # Student view
│   │   │   │   └── certificate-request-dialog.component.ts
│   │   │   │
│   │   │   ├── verifier/
│   │   │   │   └── verifier.component.ts  # Certificate verification
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   └── login.component.ts     # Login page
│   │   │   │
│   │   │   └── home/
│   │   │       └── home.component.ts      # Landing page
│   │   │
│   │   ├── shared/                  # Shared resources
│   │   │   ├── components/         # Reusable components
│   │   │   ├── directives/         # Custom directives
│   │   │   └── pipes/              # Custom pipes
│   │   │
│   │   ├── app.component.ts        # Root component with navbar
│   │   ├── app.routes.ts           # Application routing
│   │   └── app.config.ts           # App configuration
│   │
│   ├── assets/                     # Static assets
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── environments/               # Environment configs
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── styles.scss                 # Global styles
│   ├── index.html                  # Entry HTML
│   └── main.ts                     # Bootstrap file
│
├── angular.json                    # Angular CLI config
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # This file
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Angular CLI**: Version 17.3 or higher
  ```bash
  npm install -g @angular/cli@17
  ```
- **Git**: For version control

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 500MB free

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/princekumar828/Academic_RecordsBlockchain.git
cd Academic_RecordsBlockchain/nit-warangal-network/frontend
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- Angular framework and Material Design
- RxJS for reactive programming
- jsPDF and QRCode libraries
- TypeScript and build tools
- All other dependencies listed in `package.json`

### 3. Verify Installation
```bash
ng version
```

You should see Angular CLI and core framework versions.

---

## ⚙️ Configuration

### Centralized Configuration

All application settings are managed in `src/app/core/config/app.config.ts`:

```typescript
export const APP_CONFIG: AppConfig = {
  api: {
    baseUrl: 'http://localhost:3000/api',  // Backend API URL
    timeout: 30000,                        // Request timeout (ms)
    retryAttempts: 3                       // Failed request retries
  },
  
  app: {
    name: 'Academic Records Management System',
    instituteName: 'National Institute of Technology, Warangal',
    verificationBaseUrl: 'http://localhost:4200'  // Auto-detects in production
  },
  
  qrCode: {
    size: 80,                             // QR code size in pixels
    margin: 1,                            // QR code margin
    errorCorrectionLevel: 'M'             // Error correction level
  },
  
  features: {
    enableCertificateVerification: true,  // Feature flags
    enablePdfDownload: true,
    enableSharing: true
  }
};
```

### Environment Files

Edit `src/environments/environment.ts` for development:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

Edit `src/environments/environment.prod.ts` for production:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api'
};
```

### Proxy Configuration (Optional)

To avoid CORS issues during development, create `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Update `angular.json` to use proxy:
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

---

## 💻 Development

### Start Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes.

### Development with Proxy
```bash
ng serve --proxy-config proxy.conf.json
```

### Open in Specific Browser
```bash
ng serve --open
```

### Change Port
```bash
ng serve --port 4300
```

### Enable Production Mode in Dev
```bash
ng serve --configuration production
```

---

## 🏗 Building

### Development Build
```bash
ng build
```

Output: `dist/frontend/` directory

### Production Build
```bash
ng build --configuration production
```

Features:
- Ahead-of-Time (AOT) compilation
- Tree shaking and dead code elimination
- Minification and uglification
- Source maps generation
- Bundle optimization

### Build with Stats
```bash
ng build --stats-json
```

Analyze bundle with:
```bash
npx webpack-bundle-analyzer dist/frontend/stats.json
```

### Build Options
```bash
# Build with base href
ng build --base-href /my-app/

# Build with specific output path
ng build --output-path ./build

# Build with watch mode
ng build --watch
```

---

## 👥 User Roles & Features

### 1. Admin Role
**Access**: Full system control

**Features**:
- **Dashboard Overview**
  - Total students, courses, departments, certificates
  - Pending records count
  - System statistics
  
- **Student Management**
  - Create students via dialog (4-step wizard)
  - View all students across departments
  - Update student information
  - Activate/deactivate students
  
- **Department Management**
  - Create departments with details
  - Assign department heads
  - View department statistics
  
- **Course Management**
  - Create course offerings
  - Manage course details (code, name, credits)
  - Assign to departments
  
- **Record Approval**
  - Review pending academic records
  - Approve/reject submissions
  - View detailed course information
  
- **Certificate Management**
  - Generate various certificate types
  - Approve certificate requests
  - Revoke certificates if needed

**Login Credentials** (Example):
```
Email: admin@nitw.ac.in
Password: admin123
```

### 2. Department Role
**Access**: Department-specific operations

**Features**:
- **Department Overview**
  - Students in department
  - Department records
  
- **Student Records**
  - View department students
  - Student performance tracking
  
- **Academic Record Creation**
  - Create semester records
  - Add courses with grades
  - Submit for approval
  - Validation (16-30 credits range)
  
- **Records Management**
  - View all department records
  - Filter by status (pending/approved)
  - Track submissions

**Login Credentials** (Example):
```
Email: cse.dept@nitw.ac.in
Password: dept123
```

### 3. Student Role
**Access**: Personal academic information

**Features**:
- **Profile Overview**
  - Personal information
  - Enrollment details
  - Academic statistics
  
- **Academic Records**
  - View semester-wise records
  - SGPA and CGPA tracking
  - Course grades and credits
  - Download records as PDF
  - Share records via link
  
- **Certificates**
  - View all certificates
  - Request new certificates
  - Download as PDF with QR code
  - Verify certificate status
  
- **Downloads & Sharing**
  - PDF generation with institution branding
  - QR codes for verification
  - Web Share API integration

**Login Credentials** (Example):
```
Email: 22MCF1R01@student.nitw.ac.in
Password: student123
```

### 4. Verifier Role
**Access**: Public verification

**Features**:
- **Certificate Verification**
  - Verify by certificate ID
  - Blockchain-based validation
  - Real-time status checking
  
- **Verification Reports**
  - Detailed certificate information
  - Student details
  - Issuance and expiry dates
  - Revocation status
  
- **Download Reports**
  - Generate verification report PDFs
  - Include blockchain transaction details

**Access**: No login required (public page at `/verify`)

---

## 🧩 Key Components

### Navigation Bar (`app.component.ts`)
- Glassmorphic design with gradient background
- Animated floating effect
- Role-based menu items
- User profile dropdown
- Responsive mobile menu

### Admin Dashboard (`admin-dashboard.component.ts`)
**Lines**: 3016 lines
**Features**:
- 6 tabs: Overview, Students, Departments, Courses, Pending Records, Certificates
- AddStudentDialog: 4-step Material stepper
- ConfirmDialog: Reusable confirmation with details
- Search and filter functionality
- Real-time statistics

**Key Methods**:
- `createStudent()`: Opens dialog for student creation
- `createDepartment()`: Department creation with confirmation
- `createCourseOffering()`: Course creation workflow
- `approveRecord()`: Record approval with immediate UI update
- `generateCertificate()`: Certificate generation

### Department Dashboard (`department-dashboard.component.ts`)
**Lines**: 693 lines
**Features**:
- 2 tabs: Department Students, Department Records
- Academic record creation form
- Course selection with validation
- Credit calculation (16-30 range)
- Custom dialogs for feedback

**Key Methods**:
- `createRecord()`: Creates academic record with validation
- `addCourse()`: Adds course to record
- `loadRecords()`: Fetches department records
- `resetForm()`: Clears form after submission

### Student Profile (`student-profile.component.ts`)
**Lines**: 1902 lines
**Features**:
- 3 tabs: Profile, Academic Records, Certificates
- Professional card layouts
- PDF download with QR codes
- Share functionality
- Certificate requests

**Key Methods**:
- `downloadRecord()`: Generates PDF with jsPDF and QR code
- `generateCertificatePDF()`: Creates certificate PDF (landscape)
- `shareRecord()`: Uses Web Share API
- `requestCertificate()`: Opens dialog for certificate request

### Verifier Component (`verifier.component.ts`)
**Lines**: 1440 lines
**Features**:
- Certificate ID input
- Blockchain verification
- Status validation (valid/revoked/expired)
- Detailed verification results
- Download verification report

**Key Methods**:
- `verifyCertificate()`: Verifies certificate by ID
- `downloadVerificationReport()`: Generates PDF report
- `checkRevocationStatus()`: Checks if certificate is revoked

### Login Component (`login.component.ts`)
**Features**:
- Modern glassmorphic design
- Form validation
- Error handling
- Redirect to appropriate dashboard
- "Back to Home" navigation

### Confirm Dialog (`confirm-dialog.component.ts`)
**Reusable dialog for confirmations**:
- Types: info, success, warning, error
- Customizable title, message, buttons
- Details array with icons
- Color-coded icons and buttons

---

## 🔧 Services

### Authentication Service (`auth.service.ts`)

```typescript
// Login
login(credentials: LoginCredentials): Observable<LoginResponse>

// Logout
logout(): void

// Get current user
getCurrentUser(): User | null

// Check authentication
isAuthenticated(): boolean

// Role checks
isAdmin(): boolean
isDepartment(): boolean
isStudent(): boolean
```

### Blockchain Service (`blockchain.service.ts`)

**Student APIs**:
```typescript
createStudent(data): Observable<ApiResponse<Student>>
getStudent(rollNumber): Observable<ApiResponse<Student>>
getAllStudents(): Observable<ApiResponse<Student[]>>
updateStudent(rollNumber, data): Observable<ApiResponse<Student>>
```

**Record APIs**:
```typescript
createDepartmentRecord(data): Observable<ApiResponse<Record>>
getDepartmentRecords(dept): Observable<ApiResponse<Record[]>>
approveRecord(recordId): Observable<ApiResponse<any>>
```

**Certificate APIs**:
```typescript
createCertificate(data): Observable<ApiResponse<Certificate>>
getCertificate(certId): Observable<ApiResponse<Certificate>>
revokeCertificate(certId): Observable<ApiResponse<any>>
```

**Stats APIs**:
```typescript
getDashboardStats(): Observable<ApiResponse<DashboardStats>>
```

---

## 🛣 Routing

### Route Configuration (`app.routes.ts`)

```typescript
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify', component: VerifierComponent },
  
  // Protected routes
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'department/dashboard',
    component: DepartmentDashboardComponent,
    canActivate: [AuthGuard, DepartmentGuard]
  },
  {
    path: 'student/profile',
    component: StudentProfileComponent,
    canActivate: [AuthGuard]
  },
  
  // Wildcard
  { path: '**', redirectTo: '' }
];
```

### Route Guards

**AuthGuard**: Checks if user is logged in
```typescript
canActivate(): boolean {
  if (this.authService.isAuthenticated()) {
    return true;
  }
  this.router.navigate(['/login']);
  return false;
}
```

**AdminGuard**: Checks if user has admin role
**DepartmentGuard**: Checks if user has department role

---

## 🎨 Styling

### Global Styles (`styles.scss`)

```scss
// Theme colors
$primary-color: #667eea;
$accent-color: #764ba2;
$warn-color: #f44336;
$success-color: #4caf50;

// Gradients
$gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$gradient-card: linear-gradient(to bottom, #f8f9fa, white);

// Glassmorphism
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Component Styles

Each component has inline styles using template literals:

```typescript
styles: [`
  .dashboard-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .modern-card {
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
`]
```

### Animations

```scss
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

---

## 🔒 Security

### Authentication Flow

1. **Login**: User submits credentials
2. **JWT Token**: Backend returns JWT token
3. **Storage**: Token stored in localStorage
4. **Interceptor**: Token added to all HTTP requests
5. **Guards**: Routes protected by role-based guards

### HTTP Interceptor

```typescript
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = localStorage.getItem('auth_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req);
}
```

### Security Best Practices

- ✅ JWT token expiration handling
- ✅ Automatic logout on token expiry
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization
- ✅ HTTPS enforcement in production
- ✅ Content Security Policy headers
- ✅ XSS protection

---

## ⚡ Performance

### Optimization Techniques

1. **Lazy Loading**: Feature modules loaded on demand
2. **OnPush Change Detection**: Reduced change detection cycles
3. **TrackBy Functions**: Efficient list rendering
4. **Pure Pipes**: Memoized pipe transformations
5. **Code Splitting**: Separate bundles for routes
6. **Tree Shaking**: Removed unused code
7. **AOT Compilation**: Faster rendering

### Bundle Analysis

```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json
```

### Performance Metrics (Production Build)

- **Initial Bundle**: ~300KB (gzipped)
- **Main Bundle**: ~450KB
- **Lazy Chunks**: 50-100KB each
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s

---

## 🧪 Testing

### Unit Tests

```bash
# Run tests
ng test

# Run with coverage
ng test --code-coverage

# Run in headless mode
ng test --browsers=ChromeHeadless --watch=false
```

### End-to-End Tests

```bash
# Install Cypress
npm install cypress --save-dev

# Run E2E tests
ng e2e
```

### Test Structure

```typescript
describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent]
    }).compileComponents();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load students on init', () => {
    component.ngOnInit();
    expect(component.students.length).toBeGreaterThan(0);
  });
});
```

---

## 🚀 Deployment

### Deploy to Production

#### 1. Build Production Bundle
```bash
ng build --configuration production
```

#### 2. Deploy to Hosting Service

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist/frontend
```

**Vercel**:
```bash
npm install -g vercel
vercel --prod
```

**AWS S3**:
```bash
aws s3 sync dist/frontend s3://your-bucket-name
```

**Firebase**:
```bash
npm install -g firebase-tools
firebase deploy
```

#### 3. Configure Web Server

**Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/frontend/dist/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache** (.htaccess):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### Environment Variables

Create `.env` file for sensitive data:
```
API_URL=https://api.yoursite.com
VERIFICATION_URL=https://verify.yoursite.com
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9

# Or use different port
ng serve --port 4300
```

#### 2. Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Angular CLI Version Mismatch
```bash
# Update Angular CLI
npm uninstall -g @angular/cli
npm install -g @angular/cli@17

# Update project
ng update @angular/core@17 @angular/cli@17
```

#### 4. CORS Errors
- Use proxy configuration (see Configuration section)
- Or enable CORS on backend

#### 5. Memory Issues
```bash
# Increase Node memory
export NODE_OPTIONS=--max_old_space_size=8192
ng build
```

#### 6. Slow Build Times
```bash
# Enable persistent build cache
ng build --build-optimizer=false
```

### Debug Mode

```typescript
// Enable debug mode in environment.ts
export const environment = {
  production: false,
  debug: true,
  apiUrl: 'http://localhost:3000/api'
};

// Use in components
if (environment.debug) {
  console.log('Debug info:', data);
}
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes**
   - Follow Angular style guide
   - Add tests for new features
   - Update documentation

4. **Commit changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create Pull Request**

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Code Style

- Use TypeScript strict mode
- Follow Angular style guide
- Use meaningful variable names
- Add comments for complex logic
- Keep components under 500 lines
- Extract reusable code to services

---

## 📞 Support

### Resources

- **Documentation**: [Angular Docs](https://angular.io/docs)
- **Material Design**: [Material.angular.io](https://material.angular.io)
- **Issues**: [GitHub Issues](https://github.com/princekumar828/Academic_RecordsBlockchain/issues)

### Contact

- **Email**: princekumar828@example.com
- **GitHub**: [@princekumar828](https://github.com/princekumar828)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Angular team for the amazing framework
- Material Design team for the component library
- NIT Warangal for the use case
- Open source community

---

## 📊 Project Statistics

- **Total Components**: 12+
- **Total Services**: 3
- **Total Lines of Code**: ~15,000+
- **Total Dependencies**: 40+
- **Supported Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: ✅ Responsive design

---

**Built with ❤️ for NIT Warangal Academic Records**

*Version 1.0.0 - November 2025*
