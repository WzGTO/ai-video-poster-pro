"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVideoCreation, VideoCreationState } from "@/hooks/useVideoCreation";
import { useProducts } from "@/hooks/useProducts";

import { StepSelectMode } from "./steps/StepSelectMode";
import { StepProductSelection } from "./steps/StepProductSelection";
import { StepAutoMode } from "./steps/StepAutoMode";
import { StepManualMode } from "./steps/StepManualMode";
import { StepSelectModels } from "./steps/StepSelectModels";
import { StepReview } from "./steps/StepReview";
import { ProcessingModal } from "./ProcessingModal";

interface VideoCreationWizardProps {
    initialProductId?: string | null;
}

const STEPS = [
    { id: 1, name: "เลือกโหมด" },
    { id: 2, name: "เลือกสินค้า" },
    { id: 3, name: "ตั้งค่า" },
    { id: 4, name: "เลือกโมเดล" },
    { id: 5, name: "ตรวจสอบ" },
];

export function VideoCreationWizard({ initialProductId }: VideoCreationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);

    const {
        state,
        updateState,
        resetState,
        validate,
        createVideo,
        isCreating,
        videoId,
        progress,
        error,
    } = useVideoCreation();

    const { products } = useProducts({ limit: 100 });

    // Set initial product if provided
    useEffect(() => {
        if (initialProductId) {
            const product = products.find(p => p.id === initialProductId);
            if (product) {
                updateState({ productId: initialProductId, product });
                setCurrentStep(2); // Go to step 2
            }
        }
    }, [initialProductId, products, updateState]);

    // Handlers
    const handleNext = () => {
        if (validate(currentStep)) {
            if (currentStep < 5) {
                setCurrentStep(currentStep + 1);
            } else {
                // Final step - create video
                createVideo();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleModeSelect = (mode: "auto" | "manual") => {
        updateState({ mode });
        setCurrentStep(2);
    };

    const canProceed = validate(currentStep);

    return (
        <div className="min-h-[80vh] flex flex-col">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors",
                                    currentStep === step.id
                                        ? "bg-blue-500 text-white"
                                        : currentStep > step.id
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                                )}
                            >
                                {currentStep > step.id ? "✓" : step.id}
                            </div>

                            {/* Step Name */}
                            <span
                                className={cn(
                                    "ml-2 text-sm hidden sm:block",
                                    currentStep === step.id
                                        ? "text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-gray-500"
                                )}
                            >
                                {step.name}
                            </span>

                            {/* Connector Line */}
                            {index < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-1 mx-4",
                                        currentStep > step.id
                                            ? "bg-green-500"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                {currentStep === 1 && (
                    <StepSelectMode
                        selectedMode={state.mode}
                        onSelectMode={handleModeSelect}
                    />
                )}

                {currentStep === 2 && (
                    <StepProductSelection
                        products={products}
                        selectedProductId={state.productId}
                        onSelect={(productId, product) => updateState({ productId, product })}
                    />
                )}

                {currentStep === 3 && state.mode === "auto" && (
                    <StepAutoMode state={state} updateState={updateState} />
                )}

                {currentStep === 3 && state.mode === "manual" && (
                    <StepManualMode state={state} updateState={updateState} />
                )}

                {currentStep === 4 && (
                    <StepSelectModels state={state} updateState={updateState} />
                )}

                {currentStep === 5 && (
                    <StepReview state={state} />
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1 || isCreating}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    ย้อนกลับ
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!canProceed || isCreating}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                    {currentStep === 5 ? (
                        <>🎬 สร้างวิดีโอ</>
                    ) : (
                        <>
                            ถัดไป
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>

            {/* Processing Modal */}
            {isCreating && (
                <ProcessingModal
                    videoId={videoId}
                    progress={progress}
                    error={error}
                />
            )}
        </div>
    );
}
