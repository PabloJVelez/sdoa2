import { ActionList } from '@app/components/common/actions-list/ActionList';
import { Image } from '@app/components/common/images/Image';
import { Container } from '@app/components/common/container/Container';
import type { StoreMenuDTO } from '@libs/util/server/data/menus.server';
import clsx from 'clsx';
import type { FC } from 'react';

export interface MenuTemplateProps {
  menu: StoreMenuDTO;
  className?: string;
}

interface ExperienceType {
  id: string;
  name: string;
  price: string;
  description: string;
  duration: string;
}

const experienceTypes: ExperienceType[] = [
  {
    id: 'buffet_style',
    name: 'Buffet Style',
    price: '$99.99',
    description: 'Perfect for larger groups with dishes served buffet-style',
    duration: '2.5 hours'
  },
  {
    id: 'cooking_class',
    name: 'Cooking Class',
    price: '$119.99',
    description: 'Interactive experience learning to prepare these dishes',
    duration: '3 hours'
  },
  {
    id: 'plated_dinner',
    name: 'Plated Dinner',
    price: '$149.99',
    description: 'Elegant multi-course dining experience',
    duration: '4 hours'
  }
];

interface CourseProps {
  course: StoreMenuDTO['courses'][0];
  courseNumber: number;
}

const CourseSection: FC<CourseProps> = ({ course, courseNumber }) => {
  return (
    <div className="mb-12">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
          <span className="text-blue-600 font-bold text-lg">{courseNumber}</span>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900">{course.name}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-16">
        {course.dishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}
      </div>
    </div>
  );
};

interface DishProps {
  dish: StoreMenuDTO['courses'][0]['dishes'][0];
}

const DishCard: FC<DishProps> = ({ dish }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h4 className="text-lg font-semibold text-gray-900 mb-3">{dish.name}</h4>
      
      {dish.description && (
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">{dish.description}</p>
      )}
      
      {dish.ingredients.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-900 mb-2 text-sm">Ingredients:</h5>
          <div className="flex flex-wrap gap-2">
            {dish.ingredients.map((ingredient) => (
              <span
                key={ingredient.id}
                className={clsx(
                  "px-2 py-1 rounded-full text-xs",
                  ingredient.optional
                    ? "bg-gray-100 text-gray-600"
                    : "bg-blue-100 text-blue-800"
                )}
              >
                {ingredient.name}
                {ingredient.optional && ' (optional)'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PricingSection: FC<{ menuName: string }> = ({ menuName }) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 mb-12">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
        Choose Your Experience with {menuName}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {experienceTypes.map((experience, index) => (
          <div 
            key={experience.id}
            className={clsx(
              "bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow",
              index === 1 && "ring-2 ring-blue-500" // Highlight cooking class
            )}
          >
            {index === 1 && (
              <div className="text-center mb-4">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {experience.name}
              </h4>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {experience.price}
              </div>
              <p className="text-sm text-gray-600 mb-4">per person</p>
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                {experience.description}
              </p>
              <div className="text-sm text-gray-600 mb-6">
                Duration: <span className="font-medium">{experience.duration}</span>
              </div>
              
              <ActionList
                actions={[
                  {
                    label: 'Request This Experience',
                    url: `/request?type=${experience.id}&menu=${menuName}`,
                  }
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MenuTemplate: FC<MenuTemplateProps> = ({ menu, className }) => {
  const courseCount = menu.courses?.length || 0;
  const totalDishes = menu.courses?.reduce((acc, course) => acc + (course.dishes?.length || 0), 0) || 0;

  return (
    <div className={clsx("space-y-8", className)}>
      {/* Menu Header */}
      <div className="text-center space-y-6">
        <div className="max-w-4xl mx-auto">
          <Image
            src={menu.thumbnail || menu.images?.[0]?.url || "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"}
            alt={`${menu.name} hero image`}
            className="w-full h-80 object-cover rounded-2xl shadow-lg"
            width={800}
            height={320}
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-italiana text-gray-900">
            {menu.name}
          </h1>
          <div className="flex items-center justify-center space-x-6 text-gray-600">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {courseCount} Course{courseCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              3-4 Hours Experience
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {totalDishes} Signature Dishes
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection menuName={menu.name} />

      {/* Menu Courses */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-italiana text-gray-900 mb-4">
            Menu Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Each course is carefully designed to create a progressive culinary journey. 
            All ingredients are sourced fresh and can be adapted to dietary requirements.
          </p>
        </div>

        <div className="space-y-8">
          {menu.courses.map((course, index) => (
            <CourseSection
              key={course.id}
              course={course}
              courseNumber={index + 1}
            />
          ))}
        </div>
      </div>

      {/* Chef Notes Section */}
      <div className="bg-blue-50 rounded-2xl p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Chef's Notes
          </h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            This {menu.name} menu represents a harmonious blend of flavors and techniques that I've perfected 
            over years of culinary experience. Each dish can be customized to accommodate dietary restrictions 
            and personal preferences while maintaining the integrity of the overall experience.
          </p>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Dietary Accommodations:</strong> Vegetarian, Vegan, Gluten-Free, and other dietary requirements can be accommodated with advance notice.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          Ready to Experience {menu.name}?
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Transform your next special occasion with this expertly crafted menu. 
          Each experience is personalized to your preferences and delivered with professional excellence.
        </p>
        <ActionList
          actions={[
            {
              label: 'Request This Menu',
              url: `/request?menu=${encodeURIComponent(menu.name)}&menuId=${menu.id}`,
            },
            {
              label: 'Browse Other Menus',
              url: '/menus',
            }
          ]}
          className="flex-col gap-4 sm:flex-row sm:justify-center"
        />
      </div>
    </div>
  );
}; 