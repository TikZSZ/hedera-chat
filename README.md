## Introduction

HederaChat is a flexible and powerful React-based SDK for building Web3 actionable AI applications. It provides streamlined tools and tool use API, along with state management and hooks for easy integration with AI models in Apps.

## Steps to run the project

1. Install dependecies
```sh
npm install 
# depending on your node package manager
# bun install 
# yarn install
```

2. Setup Environment Variables

Create a .env file and fil it up with following API keys:
```js
VITE_APPWRITE_ENDPOINT 
VITE_APPWRITE_PROJECT_ID // appwrite specific keys
VITE_APPWRITE_DATABASE_ID
VITE_APPWRITE_COLLECTION_ID 
VITE_APPWRITE_BUCKET_ID // file storage
VITE_APPWRITE_FUNCTION_ID // needed for prod only
VITE_RAPID_API_KEY // rapid api key with URL shortner Integration
VITE_OPENAI_API_KEY // used with openai client to make requests to openai compatible endpoints
```

3. Run Project in Dev Mode
```sh
npm run dev
# bun dev
# yarn dev
```