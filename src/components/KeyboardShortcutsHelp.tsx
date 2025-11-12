import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp = ({ open, onClose }: KeyboardShortcutsHelpProps) => {
  const shortcuts = [
    {
      category: "Global Shortcuts",
      items: [
        { keys: ["?"], description: "Open keyboard shortcuts help" },
        { keys: ["Ctrl", "/"], description: "Open keyboard shortcuts help" },
        { keys: ["Ctrl", "Shift", "Q"], description: "Quick lead entry dialog" },
      ]
    },
    {
      category: "Lead Dialog",
      items: [
        { keys: ["1"], description: "Set status to: New Lead" },
        { keys: ["2"], description: "Set status to: Called No Answer" },
        { keys: ["3"], description: "Set status to: Called Engaged" },
        { keys: ["4"], description: "Set status to: Called COLD" },
        { keys: ["5"], description: "Set status to: Called Unanswer 2" },
        { keys: ["6"], description: "Set status to: No Connection" },
        { keys: ["7"], description: "Set status to: Warm" },
        { keys: ["8"], description: "Set status to: HOT" },
        { keys: ["9"], description: "Set status to: SOLD" },
        { keys: ["Ctrl", "S"], description: "Save/Submit lead" },
        { keys: ["Ctrl", "H"], description: "Toggle HOT flag 🔥" },
        { keys: ["Esc"], description: "Close dialog" },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, itemIdx) => (
                  <div 
                    key={itemIdx} 
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Press <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">?</kbd> or{" "}
            <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">Ctrl</kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">/</kbd>
            {" "}anytime to view this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
