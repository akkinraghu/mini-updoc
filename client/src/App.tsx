import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./App.css";

// Types
interface User {
  id: string;
  username: string;
  role: "patient" | "doctor";
}

// Components
const Header: React.FC<{
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}> = ({ user, onLogin, onLogout }) => {
  return (
    <header className="header">
      <h1 style={{ textAlign: "center" }}>Updoc</h1>
      {user && (
        <div className="user-info">
          <p>
            Welcome, {user.username} ({user.role})
          </p>
          <button onClick={onLogout}>Logout</button>
        </div>
      )}
    </header>
  );
};

const LoginSignup: React.FC<{ onLogin: (user: User) => void }> = ({
  onLogin,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:3001/api/signup_or_login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, role }),
        }
      );

      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
        navigate("/welcome");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-signup">
      <h2>Login / Signup</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "patient" | "doctor")}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Login / Signup"}
        </button>
      </form>
    </div>
  );
};

const Welcome: React.FC = () => (
  <div className="welcome">
    <h2>Welcome to Updoc</h2>
    <p>Your medical consultation platform</p>
    <div className="navigation">
      <Link to="/consultation" className="nav-button">
        Create a consultation
      </Link>
      <Link to="/ticket" className="nav-button">
        View tickets
      </Link>
    </div>
  </div>
);

const Consultation: React.FC<{ user: User | null }> = ({ user }) => {
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: user.id,
          description,
        }),
      });

      if (response.ok) {
        setDescription("");
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  if (submitted) {
    return (
      <div className="consultation">
        <h2>Consultation Submitted</h2>
        <p>
          Thank you for your submission. A doctor will review your case soon.
        </p>
        <Link to="/" className="nav-button">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="consultation">
      <h2>Request a Consultation</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Describe your symptoms:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
          />
        </div>
        <button type="submit" disabled={!user}>
          Submit
        </button>
      </form>
    </div>
  );
};

const TicketView: React.FC<{ user: User | null }> = ({ user }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currentTicketIndex, setCurrentTicketIndex] = useState<number>(-1);

  React.useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
        
        // If there are tickets and no current ticket is selected, select the first one
        if (data.length > 0 && !currentTicket) {
          setCurrentTicketIndex(0);
          handleTicketSelect(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchActions = async (ticketId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/tickets/${ticketId}/actions`
      );
      if (response.ok) {
        const data = await response.json();
        setActions(data);
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    }
  };

  const handleTicketSelect = (ticket: any) => {
    setCurrentTicket(ticket);
    fetchActions(ticket.id);
    
    // Update the current ticket index
    const index = tickets.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
      setCurrentTicketIndex(index);
    }
  };

  const navigateToTicket = (direction: 'next' | 'prev') => {
    if (tickets.length === 0) return;
    
    let newIndex = currentTicketIndex;
    
    if (direction === 'next') {
      newIndex = (currentTicketIndex + 1) % tickets.length;
    } else {
      newIndex = (currentTicketIndex - 1 + tickets.length) % tickets.length;
    }
    
    setCurrentTicketIndex(newIndex);
    handleTicketSelect(tickets[newIndex]);
  };

  const updateTicketStatus = async (status: "in-progress" | "closed") => {
    if (!currentTicket || !user) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/tickets/${currentTicket.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            userId: user.id,
          }),
        }
      );

      if (response.ok) {
        const updatedTicket = await response.json();
        
        // Update the ticket in the tickets array
        const updatedTickets = [...tickets];
        updatedTickets[currentTicketIndex] = updatedTicket;
        setTickets(updatedTickets);
        
        setCurrentTicket(updatedTicket);
        fetchActions(currentTicket.id);
        
        // If ticket is closed, automatically navigate to the next ticket
        if (status === "closed" && tickets.length > 1) {
          setTimeout(() => navigateToTicket('next'), 1000);
        }
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const deleteTicket = async () => {
    if (!currentTicket || !user) return;
    
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/tickets/${currentTicket.id}?userId=${user.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (response.ok) {
        // Remove the ticket from the list
        const newTickets = tickets.filter(ticket => ticket.id !== currentTicket.id);
        setTickets(newTickets);
        
        // Navigate to the next ticket if available
        if (newTickets.length > 0) {
          const nextIndex = Math.min(currentTicketIndex, newTickets.length - 1);
          setCurrentTicketIndex(nextIndex);
          setCurrentTicket(newTickets[nextIndex]);
          fetchActions(newTickets[nextIndex].id);
        } else {
          setCurrentTicket(null);
          setCurrentTicketIndex(-1);
          setActions([]);
        }
      } else {
        const errorData = await response.json();
        setDeleteError(errorData.message || "Failed to delete ticket. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      setDeleteError("An error occurred while deleting the ticket.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="tickets">
        <h2>Ticket Management</h2>
        <p>Please login to view tickets</p>
      </div>
    );
  }

  return (
    <div className="tickets">
      <h2>Ticket Management</h2>

      <div className="ticket-container">
        <div className="ticket-list">
          <h3>Tickets</h3>
          {tickets.length === 0 ? (
            <p>No tickets available</p>
          ) : (
            <>
              <div className="ticket-count">
                {tickets.length > 0 && (
                  <p>
                    Ticket {currentTicketIndex + 1} of {tickets.length}
                  </p>
                )}
              </div>
              <ul>
                {tickets.map((ticket, index) => (
                  <li key={ticket.id} onClick={() => handleTicketSelect(ticket)}>
                    <div
                      className={`ticket-item status-${ticket.status} ${
                        currentTicket?.id === ticket.id ? "selected" : ""
                      }`}
                    >
                      <div className={`ticket-status ticket-status-${ticket.status}`}>
                        <span className="ticket-status-icon">
                          {ticket.status === "open" && "!"}
                          {ticket.status === "in-progress" && "→"}
                          {ticket.status === "closed" && "✓"}
                        </span>
                        {ticket.status}
                      </div>
                      <div className="ticket-desc">
                        {ticket.description.substring(0, 30)}...
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {currentTicket && (
          <div className="ticket-detail">
            <div className="ticket-navigation">
              <button 
                onClick={() => navigateToTicket('prev')}
                disabled={tickets.length <= 1}
                className="nav-button"
              >
                ← Previous
              </button>
              <button 
                onClick={() => navigateToTicket('next')}
                disabled={tickets.length <= 1}
                className="nav-button"
              >
                Next →
              </button>
            </div>
            
            <h3>Ticket Details</h3>
            <div className="ticket-info">
              <p>
                <strong>Status:</strong> {currentTicket.status}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(currentTicket.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Description:</strong> {currentTicket.description}
              </p>
            </div>

            {user.role === "doctor" && (
              <div className="ticket-actions">
                <button
                  onClick={() => updateTicketStatus("in-progress")}
                  disabled={currentTicket.status === "in-progress"}
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => updateTicketStatus("closed")}
                  disabled={currentTicket.status === "closed"}
                >
                  Close Ticket
                </button>
                <button
                  onClick={deleteTicket}
                  disabled={isDeleting}
                  className="delete-button"
                >
                  {isDeleting ? "Deleting..." : "Delete Ticket"}
                </button>
              </div>
            )}
            
            {deleteError && <div className="error-message">{deleteError}</div>}

            <div className="action-log">
              <h4>Action Log</h4>
              {actions.length === 0 ? (
                <p>No actions recorded</p>
              ) : (
                <ul>
                  {actions.map((action) => (
                    <li key={action.id}>
                      <span className="action-time">
                        {new Date(action.timestamp).toLocaleString()}
                      </span>
                      <span className="action-desc">{action.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                user ? <Navigate to="/welcome" /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/welcome" />
                ) : (
                  <LoginSignup onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/welcome"
              element={user ? <Welcome /> : <Navigate to="/login" />}
            />
            <Route
              path="/consultation"
              element={
                user ? <Consultation user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/ticket"
              element={
                user ? <TicketView user={user} /> : <Navigate to="/login" />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
