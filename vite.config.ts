import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [react({}),compression({algorithm:"brotliCompress",compressionOptions:{chunkSize:5*1024}})],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@hashgraph":path.resolve(__dirname,"node_modules/hashconnect/node_modules/@hashgraph")
    },
  },
  build:{
    rollupOptions:{
      output:{
        manualChunks:{
          markdown:[
            "react-markdown"
          ],
          "@hashgraph":[
            "@hashgraph/sdk",
            "@hashgraph/proto",
            "@hashgraph/hedera-wallet-connect",
            "@hashgraph/cryptography",
          ],
          hashConnect:[
            "hashconnect",
          ],
        }
      }
    }
  }
})
