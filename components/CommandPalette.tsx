"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Hash, 
  Type, 
  List, 
  CheckSquare, 
  Quote, 
  Code, 
  Minus, 
  Table, 
  Image, 
  Video, 
  Link, 
  BookOpen, 
  Database,
  MessageSquare,
  Lightbulb,
  Columns,
  Function,
  AtSign,
  FileText
} from "lucide-react";
import { CommandItem, BlockType } from "@/types/editor";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: CommandItem) => void;
  searchQuery?: string;
}

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onSelectCommand, 
  searchQuery = "" 
}: CommandPaletteProps) {
  const [query, setQuery] = useState(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("Basic Blocks");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced commands with categories
  const commands: CommandItem[] = [
    // Basic Blocks
    {
      id: "paragraph",
      title: "Text",
      description: "Just start writing with plain text",
      icon: <Type className="h-4 w-4" />,
      shortcut: "Just start typing",
      category: "Basic Blocks",
      preview: <div className="text-gray-200">Plain text paragraph</div>,
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "heading-1",
      title: "Heading 1",
      description: "Large section heading",
      icon: <Hash className="h-4 w-4" />,
      shortcut: "#",
      category: "Basic Blocks",
      preview: <div className="text-2xl font-bold text-white">Heading 1</div>,
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "heading-2",
      title: "Heading 2",
      description: "Medium section heading",
      icon: <Hash className="h-4 w-4" />,
      shortcut: "##",
      category: "Basic Blocks",
      preview: <div className="text-xl font-semibold text-white">Heading 2</div>,
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "heading-3",
      title: "Heading 3",
      description: "Small section heading",
      icon: <Hash className="h-4 w-4" />,
      shortcut: "###",
      category: "Basic Blocks",
      preview: <div className="text-lg font-medium text-white">Heading 3</div>,
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },

    // Lists
    {
      id: "bulleted-list",
      title: "Bulleted list",
      description: "Simple bulleted list",
      icon: <List className="h-4 w-4" />,
      shortcut: "-",
      category: "Lists",
      preview: (
        <div className="flex items-start">
          <span className="text-blue-400 mr-3 mt-1">•</span>
          <span className="text-gray-200">List item</span>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "numbered-list",
      title: "Numbered list",
      description: "Ordered numbered list",
      icon: <List className="h-4 w-4" />,
      shortcut: "1.",
      category: "Lists",
      preview: (
        <div className="flex items-start">
          <span className="text-blue-400 mr-3 mt-1 min-w-[20px]">1.</span>
          <span className="text-gray-200">List item</span>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "toggle-list",
      title: "Toggle list",
      description: "Collapsible list with toggle",
      icon: <List className="h-4 w-4" />,
      shortcut: ">",
      category: "Lists",
      preview: (
        <div className="flex items-start">
          <span className="text-blue-400 mr-3 mt-1">▶</span>
          <span className="text-gray-200">Toggle item</span>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "todo-list",
      title: "To-do list",
      description: "Checkbox task list",
      icon: <CheckSquare className="h-4 w-4" />,
      shortcut: "[ ]",
      category: "Lists",
      preview: (
        <div className="flex items-start">
          <input type="checkbox" className="mr-3 mt-1" />
          <span className="text-gray-200">Task item</span>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },

    // Media & Content
    {
      id: "quote",
      title: "Quote",
      description: "Blockquote for citations",
      icon: <Quote className="h-4 w-4" />,
      shortcut: ">",
      category: "Media & Content",
      preview: (
        <div className="border-l-4 border-gray-600 pl-4 py-2 italic text-gray-300">
          Quote text
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "code-block",
      title: "Code block",
      description: "Code snippet with syntax highlighting",
      icon: <Code className="h-4 w-4" />,
      shortcut: "```",
      category: "Media & Content",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm text-green-400">
          Code block
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "divider",
      title: "Divider",
      description: "Horizontal line separator",
      icon: <Minus className="h-4 w-4" />,
      shortcut: "---",
      category: "Media & Content",
      preview: <div className="border-t border-gray-600 my-4"></div>,
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "image",
      title: "Image",
      description: "Insert an image",
      icon: <Image className="h-4 w-4" />,
      shortcut: "!",
      category: "Media & Content",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <div className="text-gray-400 text-sm">Image block</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "video",
      title: "Video",
      description: "Insert a video",
      icon: <Video className="h-4 w-4" />,
      shortcut: "!",
      category: "Media & Content",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <Video className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <div className="text-gray-400 text-sm">Video block</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "bookmark",
      title: "Bookmark",
      description: "Save a link with preview",
      icon: <Link className="h-4 w-4" />,
      shortcut: "!",
      category: "Media & Content",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Bookmark preview</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },

    // Advanced
    {
      id: "table",
      title: "Table",
      description: "Data table with rows and columns",
      icon: <Table className="h-4 w-4" />,
      shortcut: "/table",
      category: "Advanced",
      preview: (
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-gray-200">Header 1</th>
                <th className="px-3 py-2 text-left text-gray-200">Header 2</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-600">
                <td className="px-3 py-2 text-gray-200">Cell 1</td>
                <td className="px-3 py-2 text-gray-200">Cell 2</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "callout",
      title: "Callout",
      description: "Highlighted information box",
      icon: <Lightbulb className="h-4 w-4" />,
      shortcut: "/callout",
      category: "Advanced",
      preview: (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="text-blue-400 text-sm">💡 Callout text</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "columns",
      title: "Columns",
      description: "Multi-column layout",
      icon: <Columns className="h-4 w-4" />,
      shortcut: "/columns",
      category: "Advanced",
      preview: (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-2 text-center text-sm">Column 1</div>
          <div className="bg-gray-800 p-2 text-center text-sm">Column 2</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "math",
      title: "Math",
      description: "Mathematical equations",
      icon: <Function className="h-4 w-4" />,
      shortcut: "/math",
      category: "Advanced",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-gray-400 text-sm">Math equation</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },

    // References
    {
      id: "mention",
      title: "Mention",
      description: "Mention a person or page",
      icon: <AtSign className="h-4 w-4" />,
      shortcut: "@",
      category: "References",
      preview: (
        <div className="text-blue-400">@username</div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "page-reference",
      title: "Page reference",
      description: "Link to another page",
      icon: <FileText className="h-4 w-4" />,
      shortcut: "/page",
      category: "References",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Page reference</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    },
    {
      id: "database-reference",
      title: "Database",
      description: "Reference a database",
      icon: <Database className="h-4 w-4" />,
      shortcut: "/database",
      category: "References",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Database reference</div>
        </div>
      ),
      action: (content) => ({ newContent: content, newCursorPosition: content.length })
    }
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    (cmd.title.toLowerCase().includes(query.toLowerCase()) ||
     cmd.description.toLowerCase().includes(query.toLowerCase()) ||
     cmd.category.toLowerCase().includes(query.toLowerCase())) &&
    (activeCategory === "All" || cmd.category === activeCategory)
  );

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(commands.map(cmd => cmd.category)))];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelectCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onSelectCommand, onClose]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setQuery(searchQuery);
    }
  }, [isOpen, searchQuery]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-gray-400 border-none outline-none text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex border-b border-gray-700">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No commands found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  onClick={() => onSelectCommand(command)}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-300">
                    {command.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {command.title}
                      </h3>
                      {command.shortcut && (
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                          {command.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {command.description}
                    </p>
                  </div>
                  
                  {/* Preview */}
                  <div className="flex-shrink-0 w-24 h-16 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {command.preview}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}

