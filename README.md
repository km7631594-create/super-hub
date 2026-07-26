# ⚡ Super Hub — All-in-One Platform

> 13 Powerful Apps in ONE Website — AI Chat, Python Runner, Code Playground, Notes, Tasks, Weather, Calculator & More!

## 🚀 Features

| App | Description |
|-----|-------------|
| 🤖 **AI Chat** | Chat with AI assistant |
| 📝 **Notes Vault** | Create, edit & manage notes |
| 📋 **Task Board** | Kanban-style task manager |
| 🎨 **Code Playground** | Live HTML/CSS/JS editor |
| 🐍 **Python Runner** | Execute Python code online |
| ⚡ **JS Runner** | Execute Node.js code |
| 💻 **Shell Terminal** | Run shell commands |
| 🌤️ **Weather Hub** | Real-time weather for any city |
| 🔢 **Calculator** | Calculator + Currency converter |
| 🔗 **URL Shortener** | Shorten long URLs |
| 🔐 **PassGen** | Generate strong passwords |
| 👁️ **MD Previewer** | Live markdown editor & preview |
| 🏠 **Dashboard** | Main overview |

## 🐍 Python — The Real Power

Super Hub can run **any Python code** — OOP, data structures, algorithms, libraries — everything works!

```python
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    def greet(self):
        return f"Hi, I am {self.name}, {self.age} years old"

users = [User("Raj", 25), User("Simran", 22), User("Amit", 30)]
for u in users:
    print(u.greet())

nums = [1,2,3,4,5]
squares = list(map(lambda x: x**2, nums))
print(f"Squares: {squares}")
```

## 💹 Deploy on Render

### One-Click Deploy

1. Fork/Clone this repo to your GitHub
2. Go to [render.com](https://render.com) → New **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `super-hub`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **Create Web Service** 🚀

### Environment Variables (Optional)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enable full GPT AI chat |

Without `OPENAI_API_KEY`, AI Chat works in demo mode.

## 🖥️ Local Development

```bash
npm install
npm start
# Open http://localhost:3000
```

## 🏐️ Project Structure

```
super-hub/
├── server.js          # Express backend + all APIs
├── package.json       # Node.js dependencies
├── public/
│   └── index.html     # Frontend (all 13 apps in one file)
├── .gitignore
└── README.md
```

## 🌚 Deploy Anywhere

This is a standard Node.js app. Deploy on:
- **Render** ✅ (recommended)
- **Railway**
- **Heroku**
- **Any VPS** (DigitalOcean, AWS EC2, etc.)

## 📄License

MIT — Free for everyone.