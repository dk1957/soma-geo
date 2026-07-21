"use client"

interface ContentRendererProps {
  content: string
  className?: string
}

export function ContentRenderer({ content, className = '' }: ContentRendererProps) {
  return (
    <div 
      className={`prose prose-lg max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-6
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-5
        prose-p:text-base prose-p:leading-7 prose-p:mb-4
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:font-semibold prose-strong:text-gray-900
        prose-em:italic
        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
        prose-li:mb-2
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:my-4
        prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-pink-600
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:mb-4
        prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:w-full
        prose-table:border-collapse prose-table:w-full prose-table:mb-4
        prose-thead:bg-gray-100
        prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold
        prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-3
        prose-hr:border-gray-300 prose-hr:my-8
        dark:prose-invert
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
