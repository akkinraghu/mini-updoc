import React, { useState, useCallback, useEffect, useRef } from "react";
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
  onLogin: () => void;
  onLogout: () => void;
}> = ({ user, onLogin, onLogout }) => {
  return (
    <header className="header">
      <div className="logo-container">
        <img 
          src="https://cdn.prod.website-files.com/6368ef8eb234626d58627d89/65f249cf0e83350ffc2fe827_cf1d888e22166085f50240ac3f3d799f_updocLogo-min.webp" 
          alt="Updoc Logo" 
          className="logo-image"
        />
      </div>
      <div className="user-info">
        {user ? (
          <div>
            <span>
              Welcome, {user.username} ({user.role})
            </span>
            <button onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={onLogin}>Login</button>
        )}
      </div>
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
        navigate("/");
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

const Welcome: React.FC = () => {
  console.log("Welcome component rendered");
  return (
    <div className="welcome">
      <h2>Welcome to Updoc</h2>
      <p>Your comprehensive medical consultation platform for efficient patient care</p>
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
      <div className="navigation">
        <Link to="/consultation" className="nav-button">
          Create Ticket
        </Link>
        <Link to="/ticket" className="nav-button">
          View Tickets
        </Link>
      </div>
    </div>
  );
};

const Consultation: React.FC<{ user: User | null }> = ({ user }) => {
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

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
        <h2>Ticket Created</h2>
        <p>
          Thank you for your submission. A doctor will review your ticket soon.
        </p>
        <Link to="/" className="nav-button">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="consultation">
      <div className="consultation-header">
        <span className="back-link" onClick={() => navigate(-1)}>&lt;</span>
        <h2>Create Ticket</h2>
      </div>
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
  const [currentTicketIndex, setCurrentTicketIndex] = useState<number>(-1);
  const [actions, setActions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(5);
  const [deleteError, setDeleteError] = useState("");
  const [patientDetails, setPatientDetails] = useState<{[key: string]: User}>({});
  const [activeTab, setActiveTab] = useState<'open' | 'in-progress' | 'closed'>('open');
  const navigate = useNavigate();

  const fetchPatientDetails = useCallback(async (patientId: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/users");
      if (response.ok) {
        const users = await response.json();
        const patient = users.find((u: any) => u.id === patientId);
        if (patient) {
          setPatientDetails(prev => ({
            ...prev,
            [patientId]: patient
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  }, []);

  const handleTicketSelect = useCallback(async (ticket: any) => {
    setCurrentTicket(ticket);
    
    try {
      // Fetch actions for the selected ticket
      const response = await fetch(`http://localhost:3001/api/tickets/${ticket.id}/actions`);
      if (response.ok) {
        const data = await response.json();
        setActions(data);
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    }
    
    // Fetch patient details if not already loaded
    if (ticket.patientId && !patientDetails[ticket.patientId]) {
      fetchPatientDetails(ticket.patientId);
    }
  }, [patientDetails, fetchPatientDetails]);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/tickets");
      if (response.ok) {
        const data = await response.json();
        
        // Filter tickets based on user role
        let filteredTickets = data;
        if (user && user.role === "patient") {
          // Patients can only see their own tickets
          filteredTickets = data.filter((ticket: any) => ticket.patientId === user.id);
        }
        // Doctors can see all tickets (no filtering needed)
        
        setTickets(filteredTickets);
        
        // If there are tickets and no current ticket is selected, select the first one
        if (filteredTickets.length > 0 && !currentTicket) {
          // For doctors, default to the first open ticket
          if (user?.role === 'doctor') {
            const openTickets = filteredTickets.filter((ticket: any) => ticket.status === 'open');
            if (openTickets.length > 0) {
              setCurrentTicketIndex(filteredTickets.indexOf(openTickets[0]));
              handleTicketSelect(openTickets[0]);
              return;
            }
          }
          
          setCurrentTicketIndex(0);
          handleTicketSelect(filteredTickets[0]);
        } else if (filteredTickets.length === 0) {
          // Clear current ticket if no tickets are available
          setCurrentTicket(null);
          setCurrentTicketIndex(-1);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  }, [user, currentTicket, handleTicketSelect]);

  React.useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user, fetchTickets]);

  const handleNextTicket = () => {
    if (currentTicketIndex < filteredByTab.length - 1) {
      const nextIndex = currentTicketIndex + 1;
      setCurrentTicketIndex(nextIndex);
      handleTicketSelect(filteredByTab[nextIndex]);
    }
  };

  const handlePrevTicket = () => {
    if (currentTicketIndex > 0) {
      const prevIndex = currentTicketIndex - 1;
      setCurrentTicketIndex(prevIndex);
      handleTicketSelect(filteredByTab[prevIndex]);
    }
  };

  const updateTicketStatus = useCallback(async (newStatus: string) => {
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
            status: newStatus,
            userId: user.id,
          }),
        }
      );
      
      if (response.ok) {
        // Update local state
        const updatedTickets = tickets.map((ticket: any) => {
          if (ticket.id === currentTicket.id) {
            return { ...ticket, status: newStatus };
          }
          return ticket;
        });
        
        setTickets(updatedTickets);
        
        // Update current ticket
        setCurrentTicket({ ...currentTicket, status: newStatus });
        
        // If we're in a filtered view (e.g., "open" tickets), and we change a ticket to "in-progress",
        // we need to remove it from the current view and select a new ticket
        if (user.role === 'doctor' && activeTab !== newStatus) {
          // Filter tickets based on active tab
          const filteredTickets = updatedTickets.filter((ticket: any) => ticket.status === activeTab);
          
          // If there are still tickets in this tab, select the first one
          if (filteredTickets.length > 0) {
            setCurrentTicketIndex(0);
            handleTicketSelect(filteredTickets[0]);
          } else {
            // No tickets left in this tab
            setCurrentTicket(null);
            setCurrentTicketIndex(-1);
          }
        }
      } else {
        console.error("Failed to update ticket status");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  }, [currentTicket, user, tickets, activeTab, handleTicketSelect]);

  const handleTabChangeRef = useRef<(tab: 'open' | 'in-progress' | 'closed') => void>(null);

  const deleteTicket = useCallback(async () => {
    if (!currentTicket || !user) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/tickets/${currentTicket.id}?userId=${user.id}`,
        {
          method: "DELETE",
        }
      );
      
      if (response.ok) {
        // Remove the ticket from local state
        const updatedTickets = tickets.filter(
          (ticket: any) => ticket.id !== currentTicket.id
        );
        
        setTickets(updatedTickets);
        
        // If there are still tickets in the current tab, select the first one
        const filteredTickets = user.role === 'doctor' 
          ? updatedTickets.filter((ticket: any) => ticket.status === activeTab)
          : updatedTickets;
          
        if (filteredTickets.length > 0) {
          setCurrentTicketIndex(0);
          handleTicketSelect(filteredTickets[0]);
        } else {
          // No tickets left in current tab
          setCurrentTicket(null);
          setCurrentTicketIndex(-1);
          
          // Check if there are tickets in other tabs and switch to them
          if (user.role === 'doctor' && handleTabChangeRef.current) {
            const openTickets = updatedTickets.filter((ticket: any) => ticket.status === 'open');
            const inProgressTickets = updatedTickets.filter((ticket: any) => ticket.status === 'in-progress');
            const closedTickets = updatedTickets.filter((ticket: any) => ticket.status === 'closed');
            
            if (activeTab !== 'open' && openTickets.length > 0) {
              handleTabChangeRef.current('open');
            } else if (activeTab !== 'in-progress' && inProgressTickets.length > 0) {
              handleTabChangeRef.current('in-progress');
            } else if (activeTab !== 'closed' && closedTickets.length > 0) {
              handleTabChangeRef.current('closed');
            }
            // If no tickets in any tab, stay on current tab with empty state
          }
        }
      } else {
        console.error("Failed to delete ticket");
        setDeleteError("Failed to delete ticket. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      setDeleteError("An error occurred while deleting the ticket.");
    }
  }, [currentTicket, user, tickets, activeTab, handleTicketSelect]);

  const handleTabChange = useCallback((tab: 'open' | 'in-progress' | 'closed') => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
    const filteredTickets = tickets.filter((ticket: any) => ticket.status === tab);
    if (filteredTickets.length > 0) {
      setCurrentTicketIndex(0);
      handleTicketSelect(filteredTickets[0]);
    } else {
      setCurrentTicket(null);
      setCurrentTicketIndex(-1);
    }
  }, [tickets, handleTicketSelect]);
  
  useEffect(() => {
    handleTabChangeRef.current = handleTabChange;
  }, [handleTabChange]);

  // Calculate pagination values
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  
  // Filter tickets by status tab for doctors, otherwise show all tickets for patients
  const filteredByTab = user?.role === 'doctor' 
    ? tickets.filter(ticket => ticket.status === activeTab)
    : tickets;
    
  const currentTickets = filteredByTab.slice(indexOfFirstTicket, indexOfLastTicket);
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredByTab.length / ticketsPerPage);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process keyboard shortcuts if we have tickets and a ticket is selected
      if (currentTickets.length === 0 || !currentTicket) return;
      
      // Prevent default behavior for our custom shortcuts
      if (['p', 'c', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      
      // Check if we're in an input field
      const activeElement = document.activeElement;
      const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).hasAttribute('contenteditable')
      );
      
      // Don't process shortcuts if we're in an input field
      if (isInputField) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // Direct key shortcuts (without Alt)
      switch (key) {
        case 'p': // P: Mark In Progress
          if (currentTicket && currentTicket.status === 'open' && user?.role === 'doctor') {
            updateTicketStatus('in-progress');
          }
          break;
        case 'c': // C: Close Ticket
          if (currentTicket && (currentTicket.status === 'open' || currentTicket.status === 'in-progress') && user?.role === 'doctor') {
            updateTicketStatus('closed');
          }
          break;
        case 'd': // D: Delete Ticket
          if (currentTicket && user?.role === 'doctor') {
            deleteTicket();
          }
          break;
        case 'arrowdown':
          // Move to next ticket within the current page
          const currentIndexInPage = currentTickets.findIndex(t => t.id === currentTicket?.id);
          if (currentIndexInPage < currentTickets.length - 1) {
            const nextTicket = currentTickets[currentIndexInPage + 1];
            const nextIndex = filteredByTab.findIndex(t => t.id === nextTicket.id);
            setCurrentTicketIndex(nextIndex);
            handleTicketSelect(nextTicket);
          }
          break;
        case 'arrowup':
          // Move to previous ticket within the current page
          const currentIdx = currentTickets.findIndex(t => t.id === currentTicket?.id);
          if (currentIdx > 0) {
            const prevTicket = currentTickets[currentIdx - 1];
            const prevIndex = filteredByTab.findIndex(t => t.id === prevTicket.id);
            setCurrentTicketIndex(prevIndex);
            handleTicketSelect(prevTicket);
          }
          break;
        case 'arrowright':
          // Move to next page
          if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            // Select first ticket on the new page
            const nextPageFirstTicketIndex = indexOfFirstTicket + ticketsPerPage;
            if (nextPageFirstTicketIndex < filteredByTab.length) {
              setCurrentTicketIndex(nextPageFirstTicketIndex);
              handleTicketSelect(filteredByTab[nextPageFirstTicketIndex]);
            }
          }
          break;
        case 'arrowleft':
          // Move to previous page
          if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            // Select first ticket on the new page
            const prevPageFirstTicketIndex = indexOfFirstTicket - ticketsPerPage;
            if (prevPageFirstTicketIndex >= 0) {
              setCurrentTicketIndex(prevPageFirstTicketIndex);
              handleTicketSelect(filteredByTab[prevPageFirstTicketIndex]);
            }
          }
          break;
        case 'tab':
          // Prevent default tab behavior
          e.preventDefault();
          
          // Only for doctors - cycle through tabs
          if (user?.role === 'doctor') {
            if (e.shiftKey) {
              // Shift+Tab: Move to previous tab
              if (activeTab === 'open') {
                handleTabChange('closed');
              } else if (activeTab === 'in-progress') {
                handleTabChange('open');
              } else if (activeTab === 'closed') {
                handleTabChange('in-progress');
              }
            } else {
              // Tab: Move to next tab
              if (activeTab === 'open') {
                handleTabChange('in-progress');
              } else if (activeTab === 'in-progress') {
                handleTabChange('closed');
              } else if (activeTab === 'closed') {
                handleTabChange('open');
              }
            }
          }
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentTicketIndex, currentTickets, filteredByTab, currentPage, totalPages, handleTicketSelect, currentTicket, indexOfFirstTicket, ticketsPerPage, activeTab, user?.role, handleTabChange, deleteTicket, updateTicketStatus]);

  // Add auto-scroll effect when a ticket is selected
  useEffect(() => {
    if (currentTicket) {
      // Find the selected ticket element
      const selectedTicket = document.querySelector('.ticket-list li.selected');
      if (selectedTicket) {
        // Scroll the selected ticket into view with smooth animation
        selectedTicket.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentTicket, currentTicketIndex, currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Select first ticket on the new page
      const nextPageFirstTicketIndex = indexOfFirstTicket + ticketsPerPage;
      if (nextPageFirstTicketIndex < filteredByTab.length) {
        setCurrentTicketIndex(nextPageFirstTicketIndex);
        handleTicketSelect(filteredByTab[nextPageFirstTicketIndex]);
      }
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Select first ticket on the new page
      const prevPageFirstTicketIndex = indexOfFirstTicket - ticketsPerPage;
      if (prevPageFirstTicketIndex >= 0) {
        setCurrentTicketIndex(prevPageFirstTicketIndex);
        handleTicketSelect(filteredByTab[prevPageFirstTicketIndex]);
      }
    }
  };

  return (
    <div className="ticket-view">
      <div className="ticket-list">
        <div className="ticket-list-header">
          <h3>
            <span className="back-link" onClick={() => navigate(-1)}>&lt;</span>
            Tickets
          </h3>
          {user?.role === 'doctor' && (
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'open' ? 'active' : ''}`} 
                onClick={() => handleTabChange('open')}
              >
                <i className="fas fa-question-circle"></i>
                Open
              </button>
              <button 
                className={`tab-button ${activeTab === 'in-progress' ? 'active' : ''}`} 
                onClick={() => handleTabChange('in-progress')}
              >
                <i className="fas fa-sync-alt"></i>
                In Progress
              </button>
              <button 
                className={`tab-button ${activeTab === 'closed' ? 'active' : ''}`} 
                onClick={() => handleTabChange('closed')}
              >
                <i className="fas fa-check-circle"></i>
                Closed
              </button>
            </div>
          )}
        </div>
        <ul>
          {currentTickets.length > 0 ? (
            currentTickets.map((ticket) => (
              <li 
                key={ticket.id} 
                onClick={() => handleTicketSelect(ticket)}
                className={currentTicket?.id === ticket.id ? "selected" : ""}
              >
                <div className="ticket-item">
                  <div className="ticket-title">
                    Ticket #{ticket.id.slice(-4)}
                  </div>
                  <div className="ticket-desc">
                    {ticket.description.length > 50 
                      ? `${ticket.description.substring(0, 50)}...` 
                      : ticket.description}
                  </div>
                  <div className="ticket-meta">
                    <span className="ticket-date">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      {patientDetails[ticket.patientId]?.username || "Loading..."}
                    </span>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="empty-state">
              <div className="empty-message">
                No {activeTab} tickets available
              </div>
            </li>
          )}
        </ul>
        <div className="pagination">
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            &laquo; Prev
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={nextPage} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next &raquo;
          </button>
        </div>
      </div>

      {currentTicket && (
        <div className="ticket-details">
          <div className="ticket-details-header">
            <h3>Ticket Details</h3>
          </div>
          <div className="ticket-navigation">
            <div 
              className={`nav-area nav-prev ${currentTicketIndex <= 0 ? 'disabled' : ''}`}
              onClick={currentTicketIndex > 0 ? handlePrevTicket : undefined}
            >
              <span className="nav-arrow">&#171;</span>
              <span className="nav-text">Previous</span>
            </div>
            <div className="ticket-count-indicator">
              {currentTicketIndex + 1} of {filteredByTab.length}
            </div>
            <div 
              className={`nav-area nav-next ${currentTicketIndex >= filteredByTab.length - 1 ? 'disabled' : ''}`}
              onClick={currentTicketIndex < filteredByTab.length - 1 ? handleNextTicket : undefined}
            >
              <span className="nav-text">Next</span>
              <span className="nav-arrow">&#187;</span>
            </div>
          </div>
          <div className="ticket-info">
            <p>
              <strong>Status:</strong> 
              <span className={`ticket-detail-status status-${currentTicket.status}`}>
                {currentTicket.status === "open" && <i className="fas fa-question-circle" />}
                {currentTicket.status === "in-progress" && <i className="fas fa-sync-alt" />}
                {currentTicket.status === "closed" && <i className="fas fa-check-circle" />}
                <span className="status-text">{currentTicket.status}</span>
              </span>
            </p>
            <p>
              <strong>Created By:</strong> 
              <span>
                {patientDetails[currentTicket.patientId] 
                  ? patientDetails[currentTicket.patientId].username 
                  : "Loading..."}
              </span>
            </p>
            <p>
              <strong>Created:</strong>
              <span>{new Date(currentTicket.createdAt).toLocaleString()}</span>
            </p>
            <p>
              <strong>Description:</strong> 
              <div className="ticket-description">{currentTicket.description}</div>
            </p>
          </div>

          {user && user.role === "doctor" && (
            <div className="ticket-actions">
              {currentTicket?.status === 'open' && (
                <button 
                  onClick={() => updateTicketStatus('in-progress')}
                  className="action-button in-progress"
                >
                  Mark In Progress <span className="shortcut-hint">P</span>
                </button>
              )}
              {(currentTicket?.status === 'open' || currentTicket?.status === 'in-progress') && (
                <button 
                  onClick={() => updateTicketStatus('closed')}
                  className="action-button closed"
                >
                  Close Ticket <span className="shortcut-hint">C</span>
                </button>
              )}
              <button 
                onClick={deleteTicket}
                className="action-button delete"
              >
                Delete Ticket <span className="shortcut-hint">D</span>
              </button>
            </div>
          )}
          
          <div className="action-log">
            <h4>Action Log</h4>
            {actions.length === 0 ? (
              <p>No actions recorded for this ticket.</p>
            ) : (
              <ul>
                {actions.map((action) => (
                  <li key={action.id}>
                    <span className="action-time">
                      {new Date(action.timestamp).toLocaleString()}
                    </span>
                    <span className="action-description">
                      {action.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {deleteError && <div className="error-message">{deleteError}</div>}
        </div>
      )}
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
    <div className="App">
      <Router>
        <AppContent 
          user={user} 
          handleLogin={handleLogin} 
          handleLogout={handleLogout} 
        />
      </Router>
    </div>
  );
}

function AppContent({ user, handleLogin, handleLogout }: { 
  user: User | null; 
  handleLogin: (userData: User) => void; 
  handleLogout: () => void;
}) {
  const navigate = useNavigate();
  
  return (
    <div className="container">
      <Header 
        user={user} 
        onLogin={() => navigate("/login")} 
        onLogout={handleLogout} 
      />
      <Routes>
        <Route path="/" element={user ? <Welcome /> : <LoginSignup onLogin={handleLogin} />} />
        <Route path="/login" element={<LoginSignup onLogin={handleLogin} />} />
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
    </div>
  );
}

export default App;
