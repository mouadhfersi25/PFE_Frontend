import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Info } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disableNext?: boolean;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onCancel?: () => void;
  isMandatory?: boolean;
}

export default function GuidedTour({ steps, isActive, onComplete, onCancel, isMandatory }: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = steps[currentStepIndex];
  const lastTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !currentStep) {
      if (lastTargetRef.current) {
        lastTargetRef.current.style.zIndex = '';
        lastTargetRef.current.style.position = '';
        lastTargetRef.current.style.pointerEvents = '';
        lastTargetRef.current = null;
      }
      return;
    }

    const updatePosition = () => {
      if (lastTargetRef.current) {
        lastTargetRef.current.style.zIndex = '';
        lastTargetRef.current.style.position = '';
        lastTargetRef.current.style.pointerEvents = '';
      }

      const element = document.getElementById(currentStep.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Elevate the element
        element.style.zIndex = '10001';
        if (!['relative', 'absolute', 'fixed'].includes(window.getComputedStyle(element).position)) {
          element.style.position = 'relative';
        }
        element.style.pointerEvents = 'auto';
        lastTargetRef.current = element;

        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 300);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, currentStepIndex, steps]);

  const handleNext = () => {
    if (currentStep.disableNext) return;
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  if (!isActive || !currentStep || !targetRect) return null;

  const bubblePosition = () => {
    const space = 24;
    const pos = currentStep.position || 'bottom';
    
    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10002,
    };

    switch (pos) {
      case 'top':
        style.left = targetRect.left + targetRect.width / 2;
        style.top = targetRect.top - space;
        style.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        style.left = targetRect.left + targetRect.width / 2;
        style.top = targetRect.bottom + space;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.left = targetRect.left - space;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        style.left = targetRect.right + space;
        style.top = targetRect.top + targetRect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <>
      {/* Background Dimmer (using the hole-punching technique) */}
      <div 
        className="fixed inset-0 z-[10000] pointer-events-none transition-all duration-500"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          clipPath: `path('M 0 0 h 50000 v 50000 h -50000 Z M ${targetRect.left - 12} ${targetRect.top - 12} v ${targetRect.height + 24} h ${targetRect.width + 24} v ${-(targetRect.height + 24)} Z')`,
          pointerEvents: 'none'
        }}
      />
      
      {/* Visual border for spotlight */}
      <div 
        className="fixed z-[10000] pointer-events-none border-[4px] border-indigo-400 rounded-3xl transition-all duration-500"
        style={{
          left: targetRect.left - 12,
          top: targetRect.top - 12,
          width: targetRect.width + 24,
          height: targetRect.height + 24,
        }}
      />

      {/* Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={bubblePosition()}
          className="w-80 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-7 border border-white/20"
        >
          <div className="relative">
            {!isMandatory && onCancel && (
              <button 
                onClick={onCancel}
                className="absolute -right-2 -top-2 p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{currentStep.title}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Étape {currentStepIndex + 1} sur {steps.length}</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-base mb-6 leading-relaxed font-medium">
              {currentStep.content}
            </p>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`} 
                  />
                ))}
              </div>
              
              <motion.button
                whileHover={!currentStep.disableNext ? { scale: 1.05 } : {}}
                whileTap={!currentStep.disableNext ? { scale: 0.95 } : {}}
                onClick={handleNext}
                disabled={currentStep.disableNext}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl ${
                  currentStep.disableNext 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {currentStepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}
                <ChevronRight className={`w-4 h-4 ${currentStep.disableNext ? 'opacity-0' : 'opacity-100'}`} />
              </motion.button>
            </div>
          </div>
          
          {/* Arrow */}
          <div 
            className={`absolute w-4 h-4 bg-white transform rotate-45 ${
              currentStep.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2' :
              currentStep.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2' :
              currentStep.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2' :
              'left-[-8px] top-1/2 -translate-y-1/2'
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
