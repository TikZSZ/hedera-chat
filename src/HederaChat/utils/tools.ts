import { DynamicStructuredTool } from "./aiUtils";
import { basicTools } from "./HederaAPIs/BaiscAPIs";
import { SwapTools } from "./HederaAPIs/SwapAPIs";
import { TokenTools } from "./HederaAPIs/TokenAPIs";
import { TokenInfoTools } from "./HederaAPIs/TokenInfoAPIs";
import { TopicTools } from "./HederaAPIs/TopicAPIs";
                
export const tools = [ 
  ...basicTools, 
  ...TokenTools, 
  ...TokenInfoTools
  // ...SwapTools, 
  // ...TopicTools 
]

// async function main ()
// {
//   const { Tiktoken } = await import( "tiktoken/lite" );
//   const { load } = await import( "tiktoken/load" );
//   const registry = await import( "tiktoken/registry.json" );
//   const { default: models } = await import( "tiktoken/model_to_encoding.json" );

//   // @ts-ignore
//   const model = await load( registry[ models[ "gpt-4o-mini" ] ] );
//   const encoder = new Tiktoken(
//     model.bpe_ranks,
//     model.special_tokens,
//     model.pat_str
//   );
//   const toolsKits: Record<string, DynamicStructuredTool<any>[]> = { basicTools, TokenTools, SwapTools, TopicTools,TokenInfoTools }

//   const toolKitCount = {} as Record<string, number>

//   for ( const key in toolsKits )
//   {
//     const toolKit = toolsKits[ key ]
//     const tool_defs_map = toolKit.map( ( tool ) => tool.toolDef );
//     const jsonfied = JSON.stringify( tool_defs_map )
//     const tokens = encoder.encode( jsonfied );
//     toolKitCount[ key ] = tokens.length
//     // console.log(toolKitCount[key])
//     // console.log( jsonfied )
//   }
//   encoder.free();
//   console.dir( toolKitCount )
//   console.log( "total tokens => ", Object.values( toolKitCount ).reduce( ( preVal, val ) =>
//   {
//     return preVal + val
//   }, 0 ) )
//   // const tool_defs_map = tools.map( ( tool ) => tool.toolDef );
//   // console.dir( tool_defs_map, { depth: null } )
//   // const jsonfied = JSON.stringify( tool_defs_map )
//   // const tokens = encoder.encode( jsonfied );
//   // console.log( tokens.length )
//   // console.log( jsonfied )
//   // encoder.free();

// }

// if ( import.meta.main )
// {
//   console.log( "hello" )
//   // const tool_defs_map = tools.map( ( tool ) => tool.toolDef );
//   // console.dir( tool_defs_map, { depth: null } )
//   await main()
// }

