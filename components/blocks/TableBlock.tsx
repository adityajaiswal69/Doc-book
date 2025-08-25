"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, MoreHorizontal, BarChart3 } from "lucide-react";
import { RichBlock, BlockType } from "@/types/editor";
import RichTextBlock from "../RichTextBlock";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface TableBlockProps {
  block: RichBlock;
  isSelected: boolean;
  onContentChange: (blockId: string, content: string) => void;
  onSelectionChange: (selection: any) => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
  onFocus: (blockId: string) => void;
  onBlur: () => void;
  onTableStructureChange: (blockId: string, rows: number, columns: number) => void;
}

interface TableCell {
  id: string;
  content: string;
  isHeader: boolean;
}

export default function TableBlock({
  block,
  isSelected,
  onContentChange,
  onSelectionChange,
  onKeyDown,
  onFocus,
  onBlur,
  onTableStructureChange
}: TableBlockProps) {
  const [tableData, setTableData] = useState<TableCell[][]>([]);
  const [rows, setRows] = useState(block.metadata.rows || 3);
  const [columns, setColumns] = useState(block.metadata.columns || 3);
  const tableRef = useRef<HTMLTableElement>(null);

  // Initialize table data
  useEffect(() => {
    const initializeTable = () => {
      const newTableData: TableCell[][] = [];
      
      for (let i = 0; i < rows; i++) {
        const row: TableCell[] = [];
        for (let j = 0; j < columns; j++) {
          row.push({
            id: `cell-${i}-${j}`,
            content: i === 0 ? `Header ${j + 1}` : `Cell ${i + 1}-${j + 1}`,
            isHeader: i === 0
          });
        }
        newTableData.push(row);
      }
      
      setTableData(newTableData);
    };

    initializeTable();
  }, [rows, columns]);

  // Update table structure
  const updateTableStructure = (newRows: number, newColumns: number) => {
    setRows(newRows);
    setColumns(newColumns);
    onTableStructureChange(block.id, newRows, newColumns);
  };

  // Add row
  const addRow = () => {
    const newRow: TableCell[] = [];
    for (let j = 0; j < columns; j++) {
      newRow.push({
        id: `cell-${rows}-${j}`,
        content: `Cell ${rows + 1}-${j + 1}`,
        isHeader: false
      });
    }
    setTableData([...tableData, newRow]);
    updateTableStructure(rows + 1, columns);
  };

  // Add column
  const addColumn = () => {
    const newTableData = tableData.map((row, i) => [
      ...row,
      {
        id: `cell-${i}-${columns}`,
        content: i === 0 ? `Header ${columns + 1}` : `Cell ${i + 1}-${columns + 1}`,
        isHeader: i === 0
      }
    ]);
    setTableData(newTableData);
    updateTableStructure(rows, columns + 1);
  };

  // Delete row
  const deleteRow = (rowIndex: number) => {
    if (rows <= 1) return; // Keep at least one row
    
    const newTableData = tableData.filter((_, i) => i !== rowIndex);
    setTableData(newTableData);
    updateTableStructure(rows - 1, columns);
  };

  // Delete column
  const deleteColumn = (colIndex: number) => {
    if (columns <= 1) return; // Keep at least one column
    
    const newTableData = tableData.map(row => row.filter((_, j) => j !== colIndex));
    setTableData(newTableData);
    updateTableStructure(rows, columns - 1);
  };

  // Toggle header row
  const toggleHeaderRow = (rowIndex: number) => {
    const newTableData = [...tableData];
    newTableData[rowIndex] = newTableData[rowIndex].map(cell => ({
      ...cell,
      isHeader: !cell.isHeader
    }));
    setTableData(newTableData);
  };

  // Handle cell content change
  const handleCellChange = (rowIndex: number, colIndex: number, content: string) => {
    const newTableData = [...tableData];
    newTableData[rowIndex][colIndex].content = content;
    setTableData(newTableData);
  };

  // Handle keyboard navigation
  const handleCellKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Move to previous cell
          if (colIndex > 0) {
            const prevCell = tableRef.current?.querySelector(`[data-cell="${rowIndex}-${colIndex - 1}"]`) as HTMLElement;
            prevCell?.focus();
          } else if (rowIndex > 0) {
            const prevCell = tableRef.current?.querySelector(`[data-cell="${rowIndex - 1}-${columns - 1}"]`) as HTMLElement;
            prevCell?.focus();
          }
        } else {
          // Move to next cell
          if (colIndex < columns - 1) {
            const nextCell = tableRef.current?.querySelector(`[data-cell="${rowIndex}-${colIndex + 1}"]`) as HTMLElement;
            nextCell?.focus();
          } else if (rowIndex < rows - 1) {
            const nextCell = tableRef.current?.querySelector(`[data-cell="${rowIndex + 1}-0"]`) as HTMLElement;
            nextCell?.focus();
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        // Move to next row
        if (rowIndex < rows - 1) {
          const nextCell = tableRef.current?.querySelector(`[data-cell="${rowIndex + 1}-${colIndex}"]`) as HTMLElement;
          nextCell?.focus();
        }
        break;
    }
  };

  return (
    <div className={`table-block ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
      {/* Table Controls */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-800/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Row
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={addColumn}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Column
        </Button>

        <div className="text-xs text-gray-400">
          {rows} × {columns}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-600 rounded-lg overflow-hidden">
        <table ref={tableRef} className="w-full">
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-600 last:border-b-0">
                {row.map((cell, colIndex) => (
                  <td
                    key={cell.id}
                    className={`border-r border-gray-600 last:border-r-0 ${
                      cell.isHeader ? 'bg-gray-800 font-medium' : 'bg-gray-900'
                    }`}
                  >
                    <div className="relative group">
                      {/* Cell Content */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className={`p-3 min-h-[40px] outline-none focus:ring-1 focus:ring-blue-500 ${
                          cell.isHeader ? 'text-gray-200 font-medium' : 'text-gray-300'
                        }`}
                        data-cell={`${rowIndex}-${colIndex}`}
                        onInput={(e) => handleCellChange(rowIndex, colIndex, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                        onFocus={() => onFocus(block.id)}
                        onBlur={onBlur}
                      >
                        {cell.content}
                      </div>

                      {/* Cell Controls - visible on hover */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700/80"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-white">
                            <DropdownMenuItem
                              onClick={() => toggleHeaderRow(rowIndex)}
                              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800"
                            >
                              {cell.isHeader ? 'Remove Header' : 'Make Header'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-gray-700" />
                            
                            <DropdownMenuItem
                              onClick={() => deleteRow(rowIndex)}
                              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800 text-red-400 hover:text-red-300"
                              disabled={rows <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete Row
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => deleteColumn(colIndex)}
                              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800 text-red-400 hover:text-red-300"
                              disabled={columns <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete Column
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {tableData.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
          </div>
          <p>No table data</p>
        </div>
      )}
    </div>
  );
}

