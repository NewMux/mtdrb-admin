import React from 'react';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
}

export default function PlaceholderPage({ title, subtitle, description, features }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen w-full p-8 font-sans antialiased text-blue-900 bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">{subtitle}</h2>
            <p className="text-blue-600 mb-6">{description}</p>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-blue-700 text-sm">
                Planned features:
              </p>
              <ul className="text-blue-600 text-sm mt-2 space-y-1">
                {features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 