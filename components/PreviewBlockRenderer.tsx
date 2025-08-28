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
      <div className="whitespace-pre-wrap break-words text-white">
        {content}
      </div>
    );
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Helper function to check if URL is a YouTube URL
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Render different block types
  switch (block.type) {
    case 'heading-1':
      return (
        <h1 className="text-3xl font-bold mb-4 mt-6 first:mt-0 text-white px-3 py-2">
          {renderTextContent(block.content)}
        </h1>
      );

    case 'heading-2':
      return (
        <h2 className="text-2xl font-semibold mb-3 mt-5 first:mt-0 text-white px-3 py-2">
          {renderTextContent(block.content)}
        </h2>
      );

    case 'heading-3':
      return (
        <h3 className="text-xl font-medium mb-2 mt-4 first:mt-0 text-white px-3 py-2">
          {renderTextContent(block.content)}
        </h3>
      );

    case 'bulleted-list':
      return (
        <div className="flex items-start gap-2 mb-2 px-1">
          <span className="text-blue-400 text-base flex-shrink-0 w-5 text-center min-h-[1.6rem] flex items-center justify-center">•</span>
          <div className="flex-1 text-white text-base leading-6">
            {renderTextContent(block.content)}
          </div>
        </div>
      );

    case 'numbered-list':
      return (
        <div className="flex items-start gap-2 mb-2 px-1">
          <span className="text-blue-400 text-base flex-shrink-0 w-5 text-right font-medium min-h-[1.6rem] flex items-center justify-end">
            {block.listIndex || 1}.
          </span>
          <div className="flex-1 text-white text-base leading-6">
            {renderTextContent(block.content)}
          </div>
        </div>
      );

    case 'todo-list':
      return (
        <div className="flex items-start gap-2 mb-2 px-1">
          <div className="flex-shrink-0 w-5 min-h-[1.6rem] flex items-center justify-center">
            <input
              type="checkbox"
              checked={block.checked || false}
              readOnly
              className="w-4 h-4 text-blue-500 rounded border-gray-600 bg-gray-800 cursor-default"
            />
          </div>
          <div 
            className={`flex-1 text-base leading-6 ${
              block.checked 
                ? 'line-through text-gray-400 opacity-60' 
                : 'text-white'
            }`}
          >
            {renderTextContent(block.content)}
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="border-l-4 border-gray-600 pl-4 py-2 mb-4">
          <div className="italic text-white text-base leading-6">
            {renderTextContent(block.content)}
          </div>
        </div>
      );

    case 'code-block':
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <pre className="overflow-x-auto">
            <code className="text-sm font-mono text-green-400 whitespace-pre-wrap break-words">
              {renderTextContent(block.content)}
            </code>
          </pre>
        </div>
      );

    case 'divider':
      return <div className="border-t border-gray-600 my-4"></div>;

    case 'callout':
      return (
        <div className="mb-4 border-l-4 border-blue-500 bg-gray-800/50 rounded-lg">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1 text-white">
                {renderTextContent(block.content)}
              </div>
            </div>
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="border border-gray-600 rounded-lg overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-white font-medium">Header 1</th>
                  <th className="px-3 py-2 text-left text-white font-medium">Header 2</th>
                </tr>
              </thead>
              <tbody>
                {block.tableData?.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-gray-600">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-3 py-2 text-white border-r border-gray-600 last:border-r-0"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                )) || (
                  <tr className="border-t border-gray-600">
                    <td className="px-3 py-2 text-gray-400">No data</td>
                    <td className="px-3 py-2 text-gray-400">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'image':
    case 'im':
      const imageUrl = block.metadata?.url || block.imageUrl || block.content;
      const imageWidth = block.metadata?.width || 60; // Default to 60% like in Editor
      const imageCaption = block.metadata?.caption;
      
      return (
        <div className="mb-4">
          {imageUrl ? (
            <div>
              {/* Image Container with width control */}
              <div 
                className="relative mx-auto"
                style={{ 
                  width: `${Math.min(imageWidth, 100)}%`,
                  maxWidth: '100%',
                  minWidth: '200px'
                }}
              >
                <img
                  src={imageUrl}
                  alt={imageCaption || block.content || 'Image'}
                  className="w-full h-auto max-h-96 rounded-lg shadow-lg object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden bg-gray-800 border border-gray-700 p-8 rounded-lg text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-gray-400">Failed to load image</p>
                  <p className="text-xs text-gray-500 mt-2">{imageUrl}</p>
                </div>
              </div>
              
              {/* Caption */}
              {imageCaption && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-400 italic">{imageCaption}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-gray-400">{block.content || 'Image placeholder'}</p>
            </div>
          )}
        </div>
      );

    case 'video':
      const videoUrl = block.metadata?.url || block.videoUrl || block.content;
      const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
      const videoWidth = block.metadata?.width || 60; // Default to 60% like in Editor
      const videoCaption = block.metadata?.caption;
      const isEmbed = block.metadata?.isEmbed || isYouTubeUrl(videoUrl || '');
      
      return (
        <div className="mb-4">
          {videoUrl ? (
            <div>
              {/* Video Container with width control */}
              <div 
                className="relative mx-auto"
                style={{ 
                  width: `${Math.min(videoWidth, 100)}%`,
                  maxWidth: '100%',
                  minWidth: '200px'
                }}
              >
                <div className="rounded-lg overflow-hidden shadow-lg">
                  {videoId || isEmbed ? (
                    // YouTube or other embed video
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl}
                        title={videoCaption || 'Video'}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        allowFullScreen
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : (
                    // Regular video file
                    <video
                      src={videoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-auto max-h-96 rounded-lg object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {!videoId && !isEmbed && (
                    <div className="hidden bg-gray-800 border border-gray-700 p-8 rounded-lg text-center">
                      <div className="text-4xl mb-2">🎥</div>
                      <p className="text-gray-400">Failed to load video</p>
                      <p className="text-xs text-gray-500 mt-2">{videoUrl}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Caption */}
              {videoCaption && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-400 italic">{videoCaption}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg text-center">
              <div className="text-4xl mb-2">🎥</div>
              <p className="text-gray-400">{block.content || 'Video placeholder'}</p>
            </div>
          )}
        </div>
      );

    case 'toggle-list':
      return (
        <details className="mb-4 bg-gray-800/30 rounded-lg p-3">
          <summary className="cursor-pointer font-medium mb-2 text-white">
            {block.content || 'Toggle item'}
          </summary>
          <div className="pl-4 mt-2 border-l-2 border-gray-600">
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
        <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔖</div>
              <div className="flex-1">
                <a
                  href={block.url || block.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                >
                  {block.content || block.url}
                </a>
              </div>
            </div>
          </div>
        </div>
      );

    case 'columns':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {block.columns?.map((column, index) => (
            <div key={index} className="space-y-2 bg-gray-800/20 p-3 rounded-lg">
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
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg text-center mb-4">
          <div className="text-2xl mb-2 text-blue-400">∑</div>
          <div className="font-mono text-white">{renderTextContent(block.content)}</div>
        </div>
      );

    case 'mention':
      return (
        <span className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded border border-blue-700">
          @{block.content}
        </span>
      );

    case 'page-reference':
      return (
        <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <span className="text-blue-400">{block.content}</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'database-reference':
      return (
        <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🗄️</div>
              <div className="flex-1">
                <span className="text-blue-400">{block.content}</span>
              </div>
            </div>
          </div>
        </div>
      );

    // Default case - render as text
    case 'text':
    default:
      return (
        <div className="mb-2 px-3 py-1">
          <div className="text-white text-base leading-6">
            {renderTextContent(block.content)}
          </div>
        </div>
      );
  }
}

