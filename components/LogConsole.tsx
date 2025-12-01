import React, { useEffect, useRef } from 'react';
import { BotLog } from '../types';
import { Terminal, XCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface LogConsoleProps {
  logs: BotLog[];
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: BotLog['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden flex flex-col h-full shadow-lg border border-gray-800">
      <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
        <Terminal className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-mono text-gray-300">bot-activity.log</span>
      </div>
      <div className="p-4 overflow-y-auto flex-1 font-mono text-sm space-y-1.5 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-gray-600 italic">Waiting for bot to start...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start space-x-3 hover:bg-white/5 p-1 rounded transition-colors">
            <span className="text-gray-500 text-xs mt-0.5 min-w-[60px]">{log.timestamp}</span>
            <div className="mt-0.5">{getIcon(log.type)}</div>
            <span className={`break-all ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
