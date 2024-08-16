import z, { type ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

interface ToolOptions<T extends ZodSchema> {
  name?: string;
  description: string;
  schema: T;
  addErrorsInOutput?: boolean;
}

export interface ToolDef {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface Tool<T extends ZodSchema> {
  invoke: (input?: z.infer<T>) => Promise<string | void>;
  name: string;
  description: string;
  schema: T;
  toolDef: ToolDef;
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

export function tool<T extends ZodSchema>(
  fn: (input: z.infer<T>) => Promise<string | undefined> | string | undefined,
  options: ToolOptions<T>
): Tool<T> {
  const name = options.name || fn.name;
  const { description, schema, addErrorsInOutput = false } = options;

  const invoke = async (input?: z.infer<T>): Promise<string | void> => {
    try {
      const validatedInput = schema.parse(input);
      const resp =  await fn(validatedInput);
      return resp
    } catch (error: any) {
      if (addErrorsInOutput) {
        return `Error in tool "${name}": ${error.message}`;
      } else {
        throw new Error(`Error in tool "${name}": ${error.message}`);
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

export class DynamicStructuredTool<T extends ZodSchema> implements Tool<T> {
  public name: string;
  public description: string;
  public schema: T;
  public toolDef: ToolDef;
  private func: (input: z.infer<T>) => Promise<string | undefined> | string | undefined;
  private addErrorsInOutput: boolean;

  constructor(inputs: ToolOptions<T> & { func: (input: z.infer<T>) => Promise<string | undefined> | string | undefined }) {
    this.name = inputs.name || inputs.func.name;
    this.description = inputs.description;
    this.schema = inputs.schema;
    this.func = inputs.func;
    this.addErrorsInOutput = inputs.addErrorsInOutput || true;
    this.toolDef = createToolDef(this.name, this.description, this.schema);
  }

  invoke = async (input?: z.infer<T>): Promise<string | void> => {
    try {
      const validatedInput = this.schema.parse(input);
      return await this.func(validatedInput);
    } catch (error: any) {
      if (this.addErrorsInOutput) {
        return `Error in tool "${this.name}": ${error.message}`;
      } else {
        throw new Error(`Error in tool "${this.name}": ${error.message}`);
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

  // Test functional approach
  const adderTool = tool(
    async (input: z.infer<typeof adderSchema>): Promise<string> => {
      const sum = input.a + input.b;
      return `The sum of ${input.a} and ${input.b} is ${sum}`;
    },
    {
      name: "adder",
      description: "Adds two numbers together",
      schema: adderSchema,
    }
  );

  console.log("Functional Approach Test:");
  console.log("Tool Definition:", JSON.stringify(adderTool.toolDef, null, 2));
  adderTool.invoke({ a: 1, b: 2 }).then(console.log).catch(console.error);

  // Test class-based approach
  const addTool = new DynamicStructuredTool({
    name: "Number Adder",
    description: "Adds two numbers",
    func: (input: z.infer<typeof adderSchema>) => {
      const sum = input.a + input.b;
      return `The sum of ${input.a} and ${input.b} is ${sum}`;
    },
    schema: adderSchema,
    addErrorsInOutput: true,
  });

  console.log("\nClass-based Approach Test:");
  console.log("Tool Definition:", JSON.stringify(addTool.toolDef, null, 2));
  addTool.invoke({ a: 4, b: 5 }).then(console.log).catch(console.error);

  // Test error handling
  console.log("\nError Handling Test:");
  addTool.invoke({ a: "not a number", b: 5 } as any).then(console.log).catch(console.error);
}