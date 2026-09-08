import { useState, useEffect, useRef, useCallback } from "react";
import { Search, UserCheck, Plus, X, Loader2, Check, AlertCircle } from "lucide-react";
import useApiCall from "../hooks/useApiCall";

const getInitials = (name, email) => {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }
  if (email) {
    return email[0]?.toUpperCase() || "?";
  }
  return "?";
};

export default function UserSearchSelect({
  onAddUser,
  placeholder = "Search user by name or email to validate account...",
  buttonLabel = "Add User",
  existingEmails = [],
}) {
  const apiCall = useApiCall();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const performSearch = useCallback(
    async (q) => {
      if (!q || q.trim().length < 2) {
        setResults([]);
        setSearching(false);
        setHasSearched(false);
        return;
      }
      setSearching(true);
      try {
        const data = await apiCall(
          `admin/users/search?query=${encodeURIComponent(q.trim())}`,
          "GET",
          null,
          true
        );
        setResults(Array.isArray(data) ? data : []);
        setHasSearched(true);
        setIsOpen(true);
      } catch (err) {
        console.error("Failed to search users:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [apiCall]
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedUser(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(val);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  };

  const handleSelect = (user) => {
    setSelectedUser(user);
    setQuery(user.email);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    onAddUser(selectedUser);
    handleClear();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedExisting = (existingEmails || []).map((e) =>
    (e || "").trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative mb-6">
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        {/* Input with Search Icon */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-obsidian-950 border border-white/10 text-white pl-10 pr-10 py-3 text-sm outline-none focus:border-gold/50 transition-colors"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-gold" />
            </div>
          )}
          {!searching && (query || selectedUser) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Add Button */}
        <button
          type="submit"
          disabled={!selectedUser}
          className="flex items-center justify-center gap-2 bg-gold text-obsidian-950 px-6 py-3 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={16} />
          {buttonLabel}
        </button>
      </form>

      {/* Selected User Badge Preview */}
      {selectedUser && (
        <div className="mt-2.5 flex items-center justify-between p-3 bg-obsidian-950 border border-gold/40">
          <div className="flex items-center gap-3 min-w-0">
            {selectedUser.imageUrl ? (
              <img
                src={selectedUser.imageUrl}
                alt=""
                className="w-8 h-8 rounded-full border border-gold/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-xs font-medium text-gold">
                {getInitials(selectedUser.name, selectedUser.email)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">
                  {selectedUser.email}
                </span>
                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase px-1.5 py-0.2 font-medium tracking-wider">
                  <Check size={10} /> Verified User
                </span>
              </div>
              <div className="text-xs text-white/40 truncate">
                {selectedUser.name || "No display name"}
                {selectedUser.referralCode && (
                  <span className="ml-2 text-gold/80 font-mono">
                    Code: {selectedUser.referralCode}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-white/40 hover:text-red-400 p-1 transition-colors"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search Dropdown Results */}
      {isOpen && !selectedUser && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-obsidian-900 border border-white/10 shadow-2xl max-h-72 overflow-y-auto">
          {results.length === 0 && hasSearched ? (
            <div className="p-4 text-center text-sm text-white/40 flex items-center justify-center gap-2">
              <AlertCircle size={16} className="text-yellow-400" />
              <span>No registered users found matching "{query}"</span>
            </div>
          ) : (
            <div className="py-1 divide-y divide-white/5">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
                Select a registered user to add
              </div>
              {results.map((user) => {
                const isAlreadyAdded = normalizedExisting.includes(
                  (user.email || "").trim().toLowerCase()
                );

                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleSelect(user)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      isAlreadyAdded
                        ? "opacity-40 cursor-not-allowed bg-white/[0.01]"
                        : "hover:bg-white/5 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-medium text-white/80 shrink-0">
                          {getInitials(user.name, user.email)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {user.email}
                        </div>
                        <div className="text-xs text-white/40 truncate">
                          {user.name || "User"}
                          {user.referralCode && (
                            <span className="ml-2 text-gold/70 font-mono text-[11px]">
                              Code: {user.referralCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isAlreadyAdded ? (
                        <span className="text-[11px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5">
                          Already Added
                        </span>
                      ) : (
                        <span className="text-xs text-gold flex items-center gap-1">
                          <UserCheck size={14} /> Select
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
