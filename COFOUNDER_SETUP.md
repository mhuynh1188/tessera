# Hex-App (Tessera) - Cofounder Setup Guide

Welcome to the Hex-App project! This guide will help you set up the development environment on your local machine.

## 🏗️ Project Overview

**Hex-App (Tessera)** is an interactive hexagon workspace application for business pattern recognition and facilitation. It includes:

- Interactive hexagon placement and manipulation
- Scenario-based learning modules
- Real-time collaboration features
- Advanced analytics and insights
- Gamified workspace mechanics

## 📦 Repository Access

**Repository URL**: https://github.com/mhuynh1188/hex-app (Private)

**Access Requirements**: You should have received an invitation to collaborate on this private repository. If not, please contact Michael Huynh (mhuynh1188) to be added as a collaborator.

## 🔧 Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

### Verify Installation
```bash
node --version    # Should show v18+ 
npm --version     # Should show npm version
git --version     # Should show git version
```

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/mhuynh1188/hex-app.git
cd hex-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure it:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Supabase Configuration (get from Michael)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Liveblocks (for real-time collaboration)
LIVEBLOCKS_SECRET_KEY=your_liveblocks_key

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at: http://localhost:3000

## 🎯 Key Features & Usage

### Main Workspace
- Navigate to `/workspace/board` for the main interactive workspace
- Add hexagons (tesseras) from the side menu
- Drag and drop to arrange patterns
- Right-click for context menus and additional options

### Scenarios
- Use the Scenarios tab to load predefined business scenarios
- Scenarios automatically switch you to the workspace with context

### Analytics
- Visit `/analytics` for advanced pattern recognition insights
- Export data and generate reports

## 🗂️ Project Structure

```
hex-app/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── workspace/          # Main workspace pages
│   │   ├── analytics/          # Analytics dashboard
│   │   └── auth/              # Authentication pages
│   ├── components/            # React components
│   │   ├── workspace/         # Workspace-specific components
│   │   ├── scenarios/         # Scenario management
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utility libraries
│   └── types/                # TypeScript type definitions
├── database/                 # SQL schema and migrations
└── public/                  # Static assets
```

## 🔐 Database Access

The application uses **Supabase** for database and authentication. Contact Michael Huynh for:
- Database access credentials
- Admin panel access (if needed)
- Environment variables

## 🚨 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**Node version issues:**
Use Node Version Manager (nvm):
```bash
nvm install 18
nvm use 18
```

**Package installation fails:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
1. Verify your Supabase environment variables
2. Check if your IP is allowlisted in Supabase dashboard
3. Contact Michael for database access

## 📱 Testing

Run the test suite:
```bash
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
```

## 🚀 Deployment

For production deployment:
```bash
npm run build          # Build for production
npm start             # Start production server
```

## 🤝 Development Workflow

### Branching Strategy
1. Create feature branches from `main`
2. Use descriptive branch names: `feature/scenario-improvements`
3. Submit pull requests for review

### Code Style
- The project uses ESLint and Prettier
- Run `npm run lint` to check code style
- VS Code extensions recommended for auto-formatting

## 📞 Support & Contact

**Primary Contact**: Michael Huynh (mhuynh1188)

**Team Members**:
- Masha Omeragic (masha.omeragic@gmail.com)
- Ralph Jocham (ralphjocham@mac.com)
- John (john@orderlydisruption.com)

For technical issues:
1. Check this README first
2. Review existing GitHub issues
3. Contact Michael for environment variables or database access
4. Create a new GitHub issue for bugs/feature requests

## 🔄 Recent Updates

- ✅ Improved hexagon positioning and centering
- ✅ Fixed menu interaction displacement issues
- ✅ Enhanced scenario auto-switching functionality
- ✅ Optimized responsive grid layouts
- ✅ Added comprehensive testing suite

---

**Happy coding!** 🎉 Welcome to the Tessera team!