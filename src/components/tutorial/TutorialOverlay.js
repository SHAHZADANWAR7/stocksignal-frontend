import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

export default function TutorialOverlay({ steps, onComplete, onSkip, currentPage }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkipTutorial = () => {
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || !step) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
        onClick={handleSkipTutorial}
      />

      {/* Tutorial Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed z-[100]"
        style={{
          top: step.position?.top || '50%',
          left: step.position?.left || '50%',
          transform: step.position?.transform || 'translate(-50%, -50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-2 border-blue-500 shadow-2xl max-w-md bg-white max-h-[90vh] overflow-y-auto">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-500">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipTutorial}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-slate-700 mb-6 leading-relaxed">{step.description}</p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full ${
                      idx <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-slate-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSkipTutorial}
                  className="text-slate-600"
                >
                  Skip Tutorial
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arrow pointer (optional) */}
        {step.pointTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rotate-45"
            style={{
              top: step.arrowPosition?.top,
              left: step.arrowPosition?.left,
              bottom: step.arrowPosition?.bottom,
              right: step.arrowPosition?.right,
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
