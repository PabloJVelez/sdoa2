import type { FC } from 'react';

export interface MenuGridSkeletonProps {
  length?: number;
}

export const MenuGridSkeleton: FC<MenuGridSkeletonProps> = ({ length = 6 }) => {
  return (
    <div className="grid grid-cols-1 gap-y-6 @md:grid-cols-2 gap-x-4 @2xl:!grid-cols-3 @4xl:!grid-cols-4 @4xl:gap-x-4">
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Image skeleton */}
            <div className="aspect-[4/3] bg-gray-200" />
            
            {/* Content skeleton */}
            <div className="p-6 space-y-4">
              <div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 