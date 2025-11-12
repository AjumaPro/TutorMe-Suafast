'use client'

interface LearningProgressProps {
  improvement: number
  weeklyData: { day: string; focus: number; hours: number }[]
}

export default function LearningProgress({
  improvement,
  weeklyData,
}: LearningProgressProps) {
  const maxValue = Math.max(
    ...weeklyData.map((d) => Math.max(d.focus, d.hours)),
    1
  )

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hasData = weeklyData.some((d) => d.focus > 0 || d.hours > 0)

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Learning Progress</h2>
        <span className="text-sm text-gray-500">Weekly progress</span>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-800">
          {hasData ? `Improved ${improvement}%` : 'No progress data yet'}
        </p>
      </div>

      {hasData ? (
        <>
          <div className="flex items-end justify-between gap-2 h-32 mb-4">
            {dayNames.map((day) => {
              const data = weeklyData.find((d) => d.day === day) || {
                day,
                focus: 0,
                hours: 0,
              }
              const focusHeight = maxValue > 0 ? (data.focus / maxValue) * 100 : 0
              const hoursHeight = maxValue > 0 ? (data.hours / maxValue) * 100 : 0

              return (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    {focusHeight > 0 && (
                      <div
                        className="w-1/2 bg-teal-400 rounded-t transition-all hover:bg-teal-500"
                        style={{ height: `${Math.max(focusHeight, 2)}%` }}
                        title={`Focus: ${data.focus.toFixed(0)}%`}
                      />
                    )}
                    {hoursHeight > 0 && (
                      <div
                        className="w-1/2 bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                        style={{ height: `${Math.max(hoursHeight, 2)}%` }}
                        title={`Hours: ${data.hours.toFixed(1)}h`}
                      />
                    )}
                    {focusHeight === 0 && hoursHeight === 0 && (
                      <div className="w-full h-1 bg-gray-100 rounded" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{day}</span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-teal-400" />
              <span className="text-gray-600">Focus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-gray-600">Hours</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-sm">Start learning to see your progress</p>
        </div>
      )}
    </div>
  )
}

