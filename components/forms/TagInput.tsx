"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
    label?: string;
    className?: string;
}

export function TagInput({
    value = [],
    onChange,
    maxTags = 20,
    placeholder = "กด Enter เพื่อเพิ่ม tag",
    label,
    className,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    function addTag(tag: string) {
        const cleanTag = tag.trim();
        if (!cleanTag) return;

        if (value.length >= maxTags) {
            return;
        }

        if (!value.includes(cleanTag)) {
            onChange([...value, cleanTag]);
        }
        setInputValue("");
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

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Tag className="w-4 h-4" />
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
                            "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        )}
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5"
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
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={value.length === 0 ? placeholder : ""}
                        className={cn(
                            "flex-1 min-w-[100px] bg-transparent border-none outline-none",
                            "text-sm text-gray-900 dark:text-white placeholder-gray-400"
                        )}
                    />
                )}
            </div>

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
