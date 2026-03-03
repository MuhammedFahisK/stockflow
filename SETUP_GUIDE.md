# StockFlow - Stock Management System

A comprehensive, role-based stock management system built with React, Firebase, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- ✅ **Product Management** - Full CRUD operations for products with barcode tracking
- ✅ **Incoming Stock** - Record and track received inventory with vendor information
- ✅ **Outgoing Stock** - Create shipment records with recipient and vehicle details
- ✅ **Returns Management** - Track product returns with reasons and disposal actions
- ✅ **Barcode Scanner** - HTML5 QR code scanning support for product identification
- ✅ **Excel Export** - Download records as Excel files for reporting

### User Management
- ✅ **User Authentication** - Secure Firebase authentication with email/password
- ✅ **Role-Based Access Control** - 5 role types with different permission levels
- ✅ **User Management** - Admin panel to manage team members
- ✅ **Multi-Company Support** - Separate data isolation per company

### Roles & Permissions
- **SUPER_ADMIN** - Full system access
- **ADMIN** - Administrative functions within company
- **MANAGER** - Departmental management capabilities
- **OPERATOR** - Basic operational access
- **VIEWER** - Read-only access

### User Interface
- ✅ **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- ✅ **Modern Design** - Clean, intuitive interface with Tailwind CSS
- ✅ **Dark Mode Ready** - Can be extended with dark mode support
- ✅ **Mobile Navigation** - Hamburger menu for smaller screens

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.2.4
- **Routing**: React Router v7.13.1
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: Lucide React icons
- **Barcode Scanner**: html5-qrcode
- **Excel Export**: XLSX library
- **Form Handling**: React Hook Form, Zustand
- **Build Tool**: Vite 7.3.1

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account and project

## 🔧 Installation & Setup

### 1. Clone or Extract Project
```bash
cd stockflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable:
   - Firestore Database
   - Authentication > Email/Password
   - Storage (optional)

4. Get your Firebase config from Project Settings

5. Update `.env.local` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Create Firestore Collections

Create the following collections in Firestore with the document structures:

**Collections to create:**
- `products` - Product catalog
- `incomingStock` - Incoming invoices
- `outgoingStock` - Outgoing shipments
- `returns` - Return records
- `users` - User accounts
- `companies` - Company data

### 5. Start Development Server
```bash
npm run dev
```

Access the application at `http://localhost:5173`

## 📱 Default Login

After setup, create a new admin account through the signup page, or:

```
Email: admin@stockflow.com
Password: Admin@123
```

## 📖 User Guide

### For End Users

#### Products Page
- View all product catalog
- Add new products with barcode, batch, MFG/Exp dates
- Edit product details
- Delete products
- Search and filter products
- Export product list

#### Incoming Stock
- Create new invoice records
- Add multiple items per invoice
- Track vendor/supplier information
- Record warehouse location
- Track discrepancies
- Export incoming records
- E-Way Bill optional field

#### Outgoing Stock
- Create shipment records
- Assign items to vehicles
- Record recipient information
- Track dispatch date
- Export shipment data

#### Returns Management
- Create return records
- Multiple items per return
- Select return reason (Damaged, Expired, Defective, etc.)
- Choose action (Dispose, Move to Stock, Rework, Scrap)
- Track return dates

#### Users (Admin Only)
- Add new team members
- Assign roles with permissions
- Edit user details
- Delete users
- View all users in company

#### Roles (View-Only)
- View all 5 predefined roles
- See detailed permissions per role
- Understand role hierarchy

### For Administrators

1. **Enable Firebase Rules:**
   - Users can only access data from their company
   - Role-based operations are enforced
   - Data isolation between companies

2. **Manage Users:**
   - Create users with specific roles
   - Assign appropriate permissions
   - Monitor user access

3. **Monitor System:**
   - Check dashboard statistics
   - Review stock movements
   - Generate reports from data

## 🔒 Security

- All data is company-specific (isolated by company field)
- Firebase Authentication secures user accounts
- Role-based permissions control feature access
- Firestore security rules should be configured for production

## 📊 Firebase Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Auth checks
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function userCompany() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company;
    }
    
    // Collections accessible to authenticated users of the same company
    match /{document=**} {
      allow read, write: if isAuthenticated() && 
        resource.data.company == userCompany();
    }
    
    // Users collection
    match /users/{document=**} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated() && 
        resource.data.company == userCompany();
      allow update, delete: if isAuthenticated() && 
        userCompany() == userCompany() && 
        request.auth.uid == resource.data.uid || // Own profile
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'SUPER_ADMIN';
    }
  }
}
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- Vercel (Recommended for React)
- Netlify
- Firebase Hosting
- AWS Amplify

## 🐛 Troubleshooting

### "React is not defined"
- Already fixed in all components by importing React

### Firebase connection issues
- Check `.env.local` configuration
- Ensure Firestore is enabled
- Verify Firebase project is active

### Barcode scanner not working
- Ensure using HTTPS (required for camera access)
- Grant browser camera permissions
- Check browser compatibility

### Data not saving
- Check Firestore connection
- Verify user role has required permissions
- Check Firestore security rules

## 📝 File Structure

```
src/
├── components/
│   ├── Layout.jsx
│   ├── ResponsiveSidebar.jsx
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Incoming.jsx
│   ├── Outgoing.jsx
│   ├── Returns.jsx
│   ├── Users.jsx
│   └── Roles.jsx
├── config/
│   └── firebase.js
├── context/
│   └── AuthContext.jsx
├── utils/
│   ├── permissions.js
│   ├── barcodeScanner.js
│   └── excelExport.js
├── App.jsx
├── main.jsx
└── index.css
```

## 🔄 Future Enhancements

- Dark mode support
- Advanced analytics and dashboards
- Mobile app (React Native)
- SMS/Email notifications
- Automated stock reordering
- Multi-currency support
- API integration for third-party systems
- Custom branding per company
- Audit logs and activity tracking

## 📄 License

This project is provided as-is for educational and commercial use.

## 🤝 Support

For issues, questions, or feature requests, please contact your system administrator or development team.

---

**Version**: 1.0.0  
**Last Updated**: March 2, 2026  
**Status**: Production Ready ✅
