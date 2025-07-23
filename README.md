# Google ADK Chat History Viewer

A standalone Next.js application for viewing and analyzing Google ADK (Agent Development Kit) chat session JSON files. For more information about Google ADK, see the [official documentation](https://google.github.io/adk-docs/).

## Features

- Upload and parse ADK session JSON files
- View conversation history with proper formatting
- Display function calls and their responses
- Download attached files from the chat session
- Support for PDF and other file types

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Usage

1. Export your ADK session as a JSON file
2. Upload the JSON file to the viewer
3. View the conversation, function calls, and attached files
4. Download any attached files as needed

## License

MIT 