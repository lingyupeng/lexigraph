<div align="center">
<img width="800" height="400" alt="LexiGraph" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LexiGraph

A vocabulary research tool with AI-powered lexical analysis and interactive 3D knowledge graph visualization.

## Features

- **AI-Powered Analysis**: Analyze words with detailed morphology, etymology, and domain context
- **3D Knowledge Graph**: Visualize word relationships in an interactive 3D space
- **Customizable Visualization**: Adjust node sizes, colors, bloom effects, and link styles
- **Etymology Tracking**: Track word roots and family connections
- **Export/Import**: Export your vocabulary to Excel or import word lists

## Local Development

**Prerequisites:** Node.js 18+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` with your API key:

```env
# Option 1: OpenAI-compatible API (recommended)
VITE_OPENAI_API_KEY="your-api-key"
VITE_OPENAI_API_ENDPOINT="https://api.openai.com/v1"  # optional, for proxies
VITE_OPENAI_MODEL="gpt-4o-nano"  # optional

# Option 2: MiniMax API
VITE_MINIMAX_API_KEY="your-minimax-key"
```

### 3. Run the app

**Option A: One-click startup (recommended)**
- **Windows**: Double-click `START.bat`
- **Mac/Linux**: Double-click `START.command`

**Option B: Manual start**
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

1. **Select Domain**: Choose your research field from the Settings page
2. **Search Words**: Enter words in the Lexical Exploration section
3. **Build Graph**: Click "Add to Graph" to visualize word relationships
4. **Customize**: Use the Graph Settings panel to adjust visualization

## Tech Stack

- React 19 + TypeScript
- Vite
- Three.js / react-force-graph-3d
- Tailwind CSS
- Express (API proxy)
- AI: OpenAI-compatible API / MiniMax / Gemini

## API Configuration Modes

LexiGraph supports two API configuration modes:

1. **Public Mode** (default for open source): Users configure their own API key via `.env` file
2. **Beta Mode**: Built-in API key stored on server (for internal/closed testing)

To switch modes, go to Settings → API Configuration.

## License

MIT
