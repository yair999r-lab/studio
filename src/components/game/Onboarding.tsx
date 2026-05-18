
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, Brain, Gamepad2, Rocket } from "lucide-react";

export function Onboarding({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[32px] p-8">
        <DialogHeader className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-headline font-bold text-slate-800">Welcome to LexiLeap!</DialogTitle>
          <DialogDescription className="text-lg text-slate-600 mt-2">
            Master English through immersive gameplay and smart practice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 my-6">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Study Room</p>
              <p className="text-sm text-slate-500">Practice with interactive 3D flashcards.</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Arcade Mode</p>
              <p className="text-sm text-slate-500">Pop falling word bubbles to build your combo!</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
              <Keyboard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Keyboard Shortcuts</p>
              <p className="text-sm text-slate-500">Use <kbd className="bg-slate-100 px-1 rounded">1-4</kbd> for answers and <kbd className="bg-slate-100 px-1 rounded">Enter</kbd> to proceed.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full chunky-button chunky-primary text-lg py-6">
            LET&apos;S GO!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
