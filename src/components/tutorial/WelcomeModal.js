import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Brain, Target, X } from "lucide-react";

export default function WelcomeModal({ onStart, onSkip }) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleStart = () => {
    setIsVisible(false);
    onStart?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-2 border-blue-500 shadow-2xl max-w-2xl bg-white relative max-h-[90vh] overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>

            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Welcome to StockSignal! 🎉</CardTitle>
              <p className="text-slate-600 text-lg">
                Your AI-powered investment learning platform
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-900">Practice Trading</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Trade with virtual money to learn without risk
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-900">AI Analysis</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Get intelligent investment recommendations
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-900">Goal Intelligence</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Plan your financial future with AI guidance
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-900">Learn & Grow</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Educational features to improve your skills
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-slate-600 mb-4">
                  Take a quick tour to learn how everything works?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="border-2"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleStart}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Tutorial (2 min)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
