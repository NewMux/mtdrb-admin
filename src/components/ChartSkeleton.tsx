export const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded-lg"></div>
  </div>
);

export const TableSkeleton = ({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded w-20"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const KPICardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
);

export const ModalSkeleton = () => (
  <div className="animate-pulse">
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-6 bg-gray-200 rounded w-6"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
