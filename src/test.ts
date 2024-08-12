import { tool,DynamicStructuredTool } from "./lib/aiUtils";
import {z} from "zod"
const adderSchema = z.object( {
  a: z.number(),
  b: z.number(),
} );

function add ( input: { a: number; b: number } )
  {
    const sum = input.a + input.b;
    return `The sum of ${input.a} and ${input.b} is ${sum}`;
  }
  
  const addTool = new DynamicStructuredTool( {name:"Number Adder",description:"Adds two numbers",func:add,schema:adderSchema,addErrorsInOutput:true} )

  console.log(JSON.stringify(addTool.toolDef))
  console.log((await addTool.invoke({a:4,b:5})))