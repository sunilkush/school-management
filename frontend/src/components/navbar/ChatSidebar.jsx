import { Plus, MoreHorizontal } from "lucide-react";

const chatGroups = {
  A: [
    {
      name: "Archie Parker",
      avatar: "https://i.pravatar.cc/40?img=3",
      status: "online",
      lastSeen: "Kalid is online",
      color: "green",
    },
    {
      name: "Alfie Mason",
      avatar: "https://i.pravatar.cc/40?img=4",
      status: "away",
      lastSeen: "Taherah left 7 mins ago",
      color: "gray",
    },
    {
      name: "Aharli Kane",
      avatar: "https://i.pravatar.cc/40?img=5",
      status: "online",
      lastSeen: "Sami is online",
      color: "green",
    },
    {
      name: "Athan Jacoby",
      avatar: "https://i.pravatar.cc/40?img=6",
      status: "away",
      lastSeen: "Nargis left 30 mins ago",
      color: "red",
    },
  ],
  B: [
    {
      name: "Bashid Samim",
      avatar: "https://i.pravatar.cc/40?img=7",
      status: "away",
      lastSeen: "Rashid left 50 mins ago",
      color: "gray",
    },
    {
      name: "Breddie Ronan",
      avatar: "https://i.pravatar.cc/40?img=8",
      status: "online",
      lastSeen: "Kalid is online",
      color: "green",
    },
    {
      name: "George Carson",
      avatar: "https://i.pravatar.cc/40?img=9",
      status: "away",
      lastSeen: "Taherah left 7 mins ago",
      color: "gray",
    },
  ],
  D: [
    {
      name: "Darry Parker",
      avatar: "https://i.pravatar.cc/40?img=10",
      status: "online",
      lastSeen: "Sami is online",
      color: "green",
    },
    {
      name: "Denry Hunter",
      avatar: "https://i.pravatar.cc/40?img=11",
      status: "away",
      lastSeen: "Nargis left 30 mins ago",
      color: "red",
    },
  ],
  J: [
    {
      name: "Jack Ronan",
      avatar: "https://i.pravatar.cc/40?img=12",
      status: "away",
      lastSeen: "Rashid left 50 mins ago",
      color: "gray",
    },
    {
      name: "Jacob Tucker",
      avatar: "https://i.pravatar.cc/40?img=13",
      status: "online",
      lastSeen: "Kalid is online",
      color: "green",
    },
    {
      name: "James Logan",
      avatar: "https://i.pravatar.cc/40?img=14",
      status: "away",
      lastSeen: "Taherah left 7 mins ago",
      color: "gray",
    },
    {
      name: "Joshua Weston",
      avatar: "https://i.pravatar.cc/40?img=15",
      status: "online",
      lastSeen: "Sami is online",
      color: "green",
    },
  ],
};

const ChatSidebar = () => {
  return (
    <div className="w-80 bg-white border-r shadow-sm h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-purple-100">
        <div className="flex space-x-6">
          <span className="text-sm font-medium text-gray-500">NOTES</span>
          <span className="text-sm font-medium text-gray-500">ALERTS</span>
          <span className="text-sm font-semibold text-purple-700 border-b-2 border-purple-600 pb-1">CHAT</span>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </div>

      {/* Chat List Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-gray-800">Chat List</h3>
        <div className="flex items-center gap-2">
          <button className="bg-gray-100 p-1 rounded-full hover:bg-gray-200">
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto flex-1">
        {Object.entries(chatGroups).map(([letter, users]) => (
          <div key={letter}>
            <div className="bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 uppercase">{letter}</div>
            {users.map((user, idx) => (
              <div
                key={idx}
                className="flex items-center px-4 py-3 hover:bg-gray-50 border-b"
              >
                <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-${user.color}-500`}
                  />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-800">{user.name}</h4>
                  <p className="text-xs text-gray-400">{user.lastSeen}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
