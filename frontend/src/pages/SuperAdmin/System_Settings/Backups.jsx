import React, { useState, useEffect } from "react";
import { Database, Download, RefreshCw, Trash2, CloudUpload } from "lucide-react";

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simulated backup data
  useEffect(() => {
    const dummyBackups = [
      {
        id: 1,
        name: "backup_2025_10_20.zip",
        size: "25.4 MB",
        date: "2025-10-20 14:30",
      },
      {
        id: 2,
        name: "backup_2025_10_10.zip",
        size: "24.8 MB",
        date: "2025-10-10 12:15",
      },
    ];
    setBackups(dummyBackups);
  }, []);

  // Simulate creating a new backup
  const handleCreateBackup = () => {
    setLoading(true);
    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        name: `backup_${new Date().toISOString().slice(0, 10)}.zip`,
        size: `${(20 + Math.random() * 10).toFixed(1)} MB`,
        date: new Date().toLocaleString(),
      };
      setBackups([newBackup, ...backups]);
      setLoading(false);
    }, 2000);
  };

  const handleDownload = (backup) => {
    alert(`Downloading: ${backup.name}`);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this backup?")) {
      setBackups(backups.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-600" />
          Backups
        </h1>
        <button
          onClick={handleCreateBackup}
          disabled={loading}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
        >
          <CloudUpload className="h-5 w-5" />
          {loading ? "Creating..." : "Create Backup"}
        </button>
      </div>

      {/* Backup Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full table-auto">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">File Name</th>
              <th className="px-6 py-3 text-left">Size</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.length > 0 ? (
              backups.map((backup) => (
                <tr
                  key={backup.id}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3 text-gray-800">{backup.name}</td>
                  <td className="px-6 py-3 text-gray-700">{backup.size}</td>
                  <td className="px-6 py-3 text-gray-700">{backup.date}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleDownload(backup)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(backup.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center text-gray-500 py-6 italic"
                >
                  No backups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default Backups;
