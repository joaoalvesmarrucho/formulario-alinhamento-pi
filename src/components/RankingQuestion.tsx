'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  index: number;
  children: React.ReactNode;
}

function SortableItem({ id, index, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 p-4 mb-2 
        bg-white border border-gray-200 rounded-lg
        cursor-move select-none
        hover:border-gray-400 hover:shadow-sm
        transition-all
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
    >
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
        {index + 1}
      </span>
      <span className="flex-1 text-gray-800">{children}</span>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
    </div>
  );
}

interface RankingQuestionProps {
  question: string;
  items: string[];
  value: string[];
  onChange: (newOrder: string[]) => void;
  helpText?: string;
}

export default function RankingQuestion({
  question,
  items,
  value,
  onChange,
  helpText,
}: RankingQuestionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.indexOf(active.id as string);
      const newIndex = value.indexOf(over.id as string);
      const newOrder = arrayMove(value, oldIndex, newIndex);
      onChange(newOrder);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{question}</h3>
      {helpText && (
        <p className="text-sm text-gray-600 mb-4">{helpText}</p>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={value}
          strategy={verticalListSortingStrategy}
        >
          {value.map((item, index) => (
            <SortableItem key={item} id={item} index={index}>
              {item}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
