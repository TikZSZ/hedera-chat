import { z, ZodSchema, } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

interface ToolOptions
{
  name?: string;
  description: string;
  schema: ZodSchema<any>;
  addErrorsInOutput?:boolean
}

export interface ToolDef{
  type:string,
  function:{
    name:string,
    description:string,
    parameters:Record<string,any>
  },
}

export interface Tool<TInput, TOutput=Promise<string|void>>
{
  invoke: ( input?: TInput ) => TOutput;
  name: string;
  description: string;
  schema: ZodSchema<any>;
  toolDef:ToolDef
}


export function tool<TInput> (
  fn: ( input?: TInput ) => Promise<string|undefined>,
  options: ToolOptions
): Tool<TInput>
{
  let { name, description, schema } = options;
  if(!name){
    name = fn.name
  }
  // Wrap the function with input validation and error handling
  const invoke = async ( input?: TInput ): Promise<string|void> =>
  {
    try
    {
      // Validate the input using the schema
      const validatedInput = schema.parse( input );

      // Call the wrapped function with validated input
      return await fn( validatedInput );
    } catch ( error:any )
    {
      // Handle validation or execution errors
      if (options.addErrorsInOutput){
        return `Error in tool "${name}": ${error.message}`
      }else{
        throw new Error( `Error in tool "${name}": ${error.message}` );
      }
    }
  };

  const paramSchema = zodToJsonSchema( schema )
  delete paramSchema.$schema
  const toolDef = {
    type: "function",
    function: {
      name: name,
      description: description,
      parameters: paramSchema
    }
  }

  return {
    invoke,
    name,
    description,
    schema: schema,
    toolDef
  };
}


export class DynamicStructuredTool<TInput> implements Tool<TInput, any>
{
  public name: string
  public description: string
  public schema: ZodSchema
  private  func: ( input: TInput ) => Promise<string|undefined>|string|undefined
  private addErrorsInOutput?:boolean = false
  public toolDef:ToolDef

  constructor( inputs: ToolOptions & {func: ( input: TInput ) => Promise<string|undefined>|string|undefined} )
  {
    inputs.name ? this.name = inputs.name : this.name = inputs.func.name
    this.description = inputs.description
    this.schema = inputs.schema
    this.func = inputs.func
    if(inputs.addErrorsInOutput !== undefined){
      this.addErrorsInOutput = inputs.addErrorsInOutput
    }
    const paramSchema = zodToJsonSchema( this.schema )
    delete paramSchema.$schema
    this.toolDef = {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: paramSchema
      }
    }
  }


  invoke = async ( input?: TInput ): Promise<string|undefined> =>
  {
    try
    {
      // Validate the input using the schema
      const validatedInput = this.schema.parse( input );

      // Call the wrapped function with validated input
      return await this.func( validatedInput );
    } catch ( error:any )
    {
      if(this.addErrorsInOutput){
        console.log("i was thrown")
        return `Error in tool "${this.name}": ${error.message}`
      }else{
        throw new Error( `Error in tool "${this.name}": ${error.message}` );
      }
      // Handle validation or execution errors
    }
  };

  // get toolDef ()
  // {
  //   const paramSchema = zodToJsonSchema( this.schema )
  //   delete paramSchema.$schema
  //   return {
  //     type: "function",
  //     function: {
  //       name: this.name,
  //       description: this.description,
  //       parameters: paramSchema
  //     }
  //   }
  // }

}

// if(import.meta.main){
//   // Example usage
//   const adderSchema = z.object( {
//     a: z.number(),
//     b: z.number(),
//   } );

//   const adderTool = tool(
//     async ( input: { a: number; b: number } ): Promise<string> =>
//     {
//       const sum = input.a + input.b;
//       return `The sum of ${input.a} and ${input.b} is ${sum}`;
//     },
//     {
//       name: "adder",
//       description: "Adds two numbers together",
//       schema: adderSchema,
//     }
//   );
//   console.log( zodToJsonSchema( adderTool.schema, { name: "fn" } )[ "definitions" ]![ "fn" ] )
  
//   // // Invoke the tool
//   // adderTool.invoke( { a: 1, b: 2 } ).then( console.log ).catch( console.error );
  
//   function add ( input: { a: number; b: number } )
//   {
//     const sum = input.a + input.b;
//     return `The sum of ${input.a} and ${input.b} is ${sum}`;
//   }
  
//   const addTool = new DynamicStructuredTool( {name:"Number Adder",description:"Adds two numbers",func:add,schema:adderSchema,addErrorsInOutput:true} )

//   console.log(JSON.stringify(addTool.toolDef))
//   console.log((await addTool.invoke({a:4,b:5})))
// }


