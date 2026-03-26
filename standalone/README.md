# LexiGraph Standalone Version

A vocabulary research tool with AI-powered lexical analysis.

## Quick Start

### Mac
1. Double-click `START-Mac.command`
2. Allow running in System Preferences if needed

### Windows
1. Double-click `START-Windows-NoNode.bat`

## Configuration

### 1. Get an API Key
- Get an OpenAI API key from: https://platform.openai.com/api-keys
- Or use other OpenAI-compatible APIs (Groq, toapis, etc.)

### 2. Configure API Key
Copy `.env.example` to `.env` and edit:
```
OPENAI_API_KEY=your-api-key-here
```

## Requirements

- **Mac**: Python 3.7+ (pre-installed)
- **Windows**: Python 3.7+ (or install from python.org)

## Troubleshooting

### "Python is not installed" (Windows)
1. Visit https://python.org/downloads
2. Download Python 3
3. During installation, CHECK "Add Python to PATH"
4. Restart and run again

### Mac asks about running
1. Go to System Preferences > Security & Privacy
2. Click "Open Anyway" next to the blocked app
