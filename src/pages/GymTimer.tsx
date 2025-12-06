import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, RotateCcw, Dumbbell } from "lucide-react";

const SETS_PER_EXERCISE = 3;

const GymTimer = () => {
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [restActive, setRestActive] = useState(false);
  const [restTimer, setRestTimer] = useState(60);
  const [currentExercise, setCurrentExercise] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create beep sound using Web Audio API
    audioRef.current = new Audio("data:audio/wav;base64,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");
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restActive && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setRestActive(false);
            // Play beep sound
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restActive, restTimer]);

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    setCurrentExercise(1);
    setCurrentSet(1);
    setTotalSets(0);
  };

  const handleSetDone = () => {
    setTotalSets((prev) => prev + 1);
    
    // Check if we've completed 3 sets for this exercise
    if (currentSet >= SETS_PER_EXERCISE) {
      // Move to next exercise
      setCurrentExercise((prev) => prev + 1);
      setCurrentSet(1);
    } else {
      // Move to next set within same exercise
      setCurrentSet((prev) => prev + 1);
    }
    
    setRestActive(true);
    setRestTimer(60);
  };

  const handleReset = () => {
    setWorkoutStarted(false);
    setRestActive(false);
    setRestTimer(60);
    setCurrentExercise(1);
    setCurrentSet(1);
    setTotalSets(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-800/80 border-zinc-700 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dumbbell className="h-8 w-8 text-amber-500" />
              <h1 className="text-3xl font-bold text-white">GYM TIMER</h1>
            </div>

            {!workoutStarted ? (
              <div className="space-y-6">
                <p className="text-zinc-400 text-lg">Ready to crush it?</p>
                <Button
                  onClick={handleStartWorkout}
                  size="lg"
                  className="w-full h-16 text-xl bg-amber-600 hover:bg-amber-500 text-white"
                >
                  <Play className="mr-2 h-6 w-6" />
                  Start Workout
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Exercise & Set Display */}
                <div className="bg-zinc-900/50 rounded-xl p-6">
                  <p className="text-zinc-400 text-sm uppercase tracking-wide">Current</p>
                  <p className="text-4xl font-bold text-amber-500 mt-2">
                    Exercise {currentExercise}
                  </p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    Set {currentSet} <span className="text-zinc-500">of {SETS_PER_EXERCISE}</span>
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2">
                  {Array.from({ length: SETS_PER_EXERCISE }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded-full ${
                        i < currentSet - 1 
                          ? 'bg-green-500' 
                          : i === currentSet - 1 
                            ? 'bg-amber-500' 
                            : 'bg-zinc-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs uppercase">Total Sets</p>
                    <p className="text-2xl font-bold text-white">{totalSets}</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs uppercase">Exercises</p>
                    <p className="text-2xl font-bold text-white">{currentExercise - (currentSet === 1 && totalSets > 0 ? 0 : 1) + (currentSet > 1 || totalSets === 0 ? 1 : 0)}</p>
                  </div>
                </div>

                {/* Timer Display */}
                {restActive ? (
                  <div className="bg-amber-600/20 rounded-xl p-6 border border-amber-600/30">
                    <p className="text-amber-400 text-sm uppercase tracking-wide">Rest Time</p>
                    <p className="text-7xl font-mono font-bold text-white mt-2">
                      {restTimer}
                      <span className="text-3xl text-zinc-400 ml-1">s</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-600/20 rounded-xl p-6 border border-green-600/30">
                    <p className="text-green-400 text-lg">Ready for set {currentSet}!</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSetDone}
                    size="lg"
                    disabled={restActive}
                    className="w-full h-14 text-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
                  >
                    SET DONE
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-zinc-400 border-zinc-600 hover:bg-zinc-700"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Workout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GymTimer;
