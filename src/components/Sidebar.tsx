import React, { Dispatch, SetStateAction } from 'react';
import { Home, FileAudio, History, Settings as SettingsIcon, HelpCircle } from 'lucide-react';

type View = 'dashboard' | 'transcribe' | 'history' | 'settings' | 'help';

interface SidebarProps {
  activeView: View;
  setActiveView: Dispatch<SetStateAction<View>>;
}

const mainMenuItems = [
  { icon: FileAudio, label: 'Transcribe', view: 'transcribe' as View },
  { icon: History, label: 'History', view: 'history' as View },
  { icon: Home, label: 'Dashboard', view: 'dashboard' as View },
];

const bottomMenuItems = [
  { icon: SettingsIcon, label: 'Settings', view: 'settings' as View },
  { icon: HelpCircle, label: 'Help', view: 'help' as View },
];

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <aside className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="flex-1 flex flex-col p-6">
        <div className="hidden lg:block mb-8">
          <img 
            src="/juicerbanner-wide.png" 
            alt="Text Juicer" 
            className="w-full h-auto max-w-[200px]"
          />
        </div>

        <nav className="flex flex-col space-y-2">
          {mainMenuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`
                flex items-center gap-3 px-4 py-2 lg:py-3 rounded-lg text-left
                ${activeView === item.view
                  ? 'bg-[#F96C57]/20 text-white' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
                transition-colors
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-6 border-t border-white/10">
        <div className="flex flex-col space-y-2">
          {bottomMenuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`
                flex items-center justify-center gap-2 px-3 py-2 rounded-lg flex-1
                ${activeView === item.view
                  ? 'bg-[#F96C57]/20 text-white' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
                transition-colors
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden lg:inline text-sm whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}