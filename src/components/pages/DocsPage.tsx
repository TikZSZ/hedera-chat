import docsMarkdown from "@/docs.md?raw";

import { Suspense } from "react";
import MarkdownRenderer from "../MarkdownRenderer";
import { dracula,oneDark,materialOceanic } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Skeleton } from "../ui/skeleton";


const markdownTheme = oneDark;

const MarkdownLoading = () => (
  <div className="space-y-2">
    {/* <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[180px]" />
    <Skeleton className="h-[100px] w-full rounded-md" /> */}
    <div className="p-5 rounded-lg space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
);
function DocsPage() {
  return (
    <div className="container ">
      <Suspense fallback={<MarkdownLoading />}>
        <MarkdownRenderer style={markdownTheme } content={docsMarkdown} />
      </Suspense>
    </div>
  );
}

export default DocsPage;
