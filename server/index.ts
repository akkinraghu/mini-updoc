import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*'  // Allow all origins for now
}));
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Updoc API is running');
});

// Models (in-memory for now)
interface User {
  id: string;
  username: string;
  password: string;
  role: 'patient' | 'doctor';
}

interface Ticket {
  id: string;
  patientId: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface Action {
  id: string;
  ticketId: string;
  userId: string;
  description: string;
  timestamp: Date;
}

// In-memory storage
const users: User[] = [];
const tickets: Ticket[] = [];
const actions: Action[] = [];

// User routes
app.post('/api/signup_or_login', (req, res) => {
  const { username, password, role } = req.body;
  
  // Check if user exists
  let user = users.find(u => u.username === username);
  
  if (user) {
    // Login
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } else {
    // Signup
    user = {
      id: Date.now().toString(),
      username,
      password,
      role: role || 'patient'
    };
    users.push(user);
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json(userWithoutPassword);
});

app.get('/api/users', (req, res) => {
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  res.json(usersWithoutPasswords);
});

// Ticket routes
app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const { patientId, description } = req.body;
  
  const newTicket: Ticket = {
    id: Date.now().toString(),
    patientId,
    description,
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  tickets.push(newTicket);
  
  // Log action
  const action: Action = {
    id: Date.now().toString(),
    ticketId: newTicket.id,
    userId: patientId,
    description: 'Ticket created',
    timestamp: new Date()
  };
  
  actions.push(action);
  
  res.status(201).json(newTicket);
});

app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;
  
  const ticketIndex = tickets.findIndex(t => t.id === id);
  
  if (ticketIndex === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }
  
  tickets[ticketIndex] = {
    ...tickets[ticketIndex],
    status,
    updatedAt: new Date()
  };
  
  // Log action
  const action: Action = {
    id: Date.now().toString(),
    ticketId: id,
    userId,
    description: `Ticket status updated to ${status}`,
    timestamp: new Date()
  };
  
  actions.push(action);
  
  res.json(tickets[ticketIndex]);
});

// Delete ticket endpoint
app.delete('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  // For DELETE requests, Express doesn't parse the body by default
  // so we'll get the userId from query params instead
  const userId = req.query.userId as string;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  
  const ticketIndex = tickets.findIndex(t => t.id === id);
  
  if (ticketIndex === -1) {
    return res.status(404).json({ message: 'Ticket not found' });
  }
  
  // Store ticket info before deletion for logging
  const deletedTicket = tickets[ticketIndex];
  
  // Remove the ticket
  tickets.splice(ticketIndex, 1);
  
  // Log action
  const action: Action = {
    id: Date.now().toString(),
    ticketId: id,
    userId,
    description: `Ticket deleted`,
    timestamp: new Date()
  };
  
  actions.push(action);
  
  res.status(200).json({ message: 'Ticket deleted successfully' });
});

// Action routes
app.get('/api/tickets/:id/actions', (req, res) => {
  const { id } = req.params;
  
  const ticketActions = actions.filter(a => a.ticketId === id);
  
  res.json(ticketActions);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
