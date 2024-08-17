import z, { type ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type ToolResult<R> = {
  content: string;
  artifact?: R;
};


export type ToolFunction<T extends ZodSchema, R = any> = (
  inputs: z.infer<T>
) => Promise<ToolResult<R> | string> | ToolResult<R> | string;

export interface ToolOptions<T extends ZodSchema, C = any,R=any> {
  name?: string;
  description: string;
  func:ToolFunction<T, R>;
  schema: T;
  addErrorsInOutput?: boolean;
  beforeCallback?: (input: z.infer<T>, context?: C) => Promise<void> | void;
  afterCallback?: (result: ToolResult<R>,input: z.infer<T>, context?: C) => Promise<void> | void;
}

export interface ToolDef {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}


export interface Tool<T extends ZodSchema, C = any, R = any> {
  invoke: (input: z.infer<T>, context?: C) => Promise<ToolResult<R>>;
  name: string;
  description: string;
  schema: T;
  toolDef: ToolDef;
  beforeCallback?: (input: z.infer<T>, context?: C) => Promise<void> | void;
  afterCallback?: (result: ToolResult<R>,input:z.infer<T>, context?: C) => Promise<void> | void;
}

function createToolDef<T extends ZodSchema>(name: string, description: string, schema: T): ToolDef {
  const paramSchema = zodToJsonSchema(schema);
  delete paramSchema.$schema;
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: paramSchema,
    },
  };
}

export function tool<T extends ZodSchema, C = any,R=any>(
  options: ToolOptions<T, C,R>
): Tool<T, C,R> {
  const name = options.name || options.func.name;
  const { description, schema, addErrorsInOutput = false, beforeCallback, afterCallback } = options;

  const invoke = async (input: z.infer<T>, context?: C): Promise<ToolResult<R>> =>{
    try {
      const validatedInput = schema.parse(input);
      
      if (beforeCallback) {
        await beforeCallback(validatedInput, context);
      }

      let  result = await options.func(validatedInput);

      if(typeof result === "string"){
        result = {
          content:result,
        }
      }

      if (afterCallback) {
        await afterCallback(result, validatedInput,context);
      }

      return result;
    } catch (error: any) {
      const errorResult: ToolResult<any> = {
        content: `Error in tool "${name}": ${error.message}`,
        artifact: { error: error.message },
      };

      if (addErrorsInOutput) {
        return errorResult;
      } else {
        throw new Error(errorResult.content);
      }
    }
  };

  return {
    invoke,
    name,
    description,
    schema,
    toolDef: createToolDef(name, description, schema),
  };
}

export class DynamicStructuredTool<C = any,T extends ZodSchema = any, R = any> implements Tool<T, C, R> {
  public name: string;
  public description: string;
  public schema: T;
  public toolDef: ToolDef;
  private func: ToolOptions<T, C, R>["func"]
  private addErrorsInOutput: boolean;
  public beforeCallback?: ToolOptions<T, C, R>["beforeCallback"];
  public afterCallback?: ToolOptions<T, C, R>["afterCallback"];

  constructor(inputs: ToolOptions<T, C, R>) {
    this.name = inputs.name || inputs.func.name;
    this.description = inputs.description;
    this.schema = inputs.schema;
    this.func = inputs.func;
    this.addErrorsInOutput = inputs.addErrorsInOutput ?? true;
    this.beforeCallback = inputs.beforeCallback;
    this.afterCallback = inputs.afterCallback;
    this.toolDef = createToolDef(this.name, this.description, this.schema);
  }

  invoke = async (input: z.infer<T>, context?: C): Promise<ToolResult<R>> => {
    try {
      const validatedInput = this.schema.parse(input);
      
      if (this.beforeCallback) {
        await this.beforeCallback(validatedInput, context);
      }

      let result = await this.func(validatedInput);

      if(typeof result === "string"){
        result = {
          content:result,
        }
      }

      if (this.afterCallback) {
        await this.afterCallback(result, validatedInput,context);
      }

      return result;
    } catch (error: any) {
      const errorResult: ToolResult<any> = {
        content: `Error in tool "${this.name}": ${error.message}`,
        artifact: { error: error.message },
      };

      if (this.addErrorsInOutput) {
        return errorResult;
      } else {
        throw new Error(errorResult.content);
      }
    }
  };
}

// Test code
if (import.meta.main) {
  const adderSchema = z.object({
    a: z.number(),
    b: z.number(),
  });

  interface AppContext {
    navigate: (path: string) => void;
  }

  // Test functional approach
  const adderTool = tool(
    {
      name: "adder",
      description: "Adds two numbers together",
      schema: adderSchema,
      addErrorsInOutput: true,
      func:async (input:any): Promise<ToolResult<{ sum: number }>> => {
        const sum = input.a + input.b;
        return {
          content: `The sum of ${input.a} and ${input.b} is ${sum}`,
          artifact: { sum },
        };
      },
      beforeCallback: (input, _) => {
        console.log(`Before adding ${input.a} and ${input.b}`);
      },
      afterCallback: (result, inputs,context) => {
        console.log(`After adding, result: ${result.content}`);
        context.navigate(`/result/${result.artifact!.sum}`);
      },
    }
  );

  console.log("Functional Approach Test:");
  console.log("Tool Definition:", JSON.stringify(adderTool.toolDef, null, 2));
  adderTool.invoke({ a: 1, b: 2 }, { navigate: console.log }).then(console.log).catch(console.error);

  // Test class-based approach
  const addTool = new DynamicStructuredTool({
    name: "Number Adder",
    description: "Adds two numbers",
    func: (input)=> {
      const sum = input.a + input.b;
      return {
        content: `The sum of ${input.a} and ${input.b} is ${sum}`,
        artifact: { sum },
      };
    },
    schema: adderSchema,
    addErrorsInOutput: true,
    beforeCallback: (input, context) => {
      console.log(`Before adding ${input.a} and ${input.b}`);
    },
    afterCallback: (result, inputs,context) => {
      console.log(`After adding, result: ${result.content}`);
      console.log(context)
      context.navigate(`/result/${result.artifact?.sum}`);
    },
  });

  console.log("\nClass-based Approach Test:");
  console.log("Tool Definition:", JSON.stringify(addTool.toolDef, null, 2));
  addTool.invoke({ a: 4, b: 5 }, { navigate: console.log }).then(console.log).catch(console.error);

  // Test error handling
  console.log("\nError Handling Test:");
  addTool.invoke({ a: "not a number" as any, b: 5 }, { navigate: console.log }).then(console.log).catch(console.error);
}