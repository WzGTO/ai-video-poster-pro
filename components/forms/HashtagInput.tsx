"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X, Hash, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HashtagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
    maxTags?: number;
    placeholder?: string;
    label?: string;
    className?: string;
}

export function HashtagInput({
    value = [],
    onChange,
    suggestions = [],
    maxTags = 10,
    placeholder = "พิมพ์แล้วกด Enter",
    label,
    className,
}: HashtagInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function addTag(tag: string) {
        let cleanTag = tag.trim().replace(/^#/, "").replace(/\s+/g, "");
        if (!cleanTag) return;

        if (value.length >= maxTags) {
            return;
        }

        if (!value.includes(cleanTag)) {
            onChange([...value, cleanTag]);
        }
        setInputValue("");
        setShowSuggestions(false);
    }

    function removeTag(tagToRemove: string) {
        onChange(value.filter((tag) => tag !== tagToRemove));
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    }

    // Filter suggestions
    const filteredSuggestions = suggestions.filter(
        (s) =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !value.includes(s.replace(/^#/, ""))
    );

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Hash className="w-4 h-4" />
                    {label}
                </label>
            )}

            {/* Tags Container */}
            <div
                className={cn(
                    "flex flex-wrap gap-2 p-3 rounded-xl border bg-white dark:bg-gray-800",
                    "border-gray-200 dark:border-gray-700",
                    "min-h-[48px] cursor-text"
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Tags */}
                {value.map((tag) => (
                    <span
                        key={tag}
                        className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm",
                            "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        )}
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Input */}
                {value.length < maxTags && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={value.length === 0 ? placeholder : ""}
                        className={cn(
                            "flex-1 min-w-[100px] bg-transparent border-none outline-none",
                            "text-sm text-gray-900 dark:text-white placeholder-gray-400"
                        )}
                    />
                )}
            </div>

            {/* Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 z-10 p-2 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-2 px-2 text-xs text-gray-500">
                            <Sparkles className="w-3 h-3" />
                            <span>แนะนำ</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {filteredSuggestions.slice(0, 8).map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => addTag(suggestion)}
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-sm transition-colors",
                                        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                                        "hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300"
                                    )}
                                >
                                    #{suggestion.replace(/^#/, "")}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Counter */}
            <div className="flex justify-between text-xs text-gray-500">
                <span>กด Enter หรือ , เพื่อเพิ่ม</span>
                <span>
                    {value.length}/{maxTags}
                </span>
            </div>
        </div>
    );
}
