import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const BasicEditor = ({ value, onChange, language }: { value: string, onChange: (value: string) => void, language: string }) => {
  
  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault(); 
    navigator.clipboard.writeText(value);
    toast.success('Code copied to clipboard');
  };
  
  const downloadCode = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.createElement('a');
    const file = new Blob([value], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `code.${language || 'txt'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Code downloaded');
  };

  const highlightCode = (code: string) => {
    try {
      const lang = language || 'javascript';
      return highlight(code, languages.javascript, lang);
    } catch (error) {
      console.error('Error highlighting code:', error);
      return code;
    }
  };

  return (
    <div className="editor-container rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            {language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code'} Editor
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={copyToClipboard}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Copy code"
          >
            <Copy size={16} />
          </button>
          <button 
            type="button"
            onClick={downloadCode}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Download code"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
     {/* code editor container */}
      <div className="editor-content-container md:h-[80vh] h-[50vh] overflow-auto">
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlightCode}
          padding={10}
          className="w-full font-mono text-[15px] leading-[1.5] focus:outline-none dark:text-white text-black dark:bg-gray-600 bg-white"
          style={{
            fontFamily: '"Fira Code", "Consolas", monospace',
            minHeight: '100%'
          }}
        />
      </div>
    </div>
  );
};
