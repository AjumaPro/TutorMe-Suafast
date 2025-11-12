'use client'

interface OpenSeminarsProps {
  seminars: any[]
}

export default function OpenSeminars({ seminars }: OpenSeminarsProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-dashed border-pink-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Open Seminars</h2>
        <span className="text-sm text-gray-500">Coming soon</span>
      </div>

      {seminars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-4xl mb-4">😢</div>
          <p className="text-gray-600 text-center">
            No Open Seminars Available.
            <br />
            Unfortunately, there&apos;s no open seminars right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {seminars.map((seminar) => (
            <div
              key={seminar.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-gray-800">{seminar.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{seminar.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

