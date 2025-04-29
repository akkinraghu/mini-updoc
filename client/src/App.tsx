import React, { useState, useCallback, useEffect, useRef, useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
  useNavigate
} from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import { ThemeProvider, useTheme, ThemeSwitcher, ThemeContext } from "./contexts/ThemeContext";

// Types
interface User {
  id: string;
  username: string;
  role: "patient" | "doctor";
}

// API base URL - use environment variable or fallback to local development URL
const API_BASE_URL = "https://mini-updoc-backend-d7801bc6b0f2.herokuapp.com";

// Ticket interface
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "closed";
  patientId: string;
  doctorId: string | null;
  createdAt?: string;
  createdBy?: string;
}

// CreateTicketForm Component
const CreateTicketForm: React.FC<{
  onSubmit: (title: string, description: string) => void;
}> = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { theme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, description);
    setTitle("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="create-ticket-form">
      <div className="form-group">
        <label htmlFor="title" className={`form-label ${theme === 'minecraft' ? 'minecraft-label' : ''}`}>Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={`form-input ${theme === 'minecraft' ? 'minecraft-input' : ''}`}
          placeholder="Enter ticket title"
        />
      </div>
      <div className="form-group">
        <label htmlFor="description" className={`form-label ${theme === 'minecraft' ? 'minecraft-label' : ''}`}>Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className={`form-textarea ${theme === 'minecraft' ? 'minecraft-textarea' : ''}`}
          placeholder="Enter ticket description"
        ></textarea>
      </div>
      <button type="submit" className={`create-button ${theme === 'minecraft' ? 'minecraft-button' : ''}`}>Create Ticket</button>
    </form>
  );
};

// CreateTicket Component
const CreateTicket: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // Create a new ticket
  const handleCreateTicket = async (title: string, description: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          patientId: user.id,
          doctorId: user.role === "doctor" ? user.id : null,
          status: "open",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      // Navigate to tickets view after successful creation
      navigate("/tickets");
    } catch (err) {
      setError("Error creating ticket: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="create-ticket-page">
      <header className="header">
        <h1>UpDoc Ticket Management</h1>
        <div className="user-info">
          <span>
            Welcome, {user.username} ({user.role})
          </span>
          <ThemeSwitcher />
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="navigation-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/tickets" className="nav-link">View Tickets</Link>
      </div>

      <div className="create-ticket-container">
        <h2>CREATE NEW TICKET</h2>
        <CreateTicketForm onSubmit={handleCreateTicket} />
      </div>
    </div>
  );
};

// TicketView Component
const TicketView: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentTicketIndex, setCurrentTicketIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<"open" | "in-progress" | "closed">("open");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const ticketsPerPage = 5;
  const ticketListRef = useRef<HTMLUListElement>(null);
  const handleTabChangeRef = useRef<(tab: "open" | "in-progress" | "closed") => void>(() => {});

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets`);
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      
      // Filter tickets based on user role
      let filteredTickets = data;
      if (user.role === "patient") {
        filteredTickets = data.filter((ticket: Ticket) => ticket.patientId === user.id);
      }
      
      // Sort tickets by latest first (assuming tickets have a createdAt property)
      // If createdAt doesn't exist, we'll sort by ID which is often a timestamp-based value
      filteredTickets.sort((a: Ticket, b: Ticket) => {
        // If tickets have a createdAt property, use that
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Otherwise, sort by ID (assuming newer tickets have higher IDs)
        return b.id.localeCompare(a.id);
      });
      
      // Get usernames for tickets
      const usersResponse = await fetch(`${API_BASE_URL}/api/users`);
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        // Add username to tickets
        filteredTickets = filteredTickets.map((ticket: Ticket) => {
          const patient = users.find((u: any) => u.id === ticket.patientId);
          return {
            ...ticket,
            createdBy: patient ? patient.username : 'Unknown'
          };
        });
      }
      
      setTickets(filteredTickets);
      setSelectedTicket(null);
      setCurrentTicketIndex(-1);
    } catch (err) {
      setError("Error fetching tickets: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.role]);

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle ticket selection
  const handleTicketSelect = useCallback((ticket: Ticket, index: number) => {
    setSelectedTicket(ticket);
    setCurrentTicketIndex(index);
    
    // Auto-scroll to ensure selected ticket is visible
    if (ticketListRef.current) {
      const ticketElements = ticketListRef.current.querySelectorAll('li');
      if (ticketElements[index]) {
        ticketElements[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: "open" | "in-progress" | "closed") => {
    setActiveTab(tab);
    setSelectedTicket(null);
    setCurrentTicketIndex(-1);
    setCurrentPage(1);
  }, []);

  // Filter tickets based on active tab
  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === "open") return ticket.status === "open";
    if (activeTab === "in-progress") return ticket.status === "in-progress";
    return ticket.status === "closed";
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, startIndex + ticketsPerPage);

  // Mark ticket as in-progress (for doctors)
  const handleMarkInProgress = useCallback(async (ticketId: string) => {
    if (user.role !== "doctor") return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in-progress",
          doctorId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }

      await fetchTickets();
    } catch (err) {
      setError("Error updating ticket: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [fetchTickets, user.id, user.role]);

  // Close ticket (for doctors)
  const handleCloseTicket = useCallback(async (ticketId: string) => {
    if (user.role !== "doctor") return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "closed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to close ticket");
      }

      await fetchTickets();
    } catch (err) {
      setError("Error closing ticket: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [fetchTickets, user.role]);

  // Delete ticket (for doctors)
  const handleDeleteTicket = useCallback(async (ticketId: string) => {
    if (user.role !== "doctor") {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete ticket");
      }

      await fetchTickets();
    } catch (err) {
      setError("Error deleting ticket: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [fetchTickets, user.role]);

  // Mark ticket as open (for doctors)
  const handleMarkOpen = useCallback(async (ticketId: string) => {
    if (user.role !== "doctor") return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "open",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }

      await fetchTickets();
    } catch (err) {
      setError("Error updating ticket: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [fetchTickets, user.role]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedTicket(null);
    setCurrentTicketIndex(-1);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore key events when inputs are focused
    if (
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.tagName === "SELECT")
    ) {
      return;
    }

    switch (e.key) {
      case "ArrowUp":
        if (currentTicketIndex > 0) {
          handleTicketSelect(currentTickets[currentTicketIndex - 1], currentTicketIndex - 1);
        }
        break;
      case "ArrowDown":
        if (currentTicketIndex < currentTickets.length - 1) {
          handleTicketSelect(currentTickets[currentTicketIndex + 1], currentTicketIndex + 1);
        }
        break;
      case "ArrowLeft":
        if (currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
        break;
      case "ArrowRight":
        if (currentPage < totalPages) {
          handlePageChange(currentPage + 1);
        }
        break;
      case "o":
      case "O":
        if (selectedTicket && user.role === "doctor" && (selectedTicket.status === "in-progress" || selectedTicket.status === "closed")) {
          handleMarkOpen(selectedTicket.id);
        }
        break;
      case "p":
      case "P":
        if (selectedTicket && user.role === "doctor" && selectedTicket.status === "open") {
          handleMarkInProgress(selectedTicket.id);
        }
        break;
      case "c":
      case "C":
        if (selectedTicket && user.role === "doctor" && (selectedTicket.status === "open" || selectedTicket.status === "in-progress")) {
          handleCloseTicket(selectedTicket.id);
        }
        break;
      case "d":
      case "D":
        if (selectedTicket && user.role === "doctor") {
          handleDeleteTicket(selectedTicket.id);
        }
        break;
      case "Tab":
        e.preventDefault(); // Prevent default tab behavior
        if (activeTab === "open") {
          handleTabChangeRef.current("in-progress");
        } else if (activeTab === "in-progress") {
          handleTabChangeRef.current("closed");
        } else {
          handleTabChangeRef.current("open");
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentTickets,
    currentTicketIndex,
    selectedTicket,
    handleTicketSelect,
    currentPage,
    totalPages,
    user.role,
    handleMarkInProgress,
    handleCloseTicket,
    handleDeleteTicket,
    handlePageChange,
    activeTab
  ]);

  useEffect(() => {
    handleTabChangeRef.current = handleTabChange;
  }, [handleTabChange]);

  // Auto-select first ticket when tickets change or tab changes
  useEffect(() => {
    if (currentTickets.length > 0 && !selectedTicket) {
      handleTicketSelect(currentTickets[0], 0);
    }
  }, [currentTickets, selectedTicket, handleTicketSelect]);

  return (
    <div className="ticket-view">
      <header className="header">
        <h1>UpDoc Ticket Management</h1>
        <div className="user-info">
          <span>
            Welcome, {user.username} ({user.role})
          </span>
          <ThemeSwitcher />
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="navigation-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/create-ticket" className="nav-link">Create Ticket</Link>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "open" ? "active" : ""}`}
          onClick={() => handleTabChange("open")}
        >
          Open Tickets
        </button>
        <button
          className={`tab-button ${activeTab === "in-progress" ? "active" : ""}`}
          onClick={() => handleTabChange("in-progress")}
        >
          In Progress Tickets
        </button>
        <button
          className={`tab-button ${activeTab === "closed" ? "active" : ""}`}
          onClick={() => handleTabChange("closed")}
        >
          Closed Tickets
        </button>
      </div>

      <div className="content">
        <div className="ticket-list-container">
          <h2>{activeTab.replace("-", " ").toUpperCase()} TICKETS</h2>
          
          {isLoading ? (
            <div className="loading">Loading tickets...</div>
          ) : (
            <>
              {currentTickets.length === 0 ? (
                <div className="empty-message">
                  No {activeTab.replace("-", " ")} tickets found.
                </div>
              ) : (
                <ul className="ticket-list" ref={ticketListRef}>
                  {currentTickets.map((ticket, index) => (
                    <li
                      key={ticket.id}
                      className={selectedTicket?.id === ticket.id ? "selected" : ""}
                      onClick={() => handleTicketSelect(ticket, index)}
                    >
                      <div className="ticket-header">
                        <h3>{ticket.title || `Ticket #${ticket.id.substring(0, 4)}`}</h3>
                      </div>
                      <p className="ticket-description">{ticket.description.substring(0, 100)}...</p>
                      <div className="ticket-meta">
                        <span className="ticket-date">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'No date'}
                        </span>
                        <span className="ticket-creator">
                          {ticket.createdBy || 'Unknown user'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="ticket-details">
          {selectedTicket ? (
            <>
              <h2>{selectedTicket.title}</h2>
              <div className={`ticket-detail-status ticket-status-${selectedTicket.status}`}>
                <span className="ticket-status-icon"></span>
                Status: {selectedTicket.status.replace("-", " ")}
              </div>
              <p className="ticket-detail-description">{selectedTicket.description}</p>

              {user.role === "doctor" && (
                <div className="ticket-actions">
                  {selectedTicket.status === "open" && (
                    <>
                      <button
                        className="action-button in-progress"
                        onClick={() => handleMarkInProgress(selectedTicket.id)}
                      >
                        Mark In Progress (P)
                      </button>
                      <button
                        className="action-button closed"
                        onClick={() => handleCloseTicket(selectedTicket.id)}
                      >
                        Close Ticket (C)
                      </button>
                    </>
                  )}
                  {selectedTicket.status === "in-progress" && (
                    <>
                      <button
                        className="action-button open"
                        onClick={() => handleMarkOpen(selectedTicket.id)}
                      >
                        Mark as Open (O)
                      </button>
                      <button
                        className="action-button closed"
                        onClick={() => handleCloseTicket(selectedTicket.id)}
                      >
                        Close Ticket (C)
                      </button>
                    </>
                  )}
                  {selectedTicket.status === "closed" && (
                    <button
                      className="action-button open"
                      onClick={() => handleMarkOpen(selectedTicket.id)}
                    >
                      Reopen Ticket (O)
                    </button>
                  )}
                  <button
                    className="action-button delete"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                  >
                    Delete Ticket (D)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Welcome Component
const Welcome: React.FC<{
  user: User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`welcome-page ${theme}-theme`}>
      <header className="header">
        <h1>UpDoc Ticket Management</h1>
        <div className="user-info">
          <span>
            Welcome, {user.username} ({user.role})
          </span>
          <ThemeSwitcher />
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>
      
      <div className="welcome-content">
        <div className="welcome-header">
          <h2>Welcome to UpDoc Ticket Management</h2>
          <p>Your comprehensive medical consultation platform for efficient patient care</p>
        </div>
        
        <div className="welcome-features">
          <div className="feature">
            <span className="feature-icon">📋</span>
            <h3>Easy Ticket Creation</h3>
            <p>Create and submit medical tickets with ease</p>
          </div>
          <div className="feature">
            <span className="feature-icon">🎫</span>
            <h3>Ticket Management</h3>
            <p>Track and update patient tickets efficiently</p>
          </div>
          <div className="feature">
            <span className="feature-icon">📝</span>
            <h3>Action Logging</h3>
            <p>Comprehensive history of all ticket activities</p>
          </div>
        </div>
        
        <div className="welcome-navigation">
          <Link to="/create-ticket" className="nav-button">
            Create Ticket
          </Link>
          <Link to="/tickets" className="nav-button">
            View Tickets
          </Link>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState<User | null>(null);

  // Check for saved user in localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  // AppContent component to handle routing
  const AppContent = ({ user, handleLogin, handleLogout }: { 
    user: User | null; 
    handleLogin: (user: User) => void; 
    handleLogout: () => void;
  }) => {
    return (
      <>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Welcome user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} API_BASE_URL={API_BASE_URL} />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} API_BASE_URL={API_BASE_URL} />} 
          />
          <Route 
            path="/tickets" 
            element={
              user ? (
                <TicketView user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route
            path="/create-ticket"
            element={
              user ? (
                <CreateTicket user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </>
    );
  };

  return (
    <div className="App">
      <ThemeProvider>
        <Router>
          <AppContent 
            user={user} 
            handleLogin={handleLogin} 
            handleLogout={handleLogout} 
          />
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
