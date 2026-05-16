// Import menu types from the data layer for consistency
import type {
  StoreIngredientDTO,
  StoreDishDTO,
  StoreCourseDTO,
  StoreMenuDTO,
  StoreMenusResponse,
  StoreMenuResponse,
} from '@libs/util/server/data/menus.server';

// Re-export for external use
export type {
  StoreIngredientDTO,
  StoreDishDTO,
  StoreCourseDTO,
  StoreMenuDTO,
  StoreMenusResponse,
  StoreMenuResponse,
};

// Additional UI-specific types for menu display
export interface MenuCardProps {
  menu: StoreMenuDTO;
  className?: string;
  showCourseCount?: boolean;
  showDescription?: boolean;
  onMenuSelect?: (menuId: string) => void;
}

export interface CourseDisplayProps {
  course: StoreCourseDTO;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

export interface DishCardProps {
  dish: StoreDishDTO;
  showIngredients?: boolean;
  className?: string;
}

export interface IngredientTagProps {
  ingredient: StoreIngredientDTO;
  showOptional?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Menu filtering and search types
export interface MenuFilters {
  search?: string;
  courseCount?: {
    min?: number;
    max?: number;
  };
  dishCount?: {
    min?: number;
    max?: number;
  };
}

export interface MenuSearchParams {
  q?: string;
  limit?: number;
  offset?: number;
}

// Menu statistics for UI
export interface MenuStats {
  totalCourses: number;
  totalDishes: number;
  totalIngredients: number;
  optionalIngredients: number;
  requiredIngredients: number;
}

// Helper function type for calculating menu stats
export type CalculateMenuStats = (menu: StoreMenuDTO) => MenuStats;

// Menu breadcrumb type for navigation
export interface MenuBreadcrumb {
  label: string;
  href?: string;
  current?: boolean;
} 