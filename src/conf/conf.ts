export const conf = {
  appwriteEndpoint:String(import.meta.env["VITE_APPWRITE_ENDPOINT"]),
  appwrtieProjectId:String(import.meta.env["VITE_APPWRITE_PROJECT_ID"]),
  appwrtieDBId:String(import.meta.env["VITE_APPWRITE_DATABASE_ID"]),
  appwriteCollectionId:String(import.meta.env["VITE_APPWRITE_COLLECTION_ID"]),
  appwriteBucketId:String(import.meta.env["VITE_APPWRITE_BUCKET_ID"]),
  appwriteFunctionId:String(import.meta.env["VITE_APPWRITE_FUNCTION_ID"])
}
