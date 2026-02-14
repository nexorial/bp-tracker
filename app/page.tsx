export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">BP Tracker</h1>
      <p className="mt-4">Blood Pressure Tracking App</p>
      
      {/* Tailwind CSS Test Element */}
      <div 
        data-testid="tailwind-test"
        className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-lg shadow-lg"
      >
        <h2 className="text-xl font-semibold">Tailwind CSS is working!</h2>
        <p className="mt-2">This gradient box confirms Tailwind is properly configured.</p>
      </div>
    </main>
  )
}
