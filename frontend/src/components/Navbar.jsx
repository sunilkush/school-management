export default function Navbar() {
    return (
      <header className="bg-white p-4 shadow flex justify-between items-center">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <input className="border px-2 py-1 rounded" placeholder="Search..." />
          <button className="bg-blue-500 text-white px-3 py-1 rounded">Add New Student</button>
        </div>
      </header>
    );
  }