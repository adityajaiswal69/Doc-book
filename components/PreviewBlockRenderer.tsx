"use client";

import { Block, BlockType } from "@/types/editor";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PreviewBlockRendererProps {
  block: Block;
  isPreview?: boolean;
}

export default function PreviewBlockRenderer({ block, isPreview = true }: PreviewBlockRendererProps) {
  // Helper function to render text content
  const renderTextContent = (content: string) => {
    if (!content) return null;
    
    // Simple text rendering - you can enhance this with markdown parsing if needed
    return (
      <div className="whitespace-pre-wrap break-words">
        {content}
      </div>
    );
  };

  // Render different block types
  switch (block.type) {
    case 'heading-1':
      return (
        <h1 className="text-3xl font-bold mb-4 mt-6 first:mt-0">
          {renderTextContent(block.content)}
        </h1>
      );

    case 'heading-2':
      return (
        <h2 className="text-2xl font-bold mb-3 mt-5 first:mt-0">
          {renderTextContent(block.content)}
        </h2>
      );

    case 'heading-3':
      return (
        <h3 className="text-xl font-bold mb-2 mt-4 first:mt-0">
          {renderTextContent(block.content)}
        </h3>
      );

    case 'bulleted-list':
      return (
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>{renderTextContent(block.content)}</li>
        </ul>
      );

    case 'numbered-list':
      return (
        <ol className="list-decimal list-inside mb-4 space-y-1">
          <li>{renderTextContent(block.content)}</li>
        </ol>
      );

    case 'todo-list':
      return (
        <div className="flex items-start space-x-2 mb-4">
          <input
            type="checkbox"
            checked={block.checked || false}
            readOnly
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span className={block.checked ? 'line-through text-gray-500' : ''}>
            {renderTextContent(block.content)}
          </span>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4 text-gray-700 dark:text-gray-300">
          {renderTextContent(block.content)}
        </blockquote>
      );

    case 'code-block':
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-sm font-mono">
            {renderTextContent(block.content)}
          </code>
        </pre>
      );

    case 'divider':
      return <Separator className="my-6" />;

    case 'callout':
      return (
        <Card className="mb-4 border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                {renderTextContent(block.content)}
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'table':
      return (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-300 dark:border-gray-600">
            <tbody>
              {block.tableData?.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-gray-300 dark:border-gray-600 px-3 py-2"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'image':
      return (
        <div className="mb-4">
          {block.imageUrl ? (
            <img
              src={block.imageUrl}
              alt={block.content || 'Image'}
              className="max-w-full h-auto rounded-lg"
            />
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-gray-500">{block.content || 'Image placeholder'}</p>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className="mb-4">
          {block.videoUrl ? (
            <video
              src={block.videoUrl}
              controls
              className="max-w-full h-auto rounded-lg"
            />
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-4xl mb-2">🎥</div>
              <p className="text-gray-500">{block.content || 'Video placeholder'}</p>
            </div>
          )}
        </div>
      );

    case 'toggle-list':
      return (
        <details className="mb-4">
          <summary className="cursor-pointer font-medium mb-2">
            {block.content || 'Toggle item'}
          </summary>
          <div className="pl-4 mt-2">
            {block.children?.map((child) => (
              <PreviewBlockRenderer
                key={child.id}
                block={child}
                isPreview={true}
              />
            ))}
          </div>
        </details>
      );

    case 'bookmark':
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔖</div>
              <div className="flex-1">
                <a
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {block.content || block.url}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'columns':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {block.columns?.map((column, index) => (
            <div key={index} className="space-y-2">
              {column.map((childBlock) => (
                <PreviewBlockRenderer
                  key={childBlock.id}
                  block={childBlock}
                  isPreview={true}
                />
              ))}
            </div>
          ))}
        </div>
      );

    case 'math':
    case 'equation':
      return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center mb-4">
          <div className="text-2xl mb-2">∑</div>
          <div className="font-mono">{renderTextContent(block.content)}</div>
        </div>
      );

    case 'mention':
      return (
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
          @{block.content}
        </span>
      );

    case 'page-reference':
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <span className="text-blue-600">{block.content}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'database-reference':
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🗄️</div>
              <div className="flex-1">
                <span className="text-blue-600">{block.content}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    // Default case - render as text
    default:
      return (
        <div className="mb-4">
          {renderTextContent(block.content)}
        </div>
      );
  }
}

