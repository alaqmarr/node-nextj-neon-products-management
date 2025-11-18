# Full-Stack Product Management System with Real-Time Task Queue

A blazing-fast, production-ready product management system featuring an innovative client-side task queue architecture with real-time status updates via WebSockets.

> **⚡ Built for Performance:** Experience optimistic UI updates and non-blocking operations that make database writes feel instant.

---

## 📸 Demo

> [!TIP]
> **Action Required:** Add a screenshot or GIF showcasing the real-time task queue in action!
>
> Perfect demo: Show creating a product → Task appears as "Queued" → Transitions to "Processing" → Finally "Success" — all updating live in the sidebar.
>
> ```markdown
> ![Project Demo](./assets/demo.gif)
> ```

---

## ✨ Features

### Core Functionality
- 🎯 **Client-Side Task Queue** — All CRUD operations managed through Zustand with instant feedback
- 📡 **Real-Time Updates** — Live task status tracking via WebSockets (`Queued` → `Processing` → `Success/Error`)
- 🔄 **Decoupled Architecture** — Clean separation between Next.js frontend and Express backend
- 📦 **Complete CRUD** — Full entity management for Products, Brands, Categories, and Purposes

### Advanced Features
- ☁️ **Cloud Image Uploads** — Direct Cloudinary integration within the task queue
- 📋 **Paste-to-Upload** — Press `Ctrl+V` anywhere to paste images from clipboard
- 🔌 **Dynamic Database Connection** — Change Postgres connection on-the-fly without server restart
- 📊 **Live Analytics Dashboard** — Real-time entity counts and system overview
- 📑 **Data Management Interface** — Tabbed viewer for all system data

---

## 🏗️ Tech Stack

<table>
<tr>
<td width="50%">

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Library:** shadcn/ui
- **State:** Zustand
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Notifications:** react-hot-toast

</td>
<td width="50%">

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** Neon (Serverless Postgres)
- **Real-Time:** WebSockets (ws)
- **Storage:** Cloudinary + Multer

</td>
</tr>
</table>

---

## 🔄 Architecture: Task Queue Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (UI)
    participant Z as Zustand Store
    participant A as Axios
    participant E as Express API
    participant W as WebSocket
    participant D as Database

    U->>C: Submit Form
    C->>Z: addTask()
    Z-->>C: Task Added (status: queued)
    Note over C: UI updates instantly
    
    Z->>A: Process Task
    A->>E: POST /api/products
    E->>W: Broadcast "processing"
    W-->>Z: Update Task Status
    Note over C: UI shows "Processing"
    
    E->>D: Upload Image + DB Transaction
    D-->>E: Success
    E->>W: Broadcast "success"
    W-->>Z: Final Update
    Note over C: UI shows "Success"
```

### The Complete Flow

1. **User Action** → User submits a form (e.g., Create Product)
2. **Instant Feedback** → Task added to Zustand with `status: "queued"`, sidebar updates immediately
3. **Background Processing** → Zustand processor picks up task and sends Axios request
4. **Status Broadcasting** → Server broadcasts `"processing"` via WebSocket
5. **Heavy Lifting** → Server uploads to Cloudinary and executes DB transaction
6. **Completion** → Server broadcasts final `"success"` or `"error"` status
7. **UI Sync** → Client updates task to final state

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Git](https://git-scm.com/)
- Free [Neon](https://neon.tech/) account (Postgres database)
- Free [Cloudinary](https://cloudinary.com/) account (image hosting)

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/alaqmarr/neon-node-nextjs-product-management.git
cd your-repo-name
```

#### 2. Backend Configuration

```bash
cd backend
touch .env
```

Add to `backend/.env`:

```env
# Neon Postgres connection string
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Server port
PORT=4000
```

#### 3. Frontend Configuration

```bash
cd ../frontend
touch .env.local
```

Add to `frontend/.env.local`:

```env
# Express API endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# WebSocket server endpoint
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

#### 4. Launch Application

From the root directory:

```bash
# Make script executable
chmod +x start.sh

# Start both servers
./start.sh
```

The `start.sh` script will:
- ✅ Install all dependencies
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Start both servers concurrently
- ✅ Stream logs to `backend.log` and `frontend.log`

**Access the application:**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:4000

---

## 📂 Project Structure

```
.
├── backend/                    # Express API Server
│   ├── prisma/
│   │   └── schema.prisma      # Database schema & models
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── lib/               # Database, Cloudinary, Multer setup
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # WebSocket service layer
│   │   └── server.ts          # Express entry point
│   ├── .env                   # Backend environment variables
│   └── package.json
│
├── frontend/                   # Next.js Application
│   ├── app/
│   │   ├── (main)/            # Main app routes (dashboard, settings)
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # WebSocket provider
│   │   ├── lib/               # Axios configuration
│   │   └── store/
│   │       └── taskStore.ts   # Zustand task queue store
│   ├── .env.local             # Frontend environment variables
│   └── package.json
│
├── start.sh                    # Development launcher script
└── README.md
```

---

## 🎯 Key Concepts

### Task Queue Store (Zustand)

The heart of the application's architecture. Each task flows through these states:

```typescript
type TaskStatus = "queued" | "processing" | "success" | "error";

interface Task {
  id: string;
  type: "create" | "update" | "delete";
  entity: "product" | "brand" | "category" | "purpose";
  status: TaskStatus;
  data: any;
  error?: string;
  createdAt: Date;
}
```

### WebSocket Communication

Real-time bidirectional communication ensures the UI stays synchronized:

```typescript
// Server broadcasts
{
  type: "task-status-update",
  payload: {
    taskId: string,
    status: TaskStatus,
    data?: any,
    error?: string
  }
}
```

---

## 🔧 Available Scripts

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate   # Run database migrations
```

### Frontend

```bash
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm start            # Run production server
npm run lint         # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Vercel](https://vercel.com/) for Next.js
- [Neon](https://neon.tech/) for serverless Postgres
- [Cloudinary](https://cloudinary.com/) for image hosting
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components

---

<div align="center">

**Built with ❤️ using Next.js, Express, and WebSockets**

[Report Bug](https://github.com/your-username/your-repo-name/issues) · [Request Feature](https://github.com/your-username/your-repo-name/issues)

</div>