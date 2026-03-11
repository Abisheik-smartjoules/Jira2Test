import { useRef, KeyboardEvent } from 'react';
import { FileText, CheckSquare } from 'lucide-react';

interface TabSelectorProps {
  activeTab: 'stories' | 'tasks';
  onTabChange: (tab: 'stories' | 'tasks') => void;
}

export function TabSelector({ activeTab, onTabChange }: TabSelectorProps): JSX.Element {
  const storiesTabRef = useRef<HTMLButtonElement>(null);
  const tasksTabRef = useRef<HTMLButtonElement>(null);

  const tabs = [
    { id: 'stories' as const, label: 'Stories', icon: FileText, ref: storiesTabRef },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, ref: tasksTabRef },
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onTabChange(tabs[currentIndex].id);
      return;
    }

    if (nextIndex !== null) {
      tabs[nextIndex].ref.current?.focus();
    }
  };

  return (
    <div className="mb-8">
      <div role="tablist" className="inline-flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl shadow-soft">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              ref={tab.ref}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                relative px-6 py-2.5 font-semibold text-sm transition-all duration-200
                rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                flex items-center space-x-2
                ${
                  isActive
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-1 h-1 bg-primary-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
