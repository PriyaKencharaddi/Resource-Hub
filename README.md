# CSE Resource Sharing Platform

A comprehensive web application for Computer Science Engineering students to share and access academic resources across all 8 semesters. The platform features role-based access control for students, teachers, and administrators, with real-time updates and comprehensive resource management.

## 🚀 Features

### User Roles & Authentication
- **Role-Based Access Control**: Three distinct roles - Student, Teacher, and Admin
- **Secure Authentication**: Firebase Authentication with email/password
- **Protected Routes**: Role-specific access to different sections of the application
- **User Management**: Admin can manage users, block/unblock accounts, and view user statistics

### Resource Management
- **Upload Resources**: Teachers and Admin can upload study materials with metadata
- **Real-Time Updates**: Live synchronization of resources using Firestore listeners
- **Resource Organization**: Resources organized by:
  - Semester (1st to 8th)
  - Subject and Subject Code
  - Academic Year
  - Term (Odd/Even)
- **File Support**: Supports PDFs, Word documents, PowerPoint presentations, and images
- **Download Tracking**: Automatic tracking of resource downloads per user
- **Cloud Storage**: Cloudinary integration for reliable file storage and management

### Dashboard Features

#### Student Dashboard
- Browse and search resources by semester, subject, year, and term
- Filter resources by type (PDF, DOC, PPT, images)
- View download history with real-time updates
- Access to all 8 semesters
- Pagination for easy navigation

#### Teacher Dashboard
- Upload resources with detailed metadata
- Manage uploaded resources
- View upload statistics
- Organized upload interface with validation

#### Admin Dashboard
- **Real-Time Analytics**: Live updates for uploads per semester
- **User Management**: View, block/unblock, and delete users
- **Resource Management**: View, delete, and manage all resources
- **Statistics Dashboard**:
  - Total users and resources count
  - Uploads per semester (real-time)
  - Faculty resource distribution
  - Top downloaded resources
  - User distribution by role
- **Admin Upload**: Direct resource upload capability
- **System Status**: Monitor Firestore, Cloudinary, and authentication services

### Search & Filter
- Advanced filtering by semester, subject, academic year, term, and file type
- Search functionality across all resources
- Real-time resource updates without page refresh

### Additional Features
- **My Downloads**: Track and view all downloaded resources
- **Responsive Design**: Fully responsive UI for desktop, tablet, and mobile
- **Modern UI/UX**: Clean, intuitive interface with Tailwind CSS
- **Real-Time Data**: Live updates using Firestore `onSnapshot` listeners

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router v7** for navigation
- **Lucide React** for icons
- **Vite** as build tool

### Backend Services
- **Firebase Authentication** for user management
- **Firebase Firestore** for database with real-time listeners
- **Cloudinary** for file storage and CDN

### Key Libraries
- **Axios** for HTTP requests
- **React Router DOM** for routing
- **Firebase SDK** for backend integration

## 📁 Project Structure

```
Resource-Hub/
├── public/                 # Static assets (images, logos)
├── src/
│   ├── components/
│   │   ├── common/        # Reusable components (ProtectedRoute)
│   │   ├── layout/        # Layout components (Navbar, Footer)
│   │   ├── CloudinaryUpload.tsx
│   │   └── ResourceList.tsx
│   ├── config/
│   │   └── firebase.ts    # Firebase configuration
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── AdminUpload.tsx
│   │   ├── Resources.tsx
│   │   ├── Semesters.tsx
│   │   └── MyDownloads.tsx
│   ├── types/
│   │   └── user.ts        # TypeScript type definitions
│   ├── utils/
│   │   ├── cloudinary.ts  # Cloudinary upload/delete utilities
│   │   └── getUserRole.ts
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Resource-Hub

# Install dependencies
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password method)
3. Create a Firestore database (start in test mode, then configure security rules)
4. Copy your Firebase configuration
5. Update `src/config/firebase.ts` with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 3. Cloudinary Configuration

1. Create a Cloudinary account at [Cloudinary](https://cloudinary.com/)
2. Create an unsigned upload preset named `campus_unsigned`
3. Update `src/utils/` with your Cloudinary cloud name:

```typescript
export const CLOUD_NAME = 'your-cloud-name';
export const UPLOAD_PRESET = 'campus_unsigned';
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## 📚 Resource Organization

Resources are organized with the following metadata:
- **Semester**: 1-8 (all semesters supported)
- **Subject**: Full subject name
- **Subject Code**: Subject code/identifier
- **Academic Year**: Academic year (e.g., "2024-2025")
- **Term**: Odd or Even semester
- **File Type**: PDF, DOC, DOCX, PPT, PPTX, images
- **Uploaded By**: Teacher name or Admin
- **Upload Date**: Timestamp of upload
- **Download Count**: Number of downloads

## 🎯 User Roles

### Student
- Browse and search resources
- Download resources
- View download history
- Access to all semesters

### Teacher
- Upload resources with metadata
- View upload statistics
- Manage own resources

### Admin
- All teacher capabilities
- Upload resources as admin
- Manage all users (block/unblock, delete)
- Manage all resources
- View comprehensive analytics
- Real-time dashboard updates
- System status monitoring

**Note**: Admin access is restricted to a specific email address (`sksvmacet@gmail.com`)

## 🔐 Security Features

- Role-based route protection
- Email-based admin verification
- Secure file uploads via Cloudinary
- Firestore security rules (should be configured)
- Protected authentication routes

## 📊 Real-Time Features

The application uses Firestore real-time listeners (`onSnapshot`) for:
- **Resource Updates**: Automatic updates when new resources are uploaded
- **Uploads per Semester**: Real-time count updates in admin dashboard
- **Download Tracking**: Live download history updates
- **User Statistics**: Real-time user and resource counts

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Mobile**: Phones and small devices (< 640px)
- **Tablet**: iPad and medium-sized screens (640px - 1024px)
- **Desktop**: Large screens and monitors (> 1024px)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Recommended Hosting Platforms
- **Vercel**: Easy deployment with automatic builds
- **Netlify**: Simple deployment with continuous integration
- **Firebase Hosting**: Integrated with Firebase services

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Help us improve by reporting bugs or suggesting features
2. **Upload Resources**: Share your notes, assignments, and projects (if you're a teacher/admin)
3. **Code Contributions**: Submit pull requests for new features or improvements

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain responsive design
- Test on multiple devices
- Follow existing code style

## 📞 Support

For support, questions, or feature requests:
- Email: priyakencharaddi@gmail.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## 🔄 Recent Updates

- ✅ Real-time updates for uploads per semester in admin dashboard
- ✅ Cloudinary integration for file storage
- ✅ Download tracking and history
- ✅ Role-based access control
- ✅ Admin dashboard with comprehensive analytics
- ✅ All 8 semesters support
- ✅ Academic year and term organization

## 📝 License

This project is developed for educational purposes.

---

**Made for CSE students by CSE students** 🎓
