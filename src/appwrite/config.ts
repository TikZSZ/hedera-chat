import { Client, Databases, Query, Storage, Models, ID,Functions, ExecutionMethod } from "appwrite";
import { conf } from "../conf/conf";
import { Token } from "@/HederaChat/utils/HederaAPIs/TokenAPIs";


export class Service
{
  client: Client;
  databases: Databases;
  storage: Storage;
  functions:Functions
  dbId: string;
  collectionId: string;
  bucketId: string;
  functionId:string;
  constructor()
  {
    this.client = new Client()
      .setEndpoint( conf.appwriteEndpoint ) // Your API Endpoint
      .setProject( conf.appwrtieProjectId )
    this.databases = new Databases( this.client );
    this.storage = new Storage( this.client )
    this.functions = new Functions(this.client)
    this.dbId = conf.appwrtieDBId;
    this.collectionId = conf.appwriteCollectionId
    this.bucketId = conf.appwriteBucketId
    this.functionId = conf.appwriteFunctionId
  }



  async createTokenDocument ( token: Token, userId: string )
  {
    try
    {
      return this.databases.createDocument(
        this.dbId,
        this.collectionId,
        ID.unique(),
        {
          userId: userId,
          ...token
        }
      );
    } catch ( error )
    {
      console.error( 'Error creating token document:', error );
      return false
    }
  }

  async listTokens ( ownerAccountId: string, userId: string )
  {
    try
    {
      return this.databases.listDocuments(
        this.dbId,
        this.collectionId,
        [ 
          Query.equal( "ownerAccountId", ownerAccountId ), 
          Query.equal( "userId", userId ) 
        ]
      );
    } catch ( error )
    {
      console.error( 'Error Listing token documents:', error );
      return false
    }
  }

  async uploadFile ( file: File )
  {
    try
    {
      return this.storage.createFile( this.bucketId, ID.unique(), file )
    } catch ( error )
    {
      console.log( "Appwrite service :: uploadFile():: ", error )
      return false
    }
  }

  async invokeAIFunction(body:string){
    return this.functions.createExecution(this.functionId,body,false,"/",ExecutionMethod.POST)
  }

  async deleteFile ( fileId: string )
  {
    try
    {
      await this.storage.deleteFile( this.bucketId, fileId )
    } catch ( error )
    {
      console.log( "Appwrite service :: deleteFile():: ", error )
      return false
    }
  }

  getFileView(fileId:string){
    try
    {
      
      return this.storage.getFileView(this.bucketId,fileId)
    } catch ( error )
    {
      console.log( "Appwrite service :: getFilePreview():: ", error )
      return false
    }
  }
    

  getFilePreview ( fileId: string, ...previewArgs: any[] ){
    try
    {
      return this.storage.getFilePreview( this.bucketId, fileId, ...previewArgs ).href
    } catch ( error )
    {
      console.log( "Appwrite service :: getFilePreview():: ", error )
      return false
    }
  }
}


export const appwriteService = new Service();