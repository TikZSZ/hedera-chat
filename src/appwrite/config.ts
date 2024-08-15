import { Client, Databases, Query,Storage,Models ,ID} from "appwrite";
import { conf } from "../conf/conf";

interface PostDocument extends Models.Document{
  title:string,
  content:string,
  featuredImage:string,
  status:string,
  userId:string
}

export class Service{
  client:Client;
  databases:Databases;
  storage:Storage;
  dbId:string;
  collectionId:string;
  bucketId:string;
  constructor(){
    this.client = new Client()
    .setEndpoint(conf.appwriteEndpoint) // Your API Endpoint
    .setProject(conf.appwrtieProjectId)
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client)
    this.dbId = conf.appwrtieDBId;
    this.collectionId = conf.appwriteCollectionId
    this.bucketId = conf.appwriteBucketId
  }

  async getPost(slug:string){
    try{
      return this.databases.getDocument<PostDocument>(this.dbId,this.collectionId,slug)
    }catch(err){
      console.log("Appwrite service :: getPost():: ",err)
      return false
    }
  }

  async getPosts(queries:string[] = [Query.equal("status","active")]){
    try {
      return this.databases.listDocuments<PostDocument>(this.dbId,this.collectionId,queries)
    } catch (error) {
      console.log("Appwrite service :: getPosts():: ",error)
      return false
    }
  }

  async createPost(slug:string,data:PostDocument){
    try {
      return this.databases.createDocument<PostDocument>(this.dbId,this.collectionId,slug,data)
    } catch (error) {
      console.log("Appwrite service :: createPost():: ",error)
      return false
    }
  }

  async updatePost(slug:string,data:Partial<PostDocument>){
    try {
      return this.databases.updateDocument<PostDocument>(this.dbId,this.collectionId,slug,data)
    } catch (error) {
      console.log("Appwrite service :: updatePost():: ",error)
      return false
    }
  }

  async deletePost(slug:string){
    try {
      await this.databases.deleteDocument(this.dbId,this.collectionId,slug)
      return true
    } catch (error) {
      console.log("Appwrite service :: deletePost():: ",error)
      return false
    }
  }

  async uploadFile(file:File){
    try {
      await this.storage.createFile(this.bucketId,ID.unique(),file)
    } catch (error) {
      console.log("Appwrite service :: uploadFile():: ",error)
      return false
    }
  }

  async deleteFile(fileId:string){
    try {
      await this.storage.deleteFile(this.bucketId,fileId)
    } catch (error) {
      console.log("Appwrite service :: deleteFile():: ",error)
      return false
    }
  }

  getFilePreview(fileId:string,...previewArgs:any[]){
    try {
      return this.storage.getFilePreview(this.bucketId,fileId,...previewArgs).href
    } catch (error) {
      console.log("Appwrite service :: getFilePreview():: ",error)
      return false
    }
  }
}


export const appwriteService = new Service();