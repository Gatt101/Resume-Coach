"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  Search, 
  Replace, 
  Undo2, 
  Redo2,
  Copy,
  Scissors,
  ClipboardPaste,
  AlertTriangle
} from "lucide-react";
import type { TextRegion } from "@/lib/services/ocr-service";

interface PlainTextEditorProps {
  text: string;
  onChange: (text: string) => void;
  highlightRegions?: TextRegion[];
  readOnly?: boolean;
  placeholder?: string;
  onRegionClick?: (region: TextRegion) => void;
}

export function PlainTextEditor({
  text,
  onChange,
  highlightRegions = [],
  readOnly = false,
  placeholder = "Enter your text here...",
  onRegionClick
}: PlainTextEditorProps) {
  const [currentText, setCurrentText] = useState(text);
  const [history, setHistory] = useState<string[]>([text]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Update text and history
  const updateText = useCallback((newText: string) => {
    setCurrentText(newText);
    onChange(newText);
    
    // Add to history if different from current
    if (newText !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newText);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [onChange, history, historyIndex]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCursorPosition(e.target.selectionStart);
    updateText(newText);
  };

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentText(history[newIndex]);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentText(history[newIndex]);
      onChange(history[newIndex]);
    }
  };

  // Clipboard operations
  const handleCopy = async () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = currentText.substring(start, end);
      
      if (selectedText) {
        await navigator.clipboard.writeText(selectedText);
      } else {
        await navigator.clipboard.writeText(currentText);
      }
    }
  };

  const handleCut = async () => {
    if (textareaRef.current && !readOnly) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = currentText.substring(start, end);
      
      if (selectedText) {
        await navigator.clipboard.writeText(selectedText);
        const newText = currentText.substring(0, start) + currentText.substring(end);
        updateText(newText);
      }
    }
  };

  const handlePaste = async () => {
    if (textareaRef.current && !readOnly) {
      try {
        const clipboardText = await navigator.clipboard.readText();
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        const newText = currentText.substring(0, start) + clipboardText + currentText.substring(end);
        updateText(newText);
        
        // Set cursor position after paste
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + clipboardText.length;
            textareaRef.current.selectionEnd = start + clipboardText.length;
          }
        }, 0);
      } catch (error) {
        console.error('Failed to paste:', error);
      }
    }
  };

  // Find and replace
  const handleFind = () => {
    setShowFind(!showFind);
    if (!showFind) {
      setTimeout(() => findInputRef.current?.focus(), 100);
    }
  };

  const findNext = () => {
    if (!findText || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value;
    const currentPos = textarea.selectionStart;
    
    const nextIndex = text.toLowerCase().indexOf(findText.toLowerCase(), currentPos + 1);
    if (nextIndex !== -1) {
      textarea.setSelectionRange(nextIndex, nextIndex + findText.length);
      textarea.focus();
    } else {
      // Wrap around to beginning
      const firstIndex = text.toLowerCase().indexOf(findText.toLowerCase());
      if (firstIndex !== -1) {
        textarea.setSelectionRange(firstIndex, firstIndex + findText.length);
        textarea.focus();
      }
    }
  };

  const replaceNext = () => {
    if (!findText || !textareaRef.current || readOnly) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentText.substring(start, end);
    
    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      const newText = currentText.substring(0, start) + replaceText + currentText.substring(end);
      updateText(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + replaceText.length, start + replaceText.length);
        }
      }, 0);
    } else {
      findNext();
    }
  };

  const replaceAll = () => {
    if (!findText || readOnly) return;
    
    const newText = currentText.replace(
      new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      replaceText
    );
    updateText(newText);
  };

  // Handle region highlighting
  const getHighlightedText = () => {
    if (highlightRegions.length === 0) return currentText;
    
    // This is a simplified version - in a real implementation,
    // you'd need more sophisticated text highlighting
    let highlightedText = currentText;
    
    highlightRegions.forEach((region) => {
      const regex = new RegExp(region.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      highlightedText = highlightedText.replace(regex, (match) => 
        `[HIGHLIGHT:${region.confidence < 0.5 ? 'ERROR' : 'WARNING'}]${match}[/HIGHLIGHT]`
      );
    });
    
    return highlightedText;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              handleRedo();
            } else {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'f':
            e.preventDefault();
            handleFind();
            break;
          case 'c':
            if (document.activeElement === textareaRef.current) {
              // Let default copy behavior work
            }
            break;
          case 'v':
            if (document.activeElement === textareaRef.current) {
              // Let default paste behavior work, but we'll handle it
              setTimeout(handlePaste, 0);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync external text changes
  useEffect(() => {
    if (text !== currentText) {
      setCurrentText(text);
    }
  }, [text]);

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Editor Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-white border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          {/* History Controls */}
          <div className="flex items-center gap-1 mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0 || readOnly}
              title="Undo (Ctrl+Z)"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1 || readOnly}
              title="Redo (Ctrl+Shift+Z)"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Clipboard Controls */}
          <div className="flex items-center gap-1 mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              title="Copy (Ctrl+C)"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-green-50 hover:border-green-400"
            >
              <Copy className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCut}
              disabled={readOnly}
              title="Cut (Ctrl+X)"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-50 hover:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Scissors className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaste}
              disabled={readOnly}
              title="Paste (Ctrl+V)"
              className="h-8 w-8 p-0 border-gray-300 hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ClipboardPaste className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Search Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFind}
            title="Find & Replace (Ctrl+F)"
            className="h-8 px-3 border-gray-300 hover:bg-yellow-50 hover:border-yellow-400"
          >
            <Search className="w-4 h-4 text-gray-700 mr-1" />
            <span className="text-xs text-gray-700">Find</span>
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-sm">
          {highlightRegions.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 rounded-md">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-orange-800 font-medium">
                {highlightRegions.length} {highlightRegions.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>
          )}
          
          {readOnly && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded-md">
              <Type className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">Read Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Find/Replace Bar */}
      {showFind && (
        <div className="p-3 border-b bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <input
                ref={findInputRef}
                type="text"
                placeholder="Find text..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    findNext();
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={findNext}
                className="border-gray-300 hover:bg-blue-100 hover:border-blue-400 text-gray-700"
              >
                Next
              </Button>
            </div>
            
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Replace className="w-4 h-4 text-purple-600" />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={replaceNext}
                  className="border-gray-300 hover:bg-purple-100 hover:border-purple-400 text-gray-700"
                >
                  Replace
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={replaceAll}
                  className="border-gray-300 hover:bg-purple-100 hover:border-purple-400 text-gray-700"
                >
                  Replace All
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFind(false)}
              className="ml-auto border-gray-300 hover:bg-red-100 hover:border-red-400 text-gray-700"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Text Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={currentText}
          onChange={handleTextChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full h-full p-4 font-mono text-sm resize-none border-none outline-none ${
            readOnly ? 'bg-gray-50 text-gray-800' : 'bg-white text-black'
          } placeholder-gray-400 focus:ring-0 focus:outline-none selection:bg-blue-200`}
          style={{
            lineHeight: '1.5',
            tabSize: 2
          }}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart);
          }}
        />

        {/* Error Region Indicators */}
        {highlightRegions.map((region) => (
          <div
            key={region.id}
            className={`absolute pointer-events-none ${
              region.confidence < 0.5 
                ? 'bg-red-200 border-l-2 border-red-500' 
                : 'bg-yellow-200 border-l-2 border-yellow-500'
            }`}
            style={{
              // This would need proper calculation based on text position
              // For now, showing as example
              top: '20px',
              left: '0',
              right: '0',
              height: '20px',
              opacity: 0.3
            }}
            title={`${region.text} (${Math.round(region.confidence * 100)}% confidence)`}
          />
        ))}
      </div>

      {/* Enhanced Status Bar */}
      <div className="flex items-center justify-between p-3 border-t bg-white border-gray-200 text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Line:</span>
            <span className="font-medium text-gray-900">
              {currentText.substring(0, cursorPosition).split('\n').length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Column:</span>
            <span className="font-medium text-gray-900">
              {cursorPosition - currentText.lastIndexOf('\n', cursorPosition - 1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Characters:</span>
            <span className="font-medium text-blue-700">{currentText.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Words:</span>
            <span className="font-medium text-green-700">
              {currentText.trim().split(/\s+/).filter(Boolean).length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {readOnly && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200">
              Read Only
            </span>
          )}
          <span className="text-gray-500 text-xs">UTF-8</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}