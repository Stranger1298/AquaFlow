# � AquaFlow - Premium Water Delivery Service

<div align="center">
  <img src="https://via.placeholder.com/150x150/2563eb/ffffff?text=💧" alt="AquaFlow Logo" width="150" height="150">
  
  **Fresh Water Delivered to Your Doorstep**
  
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF.svg)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.11-38B2AC.svg)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.49.4-3ECF8E.svg)](https://supabase.com/)
</div>

## 📖 About

AquaFlow is a modern, full-stack web application that provides premium water delivery services. Built with React, TypeScript, and powered by Supabase, it offers a seamless experience for customers to order fresh water and for vendors to manage their operations.

### ✨ Key Features

- � **E-commerce Platform** - Browse and order water products
- 👤 **User Authentication** - Secure login and registration
- 📱 **Responsive Design** - Works perfectly on all devices
- 💳 **Checkout System** - Smooth ordering process
- 📊 **Vendor Dashboard** - Comprehensive business management
- 🔄 **Order Tracking** - Real-time order status updates
- 🎨 **Modern UI** - Built with shadcn/ui components

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible components
- **React Router** - Client-side routing
- **React Hook Form** - Performant forms with validation

### Backend & Database
- **Supabase** - Backend as a service
- **PostgreSQL** - Robust relational database
- **Real-time subscriptions** - Live data updates

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Stranger1298/AquaFlow.git
cd AquaFlow
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using bun (recommended for faster installation):
```bash
bun install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server

```bash
npm run dev
```

Or with bun:
```bash
bun dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
AquaFlow/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AdPlayer.tsx
│   │   ├── NavigationBar.tsx
│   │   └── ProductCard.tsx
│   ├── contexts/         # React contexts for state management
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── OrderContext.tsx
│   │   └── ProductContext.tsx
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   │   └── supabase/
│   ├── lib/              # Utility functions
│   ├── pages/            # Application pages/routes
│   │   ├── vendor/       # Vendor-specific pages
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   └── ...
├── supabase/             # Supabase configuration
├── package.json
└── README.md
```

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🌟 Features in Detail

### For Customers
- **Product Catalog** - Browse various water products and packages
- **Shopping Cart** - Add/remove items with quantity management
- **User Registration & Login** - Secure authentication system
- **Order History** - Track all previous orders
- **Real-time Updates** - Get notified about order status changes

### For Vendors
- **Dashboard** - Comprehensive business overview
- **Order Management** - Process and fulfill customer orders
- **Product Management** - Add, edit, and manage product catalog
- **Analytics** - Business insights and performance metrics

### Technical Highlights
- **Type Safety** - Full TypeScript implementation
- **Real-time Data** - Supabase real-time subscriptions
- **Responsive Design** - Mobile-first approach
- **Component Library** - Consistent UI with shadcn/ui
- **Form Validation** - Robust form handling with Zod
- **State Management** - Efficient context-based state management

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready for deployment to any static hosting service.

### Deployment Options

- **Vercel** (Recommended)
- **Netlify**
- **GitHub Pages**
- **Any static hosting service**

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - The web framework used
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Supabase](https://supabase.com/) - Backend and database
- [Lucide React](https://lucide.dev/) - Icon library

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/Stranger1298/AquaFlow/issues) page
2. Create a new issue if your problem isn't already listed
3. Contact the maintainers

---

<div align="center">
  Made with ❤️ by the AquaFlow Team
  
  **[Live Demo](https://aquaflow-demo.vercel.app)** • **[Documentation](https://github.com/Stranger1298/AquaFlow/wiki)** • **[Report Bug](https://github.com/Stranger1298/AquaFlow/issues)**
</div>
